import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { useStatusData } from "../../hooks/use-consolidated-health-check";

interface UsageSample {
  timestamp: number;
  memory: number; // in MB
  cpu: number; // in %
  service: 'vector' | 'chat'; // which service this sample is from
}

interface ServiceMetrics {
  memory: number;
  cpu: number;
  status: string;
  ready: boolean;
}

interface LLMUsageBarChartProps {
  maxSamples?: number;
}

export const LLMUsageBarChart: React.FC<LLMUsageBarChartProps> = ({
  maxSamples = 30,
}) => {
  const [samples, setSamples] = useState<UsageSample[]>([]);
  const { consolidatedLLMMetrics } = useStatusData();

  // Extract service metrics from store
  const services = {
    vector: {
      memory: consolidatedLLMMetrics?.services?.vector?.memory_usage?.process_memory_mb || 0,
      cpu: consolidatedLLMMetrics?.services?.vector?.memory_usage?.process_cpu_percent || 0,
      status: consolidatedLLMMetrics?.services?.vector?.status || 'unknown',
      ready: consolidatedLLMMetrics?.services?.vector?.ready || false
    },
    chat: {
      memory: consolidatedLLMMetrics?.services?.chat?.memory_usage?.rss_mb || 0,
      cpu: consolidatedLLMMetrics?.services?.chat?.memory_usage?.percent || 0,
      status: consolidatedLLMMetrics?.services?.chat?.status || 'unknown',
      ready: consolidatedLLMMetrics?.services?.chat?.ready || false
    }
  };

  // Update samples when metrics change
  useEffect(() => {
    if (!consolidatedLLMMetrics) return;

    const now = consolidatedLLMMetrics.timestamp;
    
    setSamples(prev => {
      const newSamples = [...prev];
      
      // Add vector service sample if available
      if (services.vector.ready && services.vector.memory > 0) {
        newSamples.push({
          timestamp: now,
          memory: services.vector.memory,
          cpu: services.vector.cpu,
          service: 'vector'
        });
      }

      // Add chat service sample if available
      if (services.chat.ready && services.chat.memory > 0) {
        newSamples.push({
          timestamp: now,
          memory: services.chat.memory,
          cpu: services.chat.cpu,
          service: 'chat'
        });
      }

      // Keep only recent samples
      return newSamples
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-maxSamples);
    });
  }, [consolidatedLLMMetrics, services.vector.memory, services.vector.cpu, services.chat.memory, services.chat.cpu, maxSamples]);

  // Separate samples by service
  const vectorSamples = samples.filter(s => s.service === 'vector');
  const chatSamples = samples.filter(s => s.service === 'chat');

  // Find max for scaling across both services
  const maxMemory = Math.max(
    ...samples.map((s) => s.memory),
    100 // minimum scale
  );
  const maxCPU = Math.max(
    ...samples.map((s) => s.cpu),
    10 // minimum scale
  );

  // Color scheme
  const vectorMemColor = "#10b981"; // emerald-500 for vector service
  const vectorCpuColor = "#06b6d4"; // cyan-500 for vector service
  const chatMemColor = "#f59e0b"; // amber-500 for chat service
  const chatCpuColor = "#ef4444"; // red-500 for chat service
  const axisColor = "#64748b"; // slate-500
  const labelColor = "#f1f5f9"; // slate-50

  const width = 400;
  const height = 120;
  const padding = 30;

  // Helper to map samples to SVG points
  const getLinePointsArr = (samples: UsageSample[], key: "memory" | "cpu", maxValue: number): number[][] => {
    if (samples.length === 0) return [];
    return samples.map((s, i) => {
      const x = padding + (i * (width - 2 * padding)) / Math.max(maxSamples - 1, 1);
      const y = height - padding - (s[key] / maxValue) * (height - 2 * padding);
      return [x, y];
    });
  };

  const vectorMemPoints = getLinePointsArr(vectorSamples, "memory", maxMemory);
  const vectorCpuPoints = getLinePointsArr(vectorSamples, "cpu", maxCPU);
  const chatMemPoints = getLinePointsArr(chatSamples, "memory", maxMemory);
  const chatCpuPoints = getLinePointsArr(chatSamples, "cpu", maxCPU);

  const pointsToString = (arr: number[][]): string =>
    arr.map(([x, y]) => `${x},${y}`).join(" ");

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

  return (
    <div
      className="p-4 rounded-lg border border-slate-800 bg-slate-950"
      style={{
        width: width,
        fontFamily: "monospace",
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs text-slate-50">
          LLM Services Monitor
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 items-center">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: getStatusColor(services.vector.status, services.vector.ready) }}
            />
            <span className="text-xs text-slate-400">Vector</span>
          </div>
          <div className="flex gap-1 items-center">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: getStatusColor(services.chat.status, services.chat.ready) }}
            />
            <span className="text-xs text-slate-400">Chat</span>
          </div>
        </div>
      </div>
      
      <svg width={width} height={height}>
        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke={axisColor}
          strokeWidth={1}
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke={axisColor}
          strokeWidth={1}
        />
        
        {/* Vector service lines */}
        {vectorMemPoints.length > 0 && (
          <motion.polyline
            fill="none"
            stroke={vectorMemColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={pointsToString(vectorMemPoints)}
            animate={{ points: pointsToString(vectorMemPoints) }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        )}
        {vectorCpuPoints.length > 0 && (
          <motion.polyline
            fill="none"
            stroke={vectorCpuColor}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="3,3"
            points={pointsToString(vectorCpuPoints)}
            animate={{ points: pointsToString(vectorCpuPoints) }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        )}
        
        {/* Chat service lines */}
        {chatMemPoints.length > 0 && (
          <motion.polyline
            fill="none"
            stroke={chatMemColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={pointsToString(chatMemPoints)}
            animate={{ points: pointsToString(chatMemPoints) }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        )}
        {chatCpuPoints.length > 0 && (
          <motion.polyline
            fill="none"
            stroke={chatCpuColor}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="3,3"
            points={pointsToString(chatCpuPoints)}
            animate={{ points: pointsToString(chatCpuPoints) }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        )}

        {/* Legend */}
        <text x={padding + 2} y={padding + 12} fill={vectorMemColor} fontSize={9}>
          Vector MEM
        </text>
        <text x={padding + 2} y={padding + 24} fill={vectorCpuColor} fontSize={9}>
          Vector CPU
        </text>
        <text x={padding + 80} y={padding + 12} fill={chatMemColor} fontSize={9}>
          Chat MEM
        </text>
        <text x={padding + 80} y={padding + 24} fill={chatCpuColor} fontSize={9}>
          Chat CPU
        </text>
        
        {/* Y axis labels */}
        <text x={4} y={height - padding + 4} fill={labelColor} fontSize={9}>
          0
        </text>
        <text x={4} y={padding + 4} fill={labelColor} fontSize={9}>
          Max
        </text>
      </svg>
      
      <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
        <div className="space-y-1">
          <div className="font-medium text-slate-400">Vector Service</div>
          <div className="flex justify-between">
            <span className="text-slate-50">Memory:</span>
            <span className="font-mono" style={{ color: vectorMemColor }}>
              {services.vector.ready ? `${services.vector.memory.toFixed(1)} MB` : '--'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-50">CPU:</span>
            <span className="font-mono" style={{ color: vectorCpuColor }}>
              {services.vector.ready ? `${services.vector.cpu.toFixed(1)}%` : '--'}
            </span>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="font-medium text-slate-400">Chat Service</div>
          <div className="flex justify-between">
            <span className="text-slate-50">Memory:</span>
            <span className="font-mono" style={{ color: chatMemColor }}>
              {services.chat.ready ? `${services.chat.memory.toFixed(1)} MB` : '--'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-50">CPU:</span>
            <span className="font-mono" style={{ color: chatCpuColor }}>
              {services.chat.ready ? `${services.chat.cpu.toFixed(1)}%` : '--'}
            </span>
          </div>
        </div>
      </div>
      
      {samples.length === 0 && (
        <div className="mt-2 text-xs text-center text-slate-500">
          No metrics available - services may be starting up
        </div>
      )}
    </div>
  );
};
