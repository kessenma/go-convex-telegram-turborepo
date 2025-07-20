import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useLLMStatus } from "../../hooks/use-status-operations";

interface UsageSample {
  timestamp: number;
  memory: number; // in MB
  cpu: number; // in %
}

interface LLMUsageBarChartProps {
  pollIntervalMs?: number;
  maxSamples?: number;
}

export const LLMUsageBarChart: React.FC<LLMUsageBarChartProps> = ({
  pollIntervalMs = 2000,
  maxSamples = 40,
}) => {
  const [samples, setSamples] = useState<UsageSample[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { status: llmStatus } = useLLMStatus();

  useEffect(() => {
    // Extract usage data from centralized LLM status
    const usage = llmStatus.memory_usage || {};
    if (
      usage.process_memory_mb !== undefined &&
      usage.process_cpu_percent !== undefined
    ) {
      setSamples((prev) => {
        const next = [
          ...prev,
          {
            timestamp: Date.now(),
            memory: usage.process_memory_mb as number,
            cpu: usage.process_cpu_percent as number,
          },
        ];
        return next.length > maxSamples
          ? next.slice(next.length - maxSamples)
          : next;
      });
    }
  }, [llmStatus.memory_usage, maxSamples]);

  // Optional: Still allow manual polling for high-frequency updates
  useEffect(() => {
    if (pollIntervalMs <= 5000) {
      // Only for high-frequency polling (5s or less)
      const fetchUsage = async () => {
        try {
          const res = await fetch("/api/llm/status");
          const data = await res.json();
          const usage = data.memory_usage || {};
          if (
            usage.process_memory_mb !== undefined &&
            usage.process_cpu_percent !== undefined
          ) {
            setSamples((prev) => {
              const next = [
                ...prev,
                {
                  timestamp: Date.now(),
                  memory: usage.process_memory_mb as number,
                  cpu: usage.process_cpu_percent as number,
                },
              ];
              return next.length > maxSamples
                ? next.slice(next.length - maxSamples)
                : next;
            });
          }
        } catch {}
      };

      timerRef.current = setInterval(fetchUsage, pollIntervalMs);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [pollIntervalMs, maxSamples]);

  // Find max for scaling
  const maxMemory = Math.max(...samples.map((s) => s.memory), 1);
  const maxCPU = Math.max(...samples.map((s) => s.cpu), 1);

  // Tailwind slate palette
  const _bgColor = "#020617"; // slate-950
  const _borderColor = "#64748b"; // slate-500
  const memColor = "#f1f5f9"; // slate-50 (white-ish)
  const cpuColor = "#38bdf8"; // sky-400 for contrast, or use "#94a3b8" (slate-400)
  const axisColor = "#64748b"; // slate-500
  const labelColor = "#f1f5f9"; // slate-50

  const width = 320;
  const height = 100;
  const padding = 24;

  // Helper to map samples to SVG points
  const getLinePointsArr = (key: "memory" | "cpu", maxValue: number) => {
    if (samples.length === 0) return [];
    return samples.map((s, i) => {
      const x = padding + (i * (width - 2 * padding)) / (maxSamples - 1);
      const y = height - padding - (s[key] / maxValue) * (height - 2 * padding);
      return [x, y];
    });
  };

  const memPointsArr = getLinePointsArr("memory", maxMemory);
  const cpuPointsArr = getLinePointsArr("cpu", maxCPU);

  const pointsToString = (arr: number[][]) =>
    arr.map(([x, y]) => `${x},${y}`).join(" ");

  // Last values for display
  const last = samples.length ? samples[samples.length - 1] : undefined;

  return (
    <div
      className="rounded-lg border border-slate-800 bg-slate-950 p-4"
      style={{
        width: width,
        fontFamily: "monospace",
      }}
    >
      <div className="text-xs text-slate-50 mb-2">
        LLM Usage (Heartbeat Monitor)
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
        {/* Memory line */}
        <motion.polyline
          fill="none"
          stroke={memColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={pointsToString(memPointsArr)}
          animate={{ points: pointsToString(memPointsArr) }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        />
        {/* CPU line */}
        <motion.polyline
          fill="none"
          stroke={cpuColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={pointsToString(cpuPointsArr)}
          animate={{ points: pointsToString(cpuPointsArr) }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        />
        {/* Dots for last points */}
        {last && (
          <>
            <circle
              cx={
                padding +
                ((samples.length - 1) * (width - 2 * padding)) /
                  (maxSamples - 1)
              }
              cy={
                height -
                padding -
                (last.memory / maxMemory) * (height - 2 * padding)
              }
              r={3}
              fill={memColor}
              stroke="#fff"
              strokeWidth={1}
            />
            <circle
              cx={
                padding +
                ((samples.length - 1) * (width - 2 * padding)) /
                  (maxSamples - 1)
              }
              cy={
                height - padding - (last.cpu / maxCPU) * (height - 2 * padding)
              }
              r={3}
              fill={cpuColor}
              stroke="#fff"
              strokeWidth={1}
            />
          </>
        )}
        {/* Labels */}
        <text x={padding + 2} y={padding + 10} fill={memColor} fontSize={10}>
          MEM
        </text>
        <text x={padding + 2} y={padding + 22} fill={cpuColor} fontSize={10}>
          CPU
        </text>
        {/* Y axis ticks */}
        <text x={4} y={height - padding} fill={labelColor} fontSize={10}>
          0
        </text>
        <text x={4} y={padding + 8} fill={labelColor} fontSize={10}>
          Max
        </text>
      </svg>
      <div className="flex gap-6 mt-2 text-xs">
        <div className="text-slate-50">
          Mem:{" "}
          <span className="font-bold text-white">
            {last ? last.memory.toFixed(1) : "--"}
          </span>{" "}
          MB
        </div>
        <div className="text-slate-50">
          CPU:{" "}
          <span className="font-bold text-white">
            {last ? last.cpu.toFixed(1) : "--"}
          </span>{" "}
          %
        </div>
      </div>
    </div>
  );
};
