import { motion } from "framer-motion";
import type React from "react";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Activity, Database } from "lucide-react";
import { useServiceStatusHistory } from "../../hooks/use-service-status-history";
import { Card } from "../ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { ScrollArea } from "../ui/scroll-area";

interface LLMUsageBarChartProps {
  maxSamples?: number;
  showExpandedByDefault?: boolean;
}

export const LLMUsageBarChart: React.FC<LLMUsageBarChartProps> = ({
  maxSamples = 30,
  showExpandedByDefault = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(showExpandedByDefault);
  const [selectedService, setSelectedService] = useState<'all' | 'vector' | 'chat'>('all');
  const [historyLimit, setHistoryLimit] = useState(20);
  const { latestStatuses, serviceSummaries, historicalData, systemHealth, isLoading, allStatuses } = useServiceStatusHistory();

  // Map service names to display names and colors
  const serviceConfig = {
    'vector-convert-llm': {
      displayName: 'Vector',
      memoryColor: '#10b981', // emerald-500
      cpuColor: '#06b6d4', // cyan-500
    },
    'lightweight-llm': {
      displayName: 'Chat',
      memoryColor: '#f59e0b', // amber-500
      cpuColor: '#ef4444', // red-500
    },
  };

  // Get current service metrics
  const services = useMemo(() => {
    const result: Record<string, any> = {};
    
    latestStatuses.forEach(status => {
      const config = serviceConfig[status.serviceName as keyof typeof serviceConfig];
      if (config) {
        result[status.serviceName] = {
          displayName: config.displayName,
          memory: status.memoryUsage?.processMemoryMb || 0,
          cpu: status.memoryUsage?.processCpuPercent || 0,
          status: status.status,
          ready: status.ready,
          uptime: status.uptime || 0,
          lastUpdated: status.timestamp,
        };
      }
    });
    
    return result;
  }, [latestStatuses]);

  // Prepare chart data from the last entries in allStatuses based on historyLimit
  const chartData = useMemo(() => {
    if (!allStatuses || allStatuses.length === 0) {
      return {
        vector: [],
        chat: []
      };
    }

    // Get the last entries based on historyLimit, sorted by timestamp (newest first)
    const recentEntries = [...allStatuses]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, historyLimit);

    // Sort by timestamp (oldest first) for chart display
    const sortedEntries = [...recentEntries].sort((a, b) => a.timestamp - b.timestamp);
    
    let vectorData: any[] = [];
     let chatData: any[] = [];

    // Apply service filtering
    if (selectedService === 'all' || selectedService === 'vector') {
      vectorData = sortedEntries
        .filter(entry => entry.serviceName === 'vector-convert-llm')
        .map(entry => ({
          timestamp: entry.timestamp,
          memory: entry.memoryUsage?.processMemoryMb || 0,
          cpu: entry.memoryUsage?.processCpuPercent || 0,
          status: entry.status,
          ready: entry.ready
        }));
    }
      
    if (selectedService === 'all' || selectedService === 'chat') {
      chatData = sortedEntries
        .filter(entry => entry.serviceName === 'lightweight-llm')
        .map(entry => ({
          timestamp: entry.timestamp,
          memory: entry.memoryUsage?.processMemoryMb || 0,
          cpu: entry.memoryUsage?.processCpuPercent || 0,
          status: entry.status,
          ready: entry.ready
        }));
    }
    
    return {
      vector: vectorData,
      chat: chatData,
      timestamps: sortedEntries.map(entry => entry.timestamp)
    };
  }, [allStatuses, historyLimit, selectedService]);

  // Find max for scaling across both services
  const maxMemory = Math.max(
    ...chartData.vector.map((s) => s.memory),
    ...chartData.chat.map((s) => s.memory),
    100 // minimum scale
  );
  const maxCPU = Math.max(
    ...chartData.vector.map((s) => s.cpu),
    ...chartData.chat.map((s) => s.cpu),
    10 // minimum scale
  );

  // Color scheme
  const vectorMemColor = "#10b981"; // emerald-500 for vector service
  const vectorCpuColor = "#06b6d4"; // cyan-500 for vector service
  const chatMemColor = "#f59e0b"; // amber-500 for chat service
  const chatCpuColor = "#ef4444"; // red-500 for chat service
  const axisColor = "#64748b"; // slate-500
  const labelColor = "#f1f5f9"; // slate-50

  // Use a responsive width that adapts to container
  const width = 800; // Larger base width for better visualization
  const height = 120;
  const padding = 30; // Adequate padding for labels

  // Helper to map samples to SVG points
  const getLinePointsArr = (samples: any[], key: "memory" | "cpu", maxValue: number): number[][] => {
    if (samples.length === 0) return [];
    return samples.map((s, i) => {
      const x = padding + (i * (width - 2 * padding)) / Math.max(samples.length - 1, 1);
      const y = height - padding - (s[key] / maxValue) * (height - 2 * padding);
      return [x, y];
    });
  };

  const vectorMemPoints = getLinePointsArr(chartData.vector, "memory", maxMemory);
  const vectorCpuPoints = getLinePointsArr(chartData.vector, "cpu", maxCPU);
  const chatMemPoints = getLinePointsArr(chartData.chat, "memory", maxMemory);
  const chatCpuPoints = getLinePointsArr(chartData.chat, "cpu", maxCPU);

  const pointsToString = (arr: number[][]): string =>
    arr.map(([x, y]) => `${x},${y}`).join(" ");

// Helper to generate a heartbeat-like path from points
const generateHeartbeatPath = (points: number[][], height: number) => {
  if (points.length === 0) return '';
  
  // Start with a move to the first point
  let path = `M ${points[0][0]} ${points[0][1]}`;
  
  // For each subsequent point, create a curve that resembles a heartbeat
  for (let i = 1; i < points.length; i++) {
    const prev = points[i-1];
    const curr = points[i];
    const xMid = (prev[0] + curr[0]) / 2;
    
    // If there's a significant change in y value, create a sharper peak
    const yDiff = Math.abs(curr[1] - prev[1]);
    if (yDiff > height * 0.1) {
      // Create a sharper peak for significant changes
      path += ` L ${xMid - 2} ${prev[1]}`;
      path += ` L ${xMid} ${curr[1]}`;
      path += ` L ${xMid + 2} ${curr[1]}`;
    } else {
      // Use a smooth curve for smaller changes
      path += ` C ${xMid} ${prev[1]}, ${xMid} ${curr[1]}, ${curr[0]} ${curr[1]}`;
    }
  }
  
  return path;
};

  // Get service status indicators
  const getStatusColor = (status: string, ready: boolean) => {
    if (!ready) return "#64748b"; // slate-500
    switch (status) {
      case 'healthy': return "#10b981"; // emerald-500
      case 'loading': return "#f59e0b"; // amber-500
      case 'error': return "#ef4444"; // red-500
      default: return "#64748b"; // slate-500
    }
  };

  // Get service summaries for display
  const vectorService = services['vector-convert-llm'];
  const chatService = services['lightweight-llm'];
  const vectorSummary = serviceSummaries.find(s => s.serviceName === 'vector-convert-llm');
  const chatSummary = serviceSummaries.find(s => s.serviceName === 'lightweight-llm');

  return (
    <div
      className="p-4 w-full rounded-lg border border-slate-800 bg-slate-950"
      style={{
        fontFamily: "monospace",
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2 items-center">
          <Database className="w-4 h-4 text-cyan-400" />
          <div className="text-xs text-slate-50">
            LLM Services Monitor
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex gap-1 items-center px-2 py-1 text-xs transition-colors text-slate-400 hover:text-slate-200"
          >
            <Activity className="w-3 h-3" />
            {isExpanded ? 'Summary' : 'Details'}
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <div className="flex gap-2">
            <div className="flex gap-1 items-center">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: getStatusColor(vectorService?.status || 'unknown', vectorService?.ready || false) }}
              />
              <span className="text-xs text-slate-400">Vector</span>
            </div>
            <div className="flex gap-1 items-center">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: getStatusColor(chatService?.status || 'unknown', chatService?.ready || false) }}
              />
              <span className="text-xs text-slate-400">Chat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary View */}
      {!isExpanded && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="font-medium text-slate-400">Vector Service</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-50">Status:</span>
                  <span className="font-mono" style={{ color: getStatusColor(vectorService?.status || 'unknown', vectorService?.ready || false) }}>
                    {vectorService?.status || '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-50">Memory:</span>
                  <span className="font-mono" style={{ color: serviceConfig['vector-convert-llm'].memoryColor }}>
                    {vectorService?.ready ? `${vectorService.memory.toFixed(1)} MB` : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-50">CPU:</span>
                  <span className="font-mono" style={{ color: serviceConfig['vector-convert-llm'].cpuColor }}>
                    {vectorService?.ready ? `${vectorService.cpu.toFixed(1)}%` : '--'}
                  </span>
                </div>
                {vectorSummary && (
                  <div className="flex justify-between">
                    <span className="text-slate-50">Health:</span>
                    <span className="font-mono text-slate-300">
                      {vectorSummary.healthyPercentage.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium text-slate-400">Chat Service</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-50">Status:</span>
                  <span className="font-mono" style={{ color: getStatusColor(chatService?.status || 'unknown', chatService?.ready || false) }}>
                    {chatService?.status || '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-50">Memory:</span>
                  <span className="font-mono" style={{ color: serviceConfig['lightweight-llm'].memoryColor }}>
                    {chatService?.ready ? `${chatService.memory.toFixed(1)} MB` : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-50">CPU:</span>
                  <span className="font-mono" style={{ color: serviceConfig['lightweight-llm'].cpuColor }}>
                    {chatService?.ready ? `${chatService.cpu.toFixed(1)}%` : '--'}
                  </span>
                </div>
                {chatSummary && (
                  <div className="flex justify-between">
                    <span className="text-slate-50">Health:</span>
                    <span className="font-mono text-slate-300">
                      {chatSummary.healthyPercentage.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {serviceSummaries.length > 0 && (
            <div className="pt-2 border-t border-slate-700">
              <div className="mb-1 text-xs text-slate-400">Historical Summary</div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="text-center">
                  <div className="font-mono text-slate-50">{serviceSummaries.reduce((acc, s) => acc + s.totalEntries, 0)}</div>
                  <div className="text-slate-500">Total Records</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-slate-50">
                    {serviceSummaries.reduce((acc, s) => acc + s.avgMemoryMb, 0).toFixed(0)}MB
                  </div>
                  <div className="text-slate-500">Avg Memory</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-slate-50">
                    {(serviceSummaries.reduce((acc, s) => acc + s.healthyPercentage, 0) / Math.max(serviceSummaries.length, 1)).toFixed(0)}%
                  </div>
                  <div className="text-slate-500">Avg Health</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Chart View - Heartbeat Monitor Style */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 p-3 rounded-lg border bg-slate-800/50 border-slate-700">
            <div className="flex gap-2 items-center">
              <label className="text-xs text-slate-400">Service:</label>
              <select 
                value={selectedService} 
                onChange={(e) => setSelectedService(e.target.value as 'all' | 'vector' | 'chat')}
                className="px-2 py-1 text-xs rounded border bg-slate-700 border-slate-600 text-slate-200"
              >
                <option value="all">All Services</option>
                <option value="vector">Vector Only</option>
                <option value="chat">Chat Only</option>
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-slate-400">History:</label>
              <select 
                value={historyLimit} 
                onChange={(e) => setHistoryLimit(Number(e.target.value))}
                className="px-2 py-1 text-xs rounded border bg-slate-700 border-slate-600 text-slate-200"
              >
                <option value={10}>Last 10</option>
                <option value={20}>Last 20</option>
                <option value={30}>Last 30</option>
                <option value={50}>Last 50</option>
                <option value={100}>Last 100</option>
              </select>
            </div>
          </div>
          
          {/* Memory Heartbeat Monitor */}
          <div className="space-y-2">
            <h4 className="flex gap-2 items-center text-sm font-medium text-slate-300">
              <Activity className="w-4 h-4" />
              Memory Usage Monitor
            </h4>
              <div className="relative w-full">
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible bg-slate-900">
              {/* Grid background */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width={width} height={height} fill="url(#grid)" />
              
              {/* Horizontal center line */}
              <line
                x1={0}
                y1={height / 2}
                x2={width}
                y2={height / 2}
                stroke="#334155"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              
              {/* Vector service heartbeat lines */}
              {vectorMemPoints.length > 0 && (
                <motion.path
                  d={generateHeartbeatPath(vectorMemPoints, height)}
                  fill="none"
                  stroke={vectorMemColor}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0.4 }}
                  animate={{ 
                    pathLength: 1, 
                    opacity: 1,
                    strokeWidth: [2, 2.5, 2]
                  }}
                  transition={{ 
                    pathLength: { type: "spring", duration: 1.5 },
                    opacity: { duration: 0.5 },
                    strokeWidth: { 
                      repeat: Infinity, 
                      duration: 2, 
                      ease: "easeInOut" 
                    }
                  }}
                />
              )}
              
              {/* Vector CPU heartbeat line */}
              {vectorCpuPoints.length > 0 && (
                <motion.path
                  d={generateHeartbeatPath(vectorCpuPoints, height)}
                  fill="none"
                  stroke={vectorCpuColor}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray="3,3"
                  initial={{ pathLength: 0, opacity: 0.4 }}
                  animate={{ 
                    pathLength: 1, 
                    opacity: 1 
                  }}
                  transition={{ 
                    pathLength: { type: "spring", duration: 1.5 },
                    opacity: { duration: 0.5 }
                  }}
                />
              )}
              
              {/* Chat service heartbeat lines */}
              {chatMemPoints.length > 0 && (
                <motion.path
                  d={generateHeartbeatPath(chatMemPoints, height)}
                  fill="none"
                  stroke={chatMemColor}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0.4 }}
                  animate={{ 
                    pathLength: 1, 
                    opacity: 1,
                    strokeWidth: [2, 2.5, 2]
                  }}
                  transition={{ 
                    pathLength: { type: "spring", duration: 1.5 },
                    opacity: { duration: 0.5 },
                    strokeWidth: { 
                      repeat: Infinity, 
                      duration: 2, 
                      ease: "easeInOut",
                      delay: 0.5 // Offset from vector pulse
                    }
                  }}
                />
              )}
              
              {/* Chat CPU heartbeat line */}
              {chatCpuPoints.length > 0 && (
                <motion.path
                  d={generateHeartbeatPath(chatCpuPoints, height)}
                  fill="none"
                  stroke={chatCpuColor}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray="3,3"
                  initial={{ pathLength: 0, opacity: 0.4 }}
                  animate={{ 
                    pathLength: 1, 
                    opacity: 1 
                  }}
                  transition={{ 
                    pathLength: { type: "spring", duration: 1.5 },
                    opacity: { duration: 0.5 }
                  }}
                />
              )}

              {/* Legend - moved to right side */}
              <rect x={width - 180} y={padding - 10} width={160} height={30} rx={4} fill="rgba(15, 23, 42, 0.7)" />
              <text x={width - 174} y={padding + 4} fill={vectorMemColor} fontSize={9}>
                Vector MEM
              </text>
              <text x={width - 174} y={padding + 16} fill={vectorCpuColor} fontSize={9}>
                Vector CPU
              </text>
              <text x={width - 96} y={padding + 4} fill={chatMemColor} fontSize={9}>
                Chat MEM
              </text>
              <text x={width - 96} y={padding + 16} fill={chatCpuColor} fontSize={9}>
                Chat CPU
              </text>
              
              {/* Time markers - adjusted positioning */}
              <text x={padding} y={height - 4} fill={labelColor} fontSize={9} fontWeight="bold">
                Past
              </text>
              <text x={width - padding - 20} y={height - 4} fill={labelColor} fontSize={9} fontWeight="bold">
                Now
              </text>
                </svg>
                
                {/* Pulse effect overlay */}
                <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent to-transparent animate-pulse via-slate-400/20" />
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-4 text-xs">
                <div className="space-y-2">
                  <div className="font-medium text-slate-400">Vector Service</div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-50">Memory:</span>
                    <span className="ml-2 font-mono" style={{ color: vectorMemColor }}>
                      {vectorService?.ready ? `${vectorService.memory.toFixed(1)} MB` : '--'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium text-slate-400">Chat Service</div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-50">Memory:</span>
                    <span className="ml-2 font-mono" style={{ color: chatMemColor }}>
                      {chatService?.ready ? `${chatService.memory.toFixed(1)} MB` : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CPU Heartbeat Monitor */}
            <div className="space-y-2">
              <h4 className="flex gap-2 items-center text-sm font-medium text-slate-300">
                <Activity className="w-4 h-4" />
                CPU Usage Monitor
              </h4>
              <div className="relative w-full">
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible bg-slate-900">
                  {/* Grid background */}
                  <defs>
                    <pattern id="cpu-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width={width} height={height} fill="url(#cpu-grid)" />
                  
                  {/* Horizontal center line */}
                  <line
                    x1={0}
                    y1={height / 2}
                    x2={width}
                    y2={height / 2}
                    stroke="#334155"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  
                  {/* Vector CPU heartbeat line */}
                  {vectorCpuPoints.length > 0 && (
                    <motion.path
                      d={generateHeartbeatPath(vectorCpuPoints, height)}
                      fill="none"
                      stroke={vectorCpuColor}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0.4 }}
                      animate={{ 
                        pathLength: 1, 
                        opacity: 1,
                        strokeWidth: [2, 2.5, 2]
                      }}
                      transition={{ 
                        pathLength: { type: "spring", duration: 1.5 },
                        opacity: { duration: 0.5 },
                        strokeWidth: { 
                          repeat: Infinity, 
                          duration: 2, 
                          ease: "easeInOut" 
                        }
                      }}
                    />
                  )}
                  
                  {/* Chat CPU heartbeat line */}
                  {chatCpuPoints.length > 0 && (
                    <motion.path
                      d={generateHeartbeatPath(chatCpuPoints, height)}
                      fill="none"
                      stroke={chatCpuColor}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0.4 }}
                      animate={{ 
                        pathLength: 1, 
                        opacity: 1,
                        strokeWidth: [2, 2.5, 2]
                      }}
                      transition={{ 
                        pathLength: { type: "spring", duration: 1.5 },
                        opacity: { duration: 0.5 },
                        strokeWidth: { 
                          repeat: Infinity, 
                          duration: 2, 
                          ease: "easeInOut",
                          delay: 0.5
                        }
                      }}
                    />
                  )}

                  {/* Legend - moved to right side */}
                  <rect x={width - 120} y={padding - 10} width={100} height={20} rx={4} fill="rgba(15, 23, 42, 0.7)" />
                  <text x={width - 114} y={padding + 4} fill={vectorCpuColor} fontSize={9}>
                    Vector CPU
                  </text>
                  <text x={width - 60} y={padding + 4} fill={chatCpuColor} fontSize={9}>
                    Chat CPU
                  </text>
                  
                  {/* Time markers */}
                  <text x={padding} y={height - 4} fill={labelColor} fontSize={9} fontWeight="bold">
                    Past
                  </text>
                  <text x={width - padding - 20} y={height - 4} fill={labelColor} fontSize={9} fontWeight="bold">
                    Now
                  </text>
                </svg>
                
                {/* Pulse effect overlay */}
                <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent to-transparent animate-pulse via-slate-400/20" />
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-4 text-xs">
                <div className="space-y-2">
                  <div className="font-medium text-slate-400">Vector Service</div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-50">CPU:</span>
                    <span className="ml-2 font-mono" style={{ color: vectorCpuColor }}>
                      {vectorService?.ready ? `${vectorService.cpu.toFixed(1)}%` : '--'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium text-slate-400">Chat Service</div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-50">CPU:</span>
                    <span className="ml-2 font-mono" style={{ color: chatCpuColor }}>
                      {chatService?.ready ? `${chatService.cpu.toFixed(1)}%` : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          
          {(chartData.vector.length === 0 && chartData.chat.length === 0) && (
            <div className="py-4 text-center text-slate-400">
                {isLoading ? 'Loading historical data...' : 'No metrics available - services may be starting up'}
              </div>
           )}
        </div>
       )}
      
      {/* Service Status History Accordion */}
      <div className="mt-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="service-history">
            <AccordionTrigger className="text-sm font-medium text-slate-300 hover:text-slate-100">
              <div className="flex gap-2 items-center">
                <Database className="w-4 h-4" />
                Service Status History (Last 20 entries)
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="p-4 w-full h-64 rounded-md border border-slate-700 bg-slate-800/50">
                <div className="space-y-2">
                   {allStatuses && allStatuses.length > 0 ? (
                     allStatuses
                       .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
                       .slice(0, 20) // Get last 20 entries
                       .map((entry, index) => {
                         const timestamp = new Date(entry.timestamp).toLocaleString();
                         const cpuPercent = entry.memoryUsage?.processCpuPercent || 0;
                         const memoryMB = entry.memoryUsage?.processMemoryMb || 0;
                        
                        return (
                          <div key={`${entry.serviceName}-${index}`} className="flex justify-between items-center p-2 rounded border bg-slate-700/30 border-slate-600/30">
                            <div className="flex gap-3 items-center">
                              <div className={`w-2 h-2 rounded-full ${
                                entry.status === 'healthy' ? 'bg-green-400' :
                                entry.status === 'loading' ? 'bg-yellow-400' :
                                entry.status === 'error' ? 'bg-red-400' :
                                'bg-gray-400'
                              }`} />
                              <div>
                                <div className="text-sm font-medium text-slate-200">
                                  {entry.serviceName}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {timestamp}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-4 items-center text-xs">
                              <div className="text-slate-300">
                                CPU: <span className="font-mono text-blue-400">{cpuPercent.toFixed(1)}%</span>
                              </div>
                              <div className="text-slate-300">
                                Memory: <span className="font-mono text-green-400">{memoryMB.toFixed(0)}MB</span>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                entry.status === 'healthy' ? 'bg-green-900/30 text-green-300' :
                                entry.status === 'loading' ? 'bg-yellow-900/30 text-yellow-300' :
                                entry.status === 'error' ? 'bg-red-900/30 text-red-300' :
                                'bg-gray-900/30 text-gray-300'
                              }`}>
                                {entry.status}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="py-8 text-center text-slate-400">
                      No service status data available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};
