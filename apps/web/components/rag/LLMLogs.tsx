"use client";
import React, { useEffect, useState } from "react";

export function LLMLogs() {
  const [logs, setLogs] = useState<{ timestamp: number; message: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/llm/logs");
        const data = await res.json();
        setLogs(data.logs || []);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 max-h-64 overflow-y-auto">
      <div className="text-slate-50 text-xs mb-2 font-bold">LLM Error Logs</div>
      {loading && <div className="text-slate-500 text-xs">Loading...</div>}
      {logs.length === 0 && !loading && (
        <div className="text-slate-500 text-xs">No recent errors.</div>
      )}
      <ul className="space-y-1">
        {logs.map((log, i) => (
          <li key={i} className="text-xs text-slate-400 font-mono">
            <span className="text-slate-600">
              {new Date(log.timestamp).toLocaleTimeString()}:
            </span>{" "}
            <span className="text-slate-50">{log.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
