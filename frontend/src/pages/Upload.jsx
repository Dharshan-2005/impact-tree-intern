import { useState, useRef, useCallback } from "react";

const API = "http://localhost:8000";

const STATUS_COLORS = {
  SAFE:      { ring: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  WARNING:   { ring: "border-amber-400/40",   bg: "bg-amber-400/10",   text: "text-amber-400"   },
  EMERGENCY: { ring: "border-red-500/60",     bg: "bg-red-500/15",     text: "text-red-400"     },
  IDLE:      { ring: "border-[#2d333b]",      bg: "bg-[#161b22]",      text: "text-[#6b7280]"   },
};

export default function Upload() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/api/upload`, { method: "POST", body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const meta = result?.metadata;
  const status = meta?.global_status || "IDLE";
  const s = STATUS_COLORS[status] || STATUS_COLORS.IDLE;

  return (
    <div className="p-8 min-h-screen font-['Syne',sans-serif]">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-[#e6edf3]">Inspect Frame</h1>
        <p className="text-sm text-[#4b5563] mt-1 tracking-wide">
          Upload an image or video — the backend extracts the first frame and runs the full AASS pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Drop zone */}
        <div className="flex flex-col gap-4">
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-4 py-16 px-8 text-center
              ${dragging
                ? "border-red-400/60 bg-red-500/10"
                : "border-[#2d333b] bg-[#0d1117] hover:border-[#444c56] hover:bg-[#161b22]"
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {loading ? (
              <>
                <div className="w-12 h-12 rounded-full border-2 border-red-500/20 border-t-red-400 animate-spin" />
                <p className="text-sm text-[#6b7280]">Running inference…</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#161b22] border border-[#2d333b] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#4b5563]" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#c9d1d9]">Drop image or video here</p>
                  <p className="text-xs text-[#4b5563] mt-1">or click to browse · JPEG, PNG, MP4, MOV…</p>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              ⚠ {error}
            </div>
          )}

          {/* Metadata panel */}
          {meta && (
            <div className={`rounded-2xl border ${s.ring} ${s.bg} p-5 space-y-4`}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-[#4b5563]">Analysis Result</p>
                <span className={`text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full border ${s.ring} ${s.text}`}>
                  {status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Scene" value={meta.scene} />
                <Stat label="Risk Score" value={(meta.global_score || 0).toFixed(2)} mono />
                <Stat label="Workers" value={meta.worker_count} />
                <Stat label="Required PPE" value={meta.requirements?.join(", ") || "None"} />
              </div>

              {/* Workers breakdown */}
              {meta.workers?.length > 0 && (
                <div className="pt-3 border-t border-[#1c2330] space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#4b5563]">Workers</p>
                  {meta.workers.map((w, i) => (
                    <div key={i} className="flex flex-wrap items-start gap-2 text-xs">
                      <span className="text-[#6b7280]">#{i + 1}</span>
                      <span className={STATUS_COLORS[w.status]?.text || "text-[#c9d1d9]"}>{w.status}</span>
                      {w.missing_ppe?.map((p) => (
                        <span key={p} className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/20 uppercase text-[10px]">
                          {p}
                        </span>
                      ))}
                      {w.proximity_label && (
                        <span className="text-amber-300 text-[10px]">{w.proximity_label}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Geofence events */}
              {meta.geofence_events?.length > 0 && (
                <div className="pt-3 border-t border-[#1c2330]">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#4b5563] mb-2">Geofence Events</p>
                  <div className="space-y-1.5">
                    {meta.geofence_events.map((ev, i) => (
                      <div key={i} className={`text-xs px-3 py-1.5 rounded-lg border flex gap-2
                        ${ev.status === "BREACH" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>
                        <span className="font-bold uppercase">{ev.status}</span>
                        <span className="opacity-80">{ev.zone}{ev.distance_px != null ? ` · ${ev.distance_px}px away` : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Annotated frame */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#4b5563]">Annotated Output</p>
          <div className="flex-1 rounded-2xl border border-[#1c2330] bg-[#0d1117] overflow-hidden flex items-center justify-center min-h-80">
            {result?.image_b64 ? (
              <img
                src={`data:image/jpeg;base64,${result.image_b64}`}
                alt="Annotated frame"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-[#2d333b]">
                <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p className="text-sm">Annotated frame appears here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, mono }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#4b5563] mb-0.5">{label}</p>
      <p className={`text-sm text-[#c9d1d9] ${mono ? "font-mono" : "font-medium"}`}>{value ?? "—"}</p>
    </div>
  );
}