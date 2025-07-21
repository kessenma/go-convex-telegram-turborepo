"use client";

import {
  AlertCircle,
  BrainCog,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useLightweightLlmStatus } from "../../hooks/use-status-operations";
import { renderIcon } from "../../lib/icon-utils";
import { cn } from "../../lib/utils";

interface LightweightLLMStatusIndicatorProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  showLogs?: boolean;
}

const statusColors = {
  healthy: "bg-green-500",
  loading: "bg-yellow-500",
  starting: "bg-blue-500",
  connecting: "bg-yellow-400",
  error: "bg-red-500",
};

const statusSizes = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export const LightweightLLMStatusIndicator = ({
  size = "md",
  showLabel = true,
  className,
  showLogs = true,
}: LightweightLLMStatusIndicatorProps): React.ReactElement => {
  const { status: lightweightLlmStatus, loading } = useLightweightLlmStatus();

  // Extract values from the status object
  const { status, ready, message, model, details } = lightweightLlmStatus;
  const [isExpanded, setIsExpanded] = useState(false);

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

  const _formatUptime = (uptime?: string) => {
    if (!uptime) return null;
    const seconds = parseFloat(uptime);
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const getProgressMessage = () => {
    if (status === "loading" && !ready) {
      return "Model is loading, this may take a few minutes...";
    }
    return message;
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex gap-3 items-center p-3">
        <div className="flex gap-2 items-center">
          {renderIcon(BrainCog, { className: "w-5 h-5 text-slate-400" })}
          <div
            className={cn(
              "rounded-full",
              statusColors[status],
              statusSizes[size],
              status === "loading" ? "animate-pulse" : "",
              "shadow-lg"
            )}
          />
        </div>

        {showLabel && (
          <div className="flex-1">
            <div className={cn("text-sm font-medium", getStatusColor())}>
              {getStatusText()}
            </div>
            <div className="text-xs text-slate-400">{getProgressMessage()}</div>
            {model && status === "healthy" && (
              <div className="mt-1 text-xs text-slate-400">Model: {model}</div>
            )}
            {details?.timestamp && (
              <div className="mt-1 text-xs text-slate-400">
                Last checked: {new Date(details.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 items-center ml-auto">
          {getStatusIcon()}
          {showLogs && details && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 transition-colors hover:text-cyan-400"
              title="View detailed logs"
            >
              {renderIcon(Info, { className: "w-4 h-4" })}
            </button>
          )}
          {showLogs && details && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 transition-colors hover:text-cyan-400"
            >
              {renderIcon(isExpanded ? ChevronUp : ChevronDown, {
                className: "w-4 h-4",
              })}
            </button>
          )}
        </div>
      </div>

      {/* Expandable logs section */}
      {isExpanded && details && (
        <div className="p-3 border-t border-slate-700/50 bg-slate-950/50">
          <div className="space-y-2">
            <div className="flex gap-2 items-center mb-2 text-xs text-slate-400">
              {renderIcon(Info, { className: "w-3 h-3" })}
              <span className="font-medium">Service Details</span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              {details.service_status && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Service Status:</span>
                  <span className="font-mono text-slate-200">
                    {details.service_status}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-400">Model Loaded:</span>
                <span
                  className={cn(
                    "font-mono",
                    details.model_loaded ? "text-cyan-400" : "text-yellow-400"
                  )}
                >
                  {details.model_loaded ? "✓ Yes" : "⏳ Loading..."}
                </span>
              </div>

              {details.gpu_available !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-400">GPU Available:</span>
                  <span
                    className={cn(
                      "font-mono",
                      details.gpu_available
                        ? "text-cyan-400"
                        : "text-yellow-400"
                    )}
                  >
                    {details.gpu_available ? "✓ Yes" : "✗ No"}
                  </span>
                </div>
              )}

              {details.timestamp && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Check:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(details.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {lightweightLlmStatus.memory_usage && (
                <>
                  <div className="pt-2 my-2 border-t border-slate-600">
                    <div className="mb-2 text-xs font-medium text-slate-400">
                      Memory Usage
                    </div>
                  </div>

                  {lightweightLlmStatus.memory_usage.rss_mb && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">RSS Memory:</span>
                      <span className="font-mono text-slate-200">
                        {lightweightLlmStatus.memory_usage.rss_mb.toFixed(1)} MB
                      </span>
                    </div>
                  )}

                  {lightweightLlmStatus.memory_usage.vms_mb && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">VMS Memory:</span>
                      <span className="font-mono text-slate-200">
                        {lightweightLlmStatus.memory_usage.vms_mb.toFixed(1)} MB
                      </span>
                    </div>
                  )}

                  {lightweightLlmStatus.memory_usage.percent !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Memory %:</span>
                      <span className="font-mono text-slate-200">
                        {lightweightLlmStatus.memory_usage.percent.toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {lightweightLlmStatus.memory_usage.available_mb && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Available:</span>
                      <span className="font-mono text-slate-200">
                        {lightweightLlmStatus.memory_usage.available_mb.toFixed(
                          1
                        )}{" "}
                        MB
                      </span>
                    </div>
                  )}
                </>
              )}

              {details.error && (
                <div className="p-2 mt-2 rounded border border-red-800 bg-red-900/30">
                  <div className="mb-1 text-xs font-medium text-red-400">
                    Error Details:
                  </div>
                  <div className="font-mono text-xs text-red-300 break-all">
                    {details.error}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs text-slate-500">
            Note: Memory usage is updated every 5 seconds.
          </div>
        </div>
      )}
    </div>
  );
};
