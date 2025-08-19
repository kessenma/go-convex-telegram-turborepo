"use client";

import { Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";

interface LLMDownloadProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Current download status */
  status: "downloading" | "completed" | "error" | "pending" | "loading";
  /** Model name being downloaded */
  modelName?: string;
  /** Additional status message */
  statusMessage?: string;
  /** Download details (e.g., "Downloading tokenizer", "Downloading model weights") */
  downloadDetails?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show percentage text */
  showPercentage?: boolean;
  /** Show status icon */
  showIcon?: boolean;
  /** Show model name */
  showModelName?: boolean;
  /** Custom className */
  className?: string;
  /** Animated progress bar */
  animated?: boolean;
}

const sizeConfig = {
  sm: {
    container: "text-xs",
    progressBar: "h-1.5",
    icon: "w-3 h-3",
    spacing: "space-y-1",
  },
  md: {
    container: "text-sm",
    progressBar: "h-2",
    icon: "w-4 h-4",
    spacing: "space-y-2",
  },
  lg: {
    container: "text-base",
    progressBar: "h-3",
    icon: "w-5 h-5",
    spacing: "space-y-3",
  },
};

const getStatusIcon = (status: string, iconSize: string) => {
  switch (status) {
    case "downloading":
      return <Download className={cn(iconSize, "text-blue-400")} />;
    case "completed":
      return <CheckCircle className={cn(iconSize, "text-green-400")} />;
    case "error":
      return <AlertCircle className={cn(iconSize, "text-red-400")} />;
    case "loading":
      return <Loader2 className={cn(iconSize, "text-yellow-400 animate-spin")} />;
    default:
      return <Loader2 className={cn(iconSize, "text-slate-400 animate-spin")} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "downloading":
      return "text-blue-400";
    case "completed":
      return "text-green-400";
    case "error":
      return "text-red-400";
    case "loading":
      return "text-yellow-400";
    default:
      return "text-slate-400";
  }
};

const getProgressBarColor = (status: string) => {
  switch (status) {
    case "downloading":
      return "bg-blue-400";
    case "completed":
      return "bg-green-400";
    case "error":
      return "bg-red-400";
    case "loading":
      return "bg-yellow-400";
    default:
      return "bg-slate-400";
  }
};

export const LLMDownloadProgressBar = ({
  progress,
  status,
  modelName,
  statusMessage,
  downloadDetails,
  size = "md",
  showPercentage = true,
  showIcon = true,
  showModelName = true,
  className,
  animated = true,
}: LLMDownloadProgressBarProps) => {
  const config = sizeConfig[size];
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={cn("w-full", config.container, config.spacing, className)}>
      {/* Header with model name and status */}
      {(showModelName || showIcon) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {showIcon && getStatusIcon(status, config.icon)}
            {showModelName && modelName && (
              <span className="font-medium text-slate-200 truncate">
                {modelName}
              </span>
            )}
          </div>
          {showPercentage && (
            <span className={cn("font-mono font-medium", getStatusColor(status))}>
              {clampedProgress.toFixed(0)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn(
            config.progressBar,
            getProgressBarColor(status),
            "rounded-full transition-all duration-300 ease-out",
            animated && "transition-all duration-500 ease-out"
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* Status message and download details */}
      {(statusMessage || downloadDetails) && (
        <div className="space-y-1">
          {statusMessage && (
            <div className={cn("truncate", getStatusColor(status))}>
              {statusMessage}
            </div>
          )}
          {downloadDetails && (
            <div className="text-slate-400 truncate">
              {downloadDetails}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LLMDownloadProgressBar;