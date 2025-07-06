"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { renderIcon } from "../../lib/icon-utils";
import { CheckCircle, AlertCircle, Loader2, Brain, Info, ChevronDown, ChevronUp } from "lucide-react";

interface LLMStatusIndicatorProps {
  status: 'healthy' | 'error' | 'loading';
  ready: boolean;
  message: string;
  model?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  details?: {
    service_status?: string;
    model_loaded?: boolean;
    uptime?: string;
    timestamp?: string;
    error?: string;
  };
  showLogs?: boolean;
}

const statusColors = {
  healthy: "bg-green-500",
  loading: "bg-yellow-500",
  error: "bg-red-500"
};

const statusSizes = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4"
};

const statusLabels = {
  healthy: "LLM Ready",
  loading: "Loading Model",
  error: "LLM Error"
};

export const LLMStatusIndicator = ({
  status,
  ready,
  message,
  model,
  size = "md",
  showLabel = true,
  className,
  details,
  showLogs = true
}: LLMStatusIndicatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const getStatusIcon = () => {
    if (status === 'healthy' && ready) {
      return renderIcon(CheckCircle, { className: "w-4 h-4 text-green-400" });
    } else if (status === 'error') {
      return renderIcon(AlertCircle, { className: "w-4 h-4 text-red-400" });
    } else {
      return renderIcon(Loader2, { className: "w-4 h-4 text-yellow-400 animate-spin" });
    }
  };

  const getStatusText = () => {
    if (status === 'healthy' && ready) {
      return 'LLM Model Ready';
    } else if (status === 'error') {
      return 'LLM Service Error';
    } else {
      return 'Loading LLM Model...';
    }
  };

  const getStatusColor = () => {
    if (status === 'healthy' && ready) {
      return 'text-green-400';
    } else if (status === 'error') {
      return 'text-red-400';
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
    <div className={cn("rounded-lg bg-gray-800/50 border border-gray-700", className)}>
      <div className="flex items-center gap-3 p-3">
        <div className="flex items-center gap-2">
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
              <div className="text-xs text-gray-400 mt-1">
                Model: {model}
              </div>
            )}
            {details?.uptime && (
              <div className="text-xs text-gray-400 mt-1">
                Uptime: {formatUptime(details.uptime)}
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 ml-auto">
          {getStatusIcon()}
          {showLogs && details && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
              title="View detailed logs"
            >
              {renderIcon(Info, { className: "w-4 h-4" })}
            </button>
          )}
          {showLogs && details && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {renderIcon(isExpanded ? ChevronUp : ChevronDown, { className: "w-4 h-4" })}
            </button>
          )}
        </div>
      </div>

      {/* Expandable logs section */}
      {isExpanded && details && (
        <div className="border-t border-gray-700 p-3 bg-gray-900/50">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              {renderIcon(Info, { className: "w-3 h-3" })}
              <span className="font-medium">Service Details</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2 text-xs">
              {details.service_status && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Service Status:</span>
                  <span className="text-gray-300 font-mono">{details.service_status}</span>
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
                  <span className="text-gray-300 font-mono">{formatUptime(details.uptime)}</span>
                </div>
              )}
              
              {details.timestamp && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Check:</span>
                  <span className="text-gray-300 font-mono">
                    {new Date(details.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
              
              {details.error && (
                <div className="mt-2 p-2 bg-red-900/30 border border-red-800 rounded">
                  <div className="text-red-400 text-xs font-medium mb-1">Error Details:</div>
                  <div className="text-red-300 text-xs font-mono break-all">{details.error}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};