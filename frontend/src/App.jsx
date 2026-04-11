import { useState, useRef, useEffect } from "react";

// 👇 JUST THIS LINE CHANGED 👇
const API = "https://dharshan2005711--aass-safety-supervisor-serve-fastapi.modal.run";

export default function App() {
  const [frame, setFrame] = useState(null);
  const [meta, setMeta] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    fetch(`${API}/api/metrics`)
      .then(r => r.json())
      .then(setMetrics)
      .catch(err => console.error("Failed to fetch metrics:", err));
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        body: form,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop();

        for (const p of parts) {
          if (!p.trim()) continue;
          try {
            const data = JSON.parse(p);
            setFrame(data.image_b64);
            setMeta(data.metadata);
          } catch (e) {
            console.error("Error parsing NDJSON chunk", e);
          }
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper for status colors
  const getStatusColor = (status) => {
    if (status === 'SAFE') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (status === 'WARNING') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="font-bold text-white tracking-tighter">AI</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">AASS <span className="font-light text-slate-400">Supervisor</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              System Online
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        
        {/* Upload State */}
        {!frame && (
          <div className="min-h-[70vh] flex flex-col items-center justify-center">
            <div className="text-center mb-10 space-y-4 max-w-2xl">
              <h2 className="text-4xl font-extrabold text-white tracking-tight">Deploy Autonomous Over-watch</h2>
              <p className="text-lg text-slate-400">Initialize context-aware spatial reasoning and kinematic analysis by feeding a live camera stream or video file.</p>
            </div>

            <div
              onClick={() => inputRef.current.click()}
              className="group relative w-full max-w-xl cursor-pointer overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-12 text-center transition-all hover:border-cyan-500/50 hover:bg-slate-800/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="rounded-full bg-slate-800 p-4 group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <div className="text-xl font-semibold text-white mb-1">Click to Upload Video Feed</div>
                  <div className="text-sm text-slate-500 font-mono">MP4, AVI, MOV, JPG, PNG</div>
                </div>
              </div>
              <input ref={inputRef} type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleFile(e.target.files[0])} />
            </div>
            
            {isProcessing && <div className="mt-8 text-cyan-400 animate-pulse tracking-widest font-mono text-sm">INITIALIZING INFERENCE ENGINE...</div>}
          </div>
        )}

        {/* Dashboard State */}
        {frame && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Left Column: Video Feed */}
            <div className="xl:col-span-3 space-y-6">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <span className="bg-black/60 backdrop-blur text-white text-xs px-3 py-1.5 rounded border border-white/10 font-mono tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> REC
                  </span>
                  <span className="bg-black/60 backdrop-blur text-cyan-400 text-xs px-3 py-1.5 rounded border border-white/10 font-mono">
                    FPS: 30
                  </span>
                </div>
                <img src={`data:image/jpeg;base64,${frame}`} className="w-full h-auto object-contain max-h-[75vh]" alt="Inference Stream" />
              </div>

              {/* Metrics Footer */}
              {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Precision", value: metrics.precision },
                    { label: "Recall", value: metrics.recall },
                    { label: "F1 Score", value: metrics.f1 },
                    { label: "mAP50", value: metrics.map50 }
                  ].map((m, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-center items-center">
                      <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">{m.label}</span>
                      <span className="text-cyan-400 font-mono text-lg">{m.value.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Telemetry & Analysis */}
            <div className="flex flex-col gap-6 h-[85vh]">
              
              {/* Scene Context Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-shrink-0">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4 border-b border-slate-800 pb-2">Environment Context</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Detected Zone</div>
                    <div className="text-white font-medium uppercase tracking-wide">{meta?.scene || 'AWAITING VLM...'}</div>
                  </div>
                  
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Facility Global Status</div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold border tracking-wider ${getStatusColor(meta?.global_status)}`}>
                      {meta?.global_status || 'UNKNOWN'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-sm mb-1">Required Active PPE</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {meta?.requirements?.map(req => (
                        <span key={req} className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2 py-1 rounded-md font-mono">
                          {req}
                        </span>
                      )) || <span className="text-slate-600 text-xs">Analyzing...</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Worker Telemetry Scrollable Area */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl flex-1">
                <div className="p-5 border-b border-slate-800 bg-slate-900/80 backdrop-blur z-10 sticky top-0">
                  <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold flex justify-between items-center">
                    Subject Telemetry
                    <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px]">{meta?.workers?.length || 0} DETECTED</span>
                  </h3>
                </div>
                
                <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                  {meta?.workers && meta.workers.length > 0 ? (
                    meta.workers.map((w, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 relative overflow-hidden">
                        {/* Status accent line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          w.status === 'SAFE' ? 'bg-emerald-500' : w.status === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}></div>
                        
                        <div className="flex justify-between items-center mb-3 pl-2">
                          <span className="font-mono text-sm text-slate-300">ID-{1000 + i}</span>
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${getStatusColor(w.status)}`}>
                            {w.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 pl-2">
                          {w.status === 'SAFE' && (
                            <p className="text-xs text-emerald-400 flex items-center gap-2 font-medium">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Fully Compliant
                            </p>
                          )}
                          
                          {w.missing_ppe.length > 0 && (
                            <div className="text-xs text-amber-400 bg-amber-400/5 rounded p-2 border border-amber-400/10">
                              <span className="font-bold flex items-center gap-1 mb-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> MISSING GEAR</span>
                              <span className="text-slate-400 ml-4 font-mono">{w.missing_ppe.join(", ")}</span>
                            </div>
                          )}
                          
                          {w.proximity_alert && (
                            <div className="text-xs text-amber-500 font-bold bg-amber-500/5 rounded p-2 border border-amber-500/10 flex items-center gap-2 animate-pulse">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              DANGER: MACHINERY PROXIMITY
                            </div>
                          )}
                          
                          {w.is_fallen && (
                            <div className="text-xs text-rose-500 font-bold bg-rose-500/5 rounded p-2 border border-rose-500/20 flex items-center gap-2 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              CRITICAL: FALL DETECTED
                            </div>
                          )}
                          
                          {w.bad_posture && (
                            <div className="text-xs text-purple-400 bg-purple-400/5 rounded p-2 border border-purple-400/10 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                              ERGONOMIC RISK: KINEMATIC STRAIN
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                      <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      <p className="text-sm font-mono tracking-widest">NO PERSONNEL DETECTED</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Basic custom scrollbar styles injected safely */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1);
        }
      `}} />
    </div>
  );
}