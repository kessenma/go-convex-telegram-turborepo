"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { renderIcon } from "../../lib/icon-utils";
import { CheckCircle, AlertCircle, Loader2, Brain, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useLLMStatus } from "../../hooks/use-status-operations";
import { LLMUsageBarChart } from "./llm-usage-bar-chart";
import { LLMLogs } from "./LLMLogs";

interface LLMStatusIndicatorProps {
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
  error: "bg-red-500"
};

const statusSizes = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4"
};

const statusLabels = {
  healthy: "LLM Ready",
  loading: "Model Downloading",
  starting: "Service Starting",
  connecting: "Connecting",
  error: "LLM Error"
};

export const LLMStatusIndicator = ({
  size = "md",
  showLabel = true,
  className,
  showLogs = true
}: LLMStatusIndicatorProps) => {
  const { status: llmStatus, loading } = useLLMStatus();
  
  // Extract values from the status object
  const {
    status,
    ready,
    message,
    model,
    details
  } = llmStatus;
  const [isExpanded, setIsExpanded] = useState(false);
  const getStatusIcon = () => {
    if (status === 'healthy' && ready) {
      return renderIcon(CheckCircle, { className: "w-4 h-4 text-green-400" });
    } else if (status === 'error') {
      return renderIcon(AlertCircle, { className: "w-4 h-4 text-red-400" });
    } else if (status === 'starting') {
      return renderIcon(Loader2, { className: "w-4 h-4 text-blue-400 animate-spin" });
    } else if (status === 'connecting') {
      return renderIcon(Loader2, { className: "w-4 h-4 text-yellow-300 animate-spin" });
    } else {
      return renderIcon(Loader2, { className: "w-4 h-4 text-yellow-400 animate-spin" });
    }
  };

  const getStatusText = () => {
    if (status === 'healthy' && ready) {
      return 'LLM Transformer Ready';
    } else if (status === 'error') {
      return 'LLM Transformer Error';
    } else if (status === 'starting') {
      return 'Service Starting...';
    } else if (status === 'connecting') {
      return 'Connecting to LLM Transformer...';
    } else if (status === 'loading') {
      return 'Model Downloading...';
    } else {
      return 'Loading LLM Transformer...';
    }
  };

  const getStatusColor = () => {
    if (status === 'healthy' && ready) {
      return 'text-green-400';
    } else if (status === 'error') {
      return 'text-red-400';
    } else if (status === 'starting') {
      return 'text-blue-400';
    } else if (status === 'connecting') {
      return 'text-yellow-300';
    } else {
      return 'text-yellow-400';
    }
  };

  const formatUptime = (uptime?: string) => {
    if (!uptime) return null;
    const seconds = parseFloat(uptime);
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const getProgressMessage = () => {
    if (status === 'loading' && !ready) {
      return 'Model is loading, this may take a few minutes...';
    }
    return message;
  };

  return (
    <div className={cn("rounded-lg border border-gray-700 bg-gray-800/50", className)}>
      <div className="flex gap-3 items-center p-3">
        <div className="flex gap-2 items-center">
          {renderIcon(Brain, { className: "w-5 h-5 text-gray-400" })}
          <div className={cn(
            "rounded-full",
            statusColors[status],
            statusSizes[size],
            status === 'loading' ? "animate-pulse" : "",
            "shadow-lg"
          )} />
        </div>
        
        {showLabel && (
          <div className="flex-1">
            <div className={cn("text-sm font-medium", getStatusColor())}>
              {getStatusText()}
            </div>
            <div className="text-xs text-gray-500">
              {getProgressMessage()}
            </div>
            {model && status === 'healthy' && (
              <div className="mt-1 text-xs text-gray-400">
                Model: {model}
              </div>
            )}
            {details?.uptime && (
              <div className="mt-1 text-xs text-gray-400">
                Uptime: {formatUptime(details.uptime)}
              </div>
            )}
            {details?.timestamp && (
              <div className="mt-1 text-xs text-gray-400">
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
              className="p-1 text-gray-400 transition-colors hover:text-gray-300"
              title="View detailed logs"
            >
              {renderIcon(Info, { className: "w-4 h-4" })}
            </button>
          )}
          {showLogs && details && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 transition-colors hover:text-gray-300"
            >
              {renderIcon(isExpanded ? ChevronUp : ChevronDown, { className: "w-4 h-4" })}
            </button>
          )}
        </div>
      </div>

      {/* Expandable logs section */}
      {isExpanded && details && (
        <div className="p-3 border-t border-gray-700 bg-gray-900/50">
          <div className="space-y-2">
            <div className="flex gap-2 items-center mb-2 text-xs text-gray-400">
              {renderIcon(Info, { className: "w-3 h-3" })}
              <span className="font-medium">Service Details</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2 text-xs">
              {details.service_status && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Service Status:</span>
                  <span className="font-mono text-gray-300">{details.service_status}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-400">Model Loaded:</span>
                <span className={cn(
                  "font-mono",
                  details.model_loaded ? "text-green-400" : "text-yellow-400"
                )}>
                  {details.model_loaded ? "✓ Yes" : "⏳ Loading..."}
                </span>
              </div>
              
              {details.uptime && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime:</span>
                  <span className="font-mono text-gray-300">{formatUptime(details.uptime)}</span>
                </div>
              )}
              
              {details.timestamp && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Check:</span>
                  <span className="font-mono text-gray-300">
                    {new Date(details.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
              
              {llmStatus.memory_usage && (
                <>
                  <div className="pt-2 my-2 border-t border-gray-600">
                    <div className="mb-2 text-xs font-medium text-gray-400">Memory & CPU Usage</div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Process Memory:</span>
                    <span className="font-mono text-gray-300">
                      {llmStatus.memory_usage.process_memory_mb?.toFixed(1) || '0'} MB
                      {llmStatus.memory_usage.process_memory_percent && (
                        <span className="ml-1 text-gray-500">
                          ({llmStatus.memory_usage.process_memory_percent.toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  
                  {llmStatus.memory_usage.process_cpu_percent !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Process CPU:</span>
                      <span className="font-mono text-gray-300">
                        {llmStatus.memory_usage.process_cpu_percent.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">System Memory:</span>
                    <span className="font-mono text-gray-300">
                      {llmStatus.memory_usage.system_memory_used_percent?.toFixed(1) || '0'}% used
                      {llmStatus.memory_usage.system_memory_available_gb && (
                        <span className="ml-1 text-gray-500">
                          ({llmStatus.memory_usage.system_memory_available_gb.toFixed(1)}GB free)
                        </span>
                      )}
                    </span>
                  </div>
                  
                  {llmStatus.memory_usage.system_memory_total_gb && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total System RAM:</span>
                      <span className="font-mono text-gray-300">
                        {llmStatus.memory_usage.system_memory_total_gb.toFixed(1)} GB
                      </span>
                    </div>
                  )}
                  
                  {llmStatus.memory_usage.error && (
                    <div className="p-2 mt-2 rounded border border-yellow-800 bg-yellow-900/30">
                      <div className="mb-1 text-xs font-medium text-yellow-400">Memory Monitoring Error:</div>
                      <div className="font-mono text-xs text-yellow-300 break-all">{llmStatus.memory_usage.error}</div>
                    </div>
                  )}
                </>
              )}
              
              {details.error && (
                <div className="p-2 mt-2 rounded border border-red-800 bg-red-900/30">
                  <div className="mb-1 text-xs font-medium text-red-400">Error Details:</div>
                  <div className="font-mono text-xs text-red-300 break-all">{details.error}</div>
                </div>
              )}
            </div>
          </div>

          <div className="my-4">
            <LLMUsageBarChart />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Note: Memory and CPU usage is updated every 5 seconds.
        </div>
          <div className="text-xs text-gray-500 mt-2">
            <LLMLogs />
          </div>
        </div>
      )}
    </div>
  );
};