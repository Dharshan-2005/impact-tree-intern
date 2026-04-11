import { useState, useEffect } from "react";

const API = "http://localhost:8000";

const METRIC_META = {
  precision: { label: "Precision",   desc: "Ratio of true positives to all predicted positives",  color: "#60a5fa", max: 1 },
  recall:    { label: "Recall",      desc: "Ratio of true positives to all actual positives",      color: "#34d399", max: 1 },
  f1:        { label: "F1 Score",    desc: "Harmonic mean of Precision and Recall",                color: "#a78bfa", max: 1 },
  map50:     { label: "mAP@50",      desc: "Mean Average Precision at IoU threshold 0.50",        color: "#fb923c", max: 1 },
  map50_95:  { label: "mAP@50:95",   desc: "mAP averaged across IoU thresholds 0.50 – 0.95",     color: "#f472b6", max: 1 },
};

function Ring({ value, color, size = 96 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, value);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1c2330" strokeWidth="6" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

function MetricCard({ metricKey, value }) {
  const m = METRIC_META[metricKey];
  if (!m) return null;
  const pct = Math.round(value * 100);

  return (
    <div className="rounded-2xl border border-[#1c2330] bg-[#0d1117] p-6 hover:border-[#2d333b] transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-1">{m.label}</p>
          <p className="text-4xl font-black font-mono" style={{ color: m.color }}>
            {pct}<span className="text-xl text-[#4b5563]">%</span>
          </p>
          <p className="text-xs text-[#374151] mt-2 leading-relaxed">{m.desc}</p>
        </div>
        <div className="relative flex-shrink-0">
          <Ring value={value} color={m.color} />
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono rotate-90"
            style={{ color: m.color }}
          >
            {value.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="mt-4 h-1 bg-[#1c2330] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: m.color, boxShadow: `0 0 8px ${m.color}60` }}
        />
      </div>
    </div>
  );
}

function CompareBar({ metrics }) {
  const keys = Object.keys(METRIC_META);
  return (
    <div className="rounded-2xl border border-[#1c2330] bg-[#0d1117] p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-5">All Metrics Compared</p>
      <div className="space-y-4">
        {keys.map((k) => {
          const m = METRIC_META[k];
          const v = metrics[k] ?? 0;
          return (
            <div key={k}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#6b7280] uppercase tracking-wide">{m.label}</span>
                <span className="font-mono font-bold" style={{ color: m.color }}>{(v * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-[#161b22] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${v * 100}%`, backgroundColor: m.color, boxShadow: `0 0 6px ${m.color}60` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Metrics() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetch(`${API}/api/metrics`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setMetrics)
      .catch((e) => setError(e.message));
  }, []);

  // Fallback to hardcoded values (from aass_engine.py)
  const m = metrics || {
    precision: 0.913,
    recall:    0.897,
    f1:        0.905,
    map50:     0.921,
    map50_95:  0.784,
  };

  const avg = Object.values(m).reduce((a, b) => a + b, 0) / Object.keys(m).length;

  return (
    <div className="p-8 min-h-screen font-['Syne',sans-serif]">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#e6edf3]">Model Metrics</h1>
          <p className="text-sm text-[#4b5563] mt-1 tracking-wide">
            YOLOv8 PPE detection model · training validation scores
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#4b5563] mb-1">Avg Score</p>
          <p className="text-3xl font-black font-mono text-[#c9d1d9]">{(avg * 100).toFixed(1)}<span className="text-lg text-[#4b5563]">%</span></p>
        </div>
      </div>

      {error && (
        <div className="mb-6 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
          ⚠ Could not reach backend ({error}) — showing static metrics from aass_engine.py
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
        {Object.keys(METRIC_META).map((k) => (
          <MetricCard key={k} metricKey={k} value={m[k] ?? 0} />
        ))}
      </div>

      <CompareBar metrics={m} />

      {/* Legend */}
      <div className="mt-6 rounded-xl border border-[#1c2330] bg-[#0d1117] p-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-3">Interpretation Guide</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-xs text-[#4b5563]">
          <p><span className="text-[#c9d1d9] font-semibold">Precision</span> — when the model flags PPE missing, how often is it correct?</p>
          <p><span className="text-[#c9d1d9] font-semibold">Recall</span> — of all actual PPE violations, how many does the model catch?</p>
          <p><span className="text-[#c9d1d9] font-semibold">F1</span> — balanced score combining precision and recall.</p>
          <p><span className="text-[#c9d1d9] font-semibold">mAP@50</span> — detection accuracy at a lenient IoU threshold.</p>
          <p><span className="text-[#c9d1d9] font-semibold">mAP@50:95</span> — detection accuracy across stricter thresholds — the gold standard.</p>
        </div>
      </div>
    </div>
  );
}