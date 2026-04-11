import { useEffect, useState, useRef } from "react";

const API = "http://localhost:8000";

const STATUS_COLORS = {
  SAFE:      { ring: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-[0_0_12px_#10b98140]" },
  WARNING:   { ring: "border-amber-400/40",   bg: "bg-amber-400/10",   text: "text-amber-400",   glow: "shadow-[0_0_12px_#fbbf2440]" },
  EMERGENCY: { ring: "border-red-500/60",     bg: "bg-red-500/15",     text: "text-red-400",     glow: "shadow-[0_0_16px_#ef444460]" },
  IDLE:      { ring: "border-[#2d333b]",      bg: "bg-[#161b22]",      text: "text-[#6b7280]",   glow: "" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.IDLE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border ${s.ring} ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "EMERGENCY" ? "bg-red-400 animate-pulse" : status === "WARNING" ? "bg-amber-400" : "bg-emerald-400"}`} />
      {status}
    </span>
  );
}

function Gauge({ value, max = 30, label }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct > 66 ? "#ef4444" : pct > 33 ? "#fbbf24" : "#10b981";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs text-[#6b7280]">
        <span className="uppercase tracking-widest">{label}</span>
        <span className="font-mono text-[#c9d1d9]">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-[#1c2330] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
        />
      </div>
    </div>
  );
}

function WorkerCard({ worker, idx }) {
  const status = worker.status || "SAFE";
  const s = STATUS_COLORS[status] || STATUS_COLORS.SAFE;
  return (
    <div className={`rounded-xl border ${s.ring} ${s.bg} ${s.glow} p-4 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold tracking-widest text-[#4b5563] uppercase">Worker #{idx + 1}</span>
        <StatusBadge status={status} />
      </div>

      {worker.missing_ppe?.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] uppercase tracking-widest text-[#6b7280] mb-1">Missing PPE</p>
          <div className="flex flex-wrap gap-1">
            {worker.missing_ppe.map((ppe) => (
              <span key={ppe} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-red-500/20 text-red-300 border border-red-500/20 uppercase tracking-wide">
                {ppe}
              </span>
            ))}
          </div>
        </div>
      )}

      {worker.proximity_label && (
        <p className="text-xs text-amber-300 mt-1 flex items-center gap-1.5">
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="12 2 2 22 22 22" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {worker.proximity_label}
        </p>
      )}

      {worker.is_near_machinery && !worker.proximity_label && (
        <p className="text-xs text-amber-400 mt-1">⚠ Near machinery</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [meta, setMeta] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchMeta = async () => {
    try {
      const res = await fetch(`${API}/api/metadata`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMeta(data);
      setError(null);
      setHistory((h) => [...h.slice(-29), { score: data.global_score || 0, time: Date.now() }]);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchMeta();
    intervalRef.current = setInterval(fetchMeta, 2000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const status = meta?.global_status || "IDLE";
  const s = STATUS_COLORS[status] || STATUS_COLORS.IDLE;

  const svgW = 400, svgH = 64;
  const points = history.map((h, i) => {
    const x = (i / 29) * svgW;
    const y = svgH - (h.score / 30) * svgH;
    return `${x},${Math.max(2, Math.min(svgH - 2, y))}`;
  }).join(" ");

  return (
    <div className="p-8 min-h-screen font-['Syne',sans-serif]">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#e6edf3]">Live Monitor</h1>
          <p className="text-sm text-[#4b5563] mt-1 tracking-wide">
            Auto-refreshes every 2s · {meta?.scene || "Awaiting input"}
          </p>
        </div>
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
            ⚠ {error} — is the backend running?
          </div>
        )}
      </div>

      {/* Global status card */}
      <div className={`rounded-2xl border ${s.ring} ${s.bg} ${s.glow} p-6 mb-6 transition-all duration-500`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-2">Global Status</p>
            <StatusBadge status={status} />
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-1">Risk Score</p>
            <p className={`text-4xl font-black font-mono ${s.text}`}>
              {(meta?.global_score || 0).toFixed(1)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-1">Workers Detected</p>
            <p className="text-4xl font-black font-mono text-[#c9d1d9]">{meta?.worker_count ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-1">Scene</p>
            <p className="text-sm font-semibold text-[#c9d1d9] max-w-[160px] text-right">{meta?.scene || "—"}</p>
          </div>
        </div>

        {/* Sparkline */}
        {history.length > 1 && (
          <div className="mt-5 pt-4 border-t border-[#1c2330]">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#374151] mb-2">Risk score history (60s)</p>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-12" preserveAspectRatio="none">
              <defs>
                <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={status === "EMERGENCY" ? "#ef4444" : status === "WARNING" ? "#fbbf24" : "#10b981"} stopOpacity="0.3" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,${svgH} ${points} ${svgW},${svgH}`}
                fill="url(#spark)"
              />
              <polyline
                points={points}
                fill="none"
                stroke={status === "EMERGENCY" ? "#ef4444" : status === "WARNING" ? "#fbbf24" : "#10b981"}
                strokeWidth="1.5"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Workers */}
        <div className="xl:col-span-2">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-3">Workers</p>
          {!meta?.workers?.length ? (
            <div className="rounded-xl border border-[#1c2330] bg-[#0d1117] p-8 text-center text-[#374151] text-sm">
              No workers detected — upload a frame to begin analysis
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {meta.workers.map((w, i) => <WorkerCard key={i} worker={w} idx={i} />)}
            </div>
          )}
        </div>

        {/* Sidebar panels */}
        <div className="flex flex-col gap-6">
          {/* Required PPE */}
          <div className="rounded-xl border border-[#1c2330] bg-[#0d1117] p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-3">Required PPE</p>
            {meta?.requirements?.length ? (
              <div className="flex flex-wrap gap-2">
                {meta.requirements.map((r) => (
                  <span key={r} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase tracking-wide">
                    {r}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#374151]">None specified</p>
            )}
          </div>

          {/* Geofence events */}
          <div className="rounded-xl border border-[#1c2330] bg-[#0d1117] p-5 flex-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-3">Geofence Events</p>
            {meta?.geofence_events?.length ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {meta.geofence_events.map((ev, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg border ${
                      ev.status === "BREACH"
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    <span className="font-bold uppercase tracking-wide flex-shrink-0">{ev.status}</span>
                    <span className="text-[11px] opacity-80">{ev.zone}{ev.distance_px != null ? ` · ${ev.distance_px}px` : ""}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#374151]">No geofence events</p>
            )}
          </div>

          {/* Score gauge */}
          <div className="rounded-xl border border-[#1c2330] bg-[#0d1117] p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-4">Risk Level</p>
            <Gauge value={meta?.global_score || 0} max={30} label="Score" />
          </div>
        </div>
      </div>
    </div>
  );
}