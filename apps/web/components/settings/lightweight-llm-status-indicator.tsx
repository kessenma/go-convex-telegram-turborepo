"use client";

import {
  AlertCircle,
  BrainCog,
  CheckCircle,
  Info,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLightweightLlmStatus } from "../../hooks/use-status-operations";
import { useStatusData } from "../../hooks/use-consolidated-health-check";
import { useStatusStore } from "../../stores/status-store";
import { renderIcon } from "../../lib/icon-utils";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { StatusIndicator } from "../ui/status-indicator";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion";

interface LightweightVectorConverterStatusProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  showLogs?: boolean;
  variant?: "lightweight" | "unified" | "consolidated"; // New prop to support unified mode
  showSummary?: boolean;
}

// Map LLM status to StatusIndicator status
const mapToStatusIndicatorStatus = (status: string, ready: boolean): "connected" | "connecting" | "disconnected" => {
  if (status === "healthy" && ready) return "connected";
  if (status === "error") return "disconnected";
  return "connecting";
};

export const LightweightLLMStatus = ({
  size = "md",
  showLabel = true,
  className,
  showLogs = true,
  variant = "lightweight",
  showSummary = false,
}: LightweightVectorConverterStatusProps): React.ReactElement => {
  const { status: lightweightLlmStatus, loading } = useLightweightLlmStatus();
  const { consolidatedLLMMetrics, llmStatus } = useStatusData();
  const { checkLightweightLlmStatus } = useStatusStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get model name from environment variable
  const modelName = process.env.NEXT_PUBLIC_LLM_MODEL || "Meta Llama 3.2";

  // Extract values from the status object
  const { status, ready, message, model, details } = lightweightLlmStatus;
  
  // Conditional polling - only when expanded
  const startConditionalPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      if (isExpanded) {
        checkLightweightLlmStatus();
      }
    }, 5000); // 5 second interval when expanded
  }, [isExpanded, checkLightweightLlmStatus]);
  
  const stopConditionalPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Start/stop polling based on expansion state
  useEffect(() => {
    if (isExpanded) {
      startConditionalPolling();
    } else {
      stopConditionalPolling();
    }
    
    return () => stopConditionalPolling();
  }, [isExpanded, startConditionalPolling, stopConditionalPolling]);

  const getStatusIcon = () => {
    if (status === "healthy" && ready) {
      return renderIcon(CheckCircle, { className: "w-4 h-4 text-green-400" });
    } else if (status === "error") {
      return renderIcon(AlertCircle, { className: "w-4 h-4 text-red-400" });
    } else if (status === "starting") {
      return renderIcon(Loader2, {
        className: "w-4 h-4 text-blue-400 animate-spin",
      });
    } else if (status === "connecting") {
      return renderIcon(Loader2, {
        className: "w-4 h-4 text-yellow-300 animate-spin",
      });
    } else {
      return renderIcon(Loader2, {
        className: "w-4 h-4 text-yellow-400 animate-spin",
      });
    }
  };

  const getStatusText = () => {
    if (status === "healthy" && ready) {
      return "LLM Ready";
    } else if (status === "error") {
      return "LLM Service Error";
    } else if (status === "starting") {
      return "Service Starting...";
    } else if (status === "connecting") {
      return "Connecting to LLM...";
    } else if (status === "loading") {
      return "Model Loading...";
    } else {
      return "Loading LLM...";
    }
  };

  const getStatusColor = () => {
    if (status === "healthy" && ready) {
      return "text-green-400";
    } else if (status === "error") {
      return "text-red-400";
    } else if (status === "starting") {
      return "text-blue-400";
    } else if (status === "connecting") {
      return "text-yellow-300";
    } else {
      return "text-yellow-400";
    }
  };

  const getProgressMessage = () => {
    if (status === "loading" && !ready) {
      return "Model is loading, this may take a few minutes...";
    }
    if (status === "healthy" && ready) {
      return "Chat LLM is ready for inference";
    }
    return message;
  };

  const getCpuColor = (cpuPercent: number) => {
    if (cpuPercent > 80) return "text-red-400";
    if (cpuPercent > 50) return "text-yellow-400";
    return "text-green-400";
  };

  const getMemoryColor = (memoryPercent: number) => {
    if (memoryPercent > 80) return "text-red-400";
    if (memoryPercent > 60) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <div className="flex gap-3 items-center p-3">
        <div className="flex gap-2 items-center">
          {renderIcon(BrainCog, { className: "w-5 h-5 text-slate-400" })}
          <StatusIndicator 
            status={mapToStatusIndicatorStatus(status, ready)}
            size={size}
            showLabel={false}
          />
        </div>

        {showLabel && (
          <div className="flex-1">
            <div className="space-y-1">
              <div className={cn("text-sm font-medium", getStatusColor())}>
                {getStatusText()}
              </div>
              <div className="text-xs text-slate-400">
                Model Name: <span className="text-slate-200">{modelName}</span>
              </div>
              <div className="text-xs text-slate-300">{getProgressMessage()}</div>
              {details?.timestamp && (
                <div className="text-xs text-slate-400">
                  Last checked: {new Date(details.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 items-center ml-auto">
          {getStatusIcon()}
        </div>
      </div>

      {/* LLM Services Summary - only show if showSummary is true */}
      {showSummary && consolidatedLLMMetrics && (
        <div className="p-3 border-t border-slate-700/50 bg-slate-950/30">
          <div className="space-y-3">
            <div className="pb-1 text-xs font-medium border-b text-slate-400 border-slate-600">
              LLM Services Summary
            </div>
            
            {/* Overall Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-slate-400">Status:</span>
                <span className={`ml-1 font-medium ${getStatusColor()}`}>
                  {status}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Ready:</span>
                <span className={`ml-1 ${ready ? 'text-green-400' : 'text-red-400'}`}>
                  {ready ? 'Yes' : 'No'}
                </span>
              </div>
              {details?.service_status && (
                <div>
                  <span className="text-slate-400">Service:</span>
                  <span className="ml-1 text-slate-200">
                    {details.service_status}
                  </span>
                </div>
              )}
              {details?.model_loaded !== undefined && (
                <div>
                  <span className="text-slate-400">Model Loaded:</span>
                  <span className={`ml-1 ${details.model_loaded ? 'text-green-400' : 'text-red-400'}`}>
                    {details.model_loaded ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {details?.gpu_available !== undefined && (
                <div>
                  <span className="text-slate-400">GPU Available:</span>
                  <span className={`ml-1 ${details.gpu_available ? 'text-green-400' : 'text-yellow-400'}`}>
                    {details.gpu_available ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {details?.error && (
                <div className="col-span-2">
                  <span className="text-slate-400">Error:</span>
                  <div className="mt-1 text-xs text-red-300 break-words">
                    {details.error}
                  </div>
                </div>
              )}
            </div>

            {/* Memory Usage */}
            {lightweightLlmStatus.memory_usage && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-400">Resource Usage</div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {lightweightLlmStatus.memory_usage.rss_mb && (
                    <div>
                      <span className="text-slate-400">Memory (RSS):</span>
                      <span className={`ml-1 font-mono ${getMemoryColor(lightweightLlmStatus.memory_usage.percent || 0)}`}>
                        {lightweightLlmStatus.memory_usage.rss_mb.toFixed(0)}MB
                      </span>
                    </div>
                  )}
                  {lightweightLlmStatus.memory_usage.percent && (
                    <div>
                      <span className="text-slate-400">CPU:</span>
                      <span className={`ml-1 font-mono ${getCpuColor(lightweightLlmStatus.memory_usage.percent)}`}>
                        {lightweightLlmStatus.memory_usage.percent.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {lightweightLlmStatus.memory_usage.vms_mb && (
                    <div>
                      <span className="text-slate-400">Memory (VMS):</span>
                      <span className="ml-1 font-mono text-slate-200">
                        {lightweightLlmStatus.memory_usage.vms_mb.toFixed(0)}MB
                      </span>
                    </div>
                  )}
                  {lightweightLlmStatus.memory_usage.available_mb && (
                    <div>
                      <span className="text-slate-400">Available:</span>
                      <span className="ml-1 font-mono text-slate-200">
                        {lightweightLlmStatus.memory_usage.available_mb.toFixed(0)}MB
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


    </Card>
  );
};

// Export alias for backward compatibility
export const LightweightVectorConverterStatus = LightweightLLMStatus;
export type { LightweightVectorConverterStatusProps };
