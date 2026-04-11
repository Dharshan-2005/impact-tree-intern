import { useState, useEffect } from "react";

const API = "http://localhost:8000";

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Zones() {
  const [zones, setZones]   = useState([]);
  const [form, setForm]     = useState({ label: "", x1: "", y1: "", x2: "", y2: "" });
  const [error, setError]   = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchZones = async () => {
    try {
      const res = await fetch(`${API}/api/zones`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setZones(await res.json());
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { fetchZones(); }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  };

  const handleAdd = async () => {
    const { label, x1, y1, x2, y2 } = form;
    if (!x1 || !y1 || !x2 || !y2) { setError("Fill in all coordinate fields"); return; }
    setError(null);
    setLoading(true);
    try {
      const body = {
        id: genId(),
        label: label || "Red Zone",
        x1: parseInt(x1), y1: parseInt(y1),
        x2: parseInt(x2), y2: parseInt(y2),
      };
      const res = await fetch(`${API}/api/zones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      setZones(data.zones);
      setForm({ label: "", x1: "", y1: "", x2: "", y2: "" });
      showSuccess("Zone added successfully");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setError(null);
    try {
      const res = await fetch(`${API}/api/zones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      setZones(data.zones);
      showSuccess("Zone removed");
    } catch (e) {
      setError(e.message);
    }
  };

  const field = (key, label, placeholder, type = "text") => (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-[#4b5563] mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-[#161b22] border border-[#2d333b] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] placeholder-[#374151] focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors font-mono"
      />
    </div>
  );

  // Mini canvas preview
  const maxCoord = 640;
  const previewW = 320, previewH = 200;

  return (
    <div className="p-8 min-h-screen font-['Syne',sans-serif]">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-[#e6edf3]">Red Zones</h1>
        <p className="text-sm text-[#4b5563] mt-1 tracking-wide">
          Define restricted areas in pixel coordinates · triggers geofence alerts in the pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Add zone form */}
        <div className="rounded-2xl border border-[#1c2330] bg-[#0d1117] p-6 flex flex-col gap-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6b7280]">Add New Zone</p>

          {field("label", "Label", "e.g. Danger Zone A")}

          <div className="grid grid-cols-2 gap-3">
            {field("x1", "X1 (left)", "0", "number")}
            {field("y1", "Y1 (top)", "0", "number")}
            {field("x2", "X2 (right)", "200", "number")}
            {field("y2", "Y2 (bottom)", "200", "number")}
          </div>

          {/* Live preview */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#4b5563] mb-2">Preview</p>
            <div
              className="relative rounded-xl bg-[#161b22] border border-[#2d333b] overflow-hidden"
              style={{ width: previewW, height: previewH }}
            >
              {/* Existing zones */}
              {zones.map((z) => (
                <div
                  key={z.id}
                  className="absolute border border-red-500/50 bg-red-500/15"
                  style={{
                    left:   (z.x1 / maxCoord) * previewW,
                    top:    (z.y1 / maxCoord) * previewH,
                    width:  ((z.x2 - z.x1) / maxCoord) * previewW,
                    height: ((z.y2 - z.y1) / maxCoord) * previewH,
                  }}
                >
                  <span className="absolute top-0.5 left-1 text-[8px] text-red-300 font-bold truncate">{z.label}</span>
                </div>
              ))}
              {/* New zone preview */}
              {form.x1 && form.y1 && form.x2 && form.y2 && (
                <div
                  className="absolute border-2 border-dashed border-amber-400/70 bg-amber-400/10"
                  style={{
                    left:   (parseInt(form.x1) / maxCoord) * previewW,
                    top:    (parseInt(form.y1) / maxCoord) * previewH,
                    width:  ((parseInt(form.x2) - parseInt(form.x1)) / maxCoord) * previewW,
                    height: ((parseInt(form.y2) - parseInt(form.y1)) / maxCoord) * previewH,
                  }}
                />
              )}
              <p className="absolute bottom-1 right-2 text-[8px] text-[#374151] font-mono">{maxCoord}×{maxCoord} px space</p>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">⚠ {error}</div>
          )}
          {success && (
            <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">✓ {success}</div>
          )}

          <button
            onClick={handleAdd}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-sm font-bold uppercase tracking-widest transition-all duration-150 disabled:opacity-50"
          >
            {loading ? "Adding…" : "⛔ Add Zone"}
          </button>
        </div>

        {/* Zone list */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#4b5563] mb-3">
            Active Zones ({zones.length})
          </p>

          {zones.length === 0 ? (
            <div className="rounded-2xl border border-[#1c2330] bg-[#0d1117] p-10 text-center text-[#374151] text-sm">
              No red zones defined yet
            </div>
          ) : (
            <div className="space-y-3">
              {zones.map((z) => (
                <div
                  key={z.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 group hover:border-red-500/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2 h-2 rounded-sm bg-red-500/60 flex-shrink-0" />
                      <span className="text-sm font-bold text-[#c9d1d9] truncate">{z.label}</span>
                    </div>
                    <p className="text-xs font-mono text-[#4b5563]">
                      ({z.x1}, {z.y1}) → ({z.x2}, {z.y2})
                      <span className="ml-2 text-[#374151]">
                        {z.x2 - z.x1}×{z.y2 - z.y1}px
                      </span>
                    </p>
                    <p className="text-[10px] text-[#2d333b] mt-0.5 font-mono">id: {z.id}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(z.id)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-colors uppercase tracking-wide font-bold opacity-60 group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}