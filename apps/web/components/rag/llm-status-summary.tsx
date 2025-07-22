import { useStatusData } from "../../hooks/use-consolidated-health-check";

export const LLMStatusSummary = () => {
  const { consolidatedLLMMetrics, loading } = useStatusData();
  
  const services = consolidatedLLMMetrics?.services;
  const summary = consolidatedLLMMetrics?.summary;

  const getStatusColor = (status: string, ready: boolean) => {
    if (!ready) return "text-slate-500";
    switch (status) {
      case 'healthy': return "text-emerald-500";
      case 'loading': return "text-amber-500";
      case 'error': return "text-red-500";
      default: return "text-slate-500";
    }
  };

  const getStatusBadge = (status: string, ready: boolean) => {
    if (!ready) return "bg-slate-500/20 text-slate-400";
    switch (status) {
      case 'healthy': return "bg-emerald-500/20 text-emerald-400";
      case 'loading': return "bg-amber-500/20 text-amber-400";
      case 'error': return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  if (loading.consolidatedLLM || !consolidatedLLMMetrics) {
    return (
      <div className="p-4 rounded-lg border border-slate-800 bg-slate-950">
        <div className="animate-pulse">
          <div className="mb-3 w-1/3 h-4 rounded bg-slate-800"></div>
          <div className="space-y-2">
            <div className="w-full h-3 rounded bg-slate-800"></div>
            <div className="w-2/3 h-3 rounded bg-slate-800"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-slate-800 bg-slate-950">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-slate-200">LLM Services</h3>
        {summary && (
          <div className="text-xs text-slate-400">
            {summary.healthyServices}/{summary.totalServices} healthy
          </div>
        )}
      </div>

      <div className="space-y-3">
        {services && (
          <>
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <div className={`w-2 h-2 rounded-full ${
                  services.vector.ready ? 'bg-emerald-500' : 'bg-slate-500'
                }`} />
                <span className="text-sm text-slate-300">Vector Service</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(services.vector.status, services.vector.ready)}`}>
                  {services.vector.status}
                </span>
                {services.vector.memory_usage?.process_memory_mb && (
                  <span className="font-mono text-xs text-slate-400">
                    {(services.vector.memory_usage.process_memory_mb as number).toFixed(0)}MB
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <div className={`w-2 h-2 rounded-full ${
                  services.chat.ready ? 'bg-emerald-500' : 'bg-slate-500'
                }`} />
                <span className="text-sm text-slate-300">Chat Service</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(services.chat.status, services.chat.ready)}`}>
                  {services.chat.status}
                </span>
                {services.chat.memory_usage?.rss_mb && (
                  <span className="font-mono text-xs text-slate-400">
                    {(services.chat.memory_usage.rss_mb as number).toFixed(0)}MB
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {summary && (
          <div className="pt-2 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Total Memory:</span>
                <span className="ml-1 font-mono text-slate-200">
                  {(summary.totalMemoryMB as number).toFixed(0)}MB
                </span>
              </div>
              <div>
                <span className="text-slate-400">Avg CPU:</span>
                <span className="ml-1 font-mono text-slate-200">
                  {(summary.averageCPU as number).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};