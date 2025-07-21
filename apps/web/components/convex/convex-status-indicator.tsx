"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Info,
  Loader2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useConvexStatus } from "../../hooks/use-status-operations";
import { renderIcon } from "../../lib/icon-utils";
import { cn } from "../../lib/utils";

interface ConvexStatusIndicatorProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  showLogs?: boolean;
  status?: "connected" | "connecting" | "disconnected";
  ready?: boolean;
  message?: string;
  uptime?: number;
  statistics?: {
    requestsPerHour?: number;
    requestsPerDay?: number;
    successRate?: number;
    avgResponseTime?: number;
    totalRequests?: number;
  };
}

const statusColors = {
  connected: "bg-green-500",
  connecting: "bg-yellow-500",
  disconnected: "bg-red-500",
};

const statusSizes = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

const _statusLabels = {
  connected: "Database Ready",
  connecting: "Connecting",
  disconnected: "Database Error",
};

export const ConvexStatusIndicator = ({
  size = "md",
  showLabel = true,
  className,
  showLogs = true,
}: ConvexStatusIndicatorProps): React.ReactElement => {
  const { status: convexStatus, loading } = useConvexStatus();

  // Extract values from the status object
  const { status, ready, message, uptime, statistics, performance, details } =
    convexStatus;
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    if (status === "connected" && ready) {
      return renderIcon(CheckCircle, { className: "w-4 h-4 text-green-400" });
    } else if (status === "disconnected") {
      return renderIcon(AlertCircle, { className: "w-4 h-4 text-red-400" });
    } else {
      return renderIcon(Loader2, {
        className: "w-4 h-4 text-yellow-400 animate-spin",
      });
    }
  };

  const getStatusText = () => {
    if (status === "connected" && ready) {
      return "Database Connected";
    } else if (status === "disconnected") {
      return "Database Disconnected";
    } else {
      return "Connecting to Database...";
    }
  };

  const getStatusColor = () => {
    if (status === "connected" && ready) {
      return "text-green-400";
    } else if (status === "disconnected") {
      return "text-red-400";
    } else {
      return "text-yellow-400";
    }
  };

  const formatUptime = (uptimeSeconds?: number) => {
    if (!uptimeSeconds) return null;
    if (uptimeSeconds < 60) return `${uptimeSeconds.toFixed(1)}s`;
    if (uptimeSeconds < 3600) return `${(uptimeSeconds / 60).toFixed(1)}m`;
    if (uptimeSeconds < 86400) return `${(uptimeSeconds / 3600).toFixed(1)}h`;
    return `${(uptimeSeconds / 86400).toFixed(1)}d`;
  };

  const getProgressMessage = () => {
    if (status === "connecting") {
      return "Establishing database connection...";
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
          {renderIcon(Database, { className: "w-5 h-5 text-slate-400" })}
          <div
            className={cn(
              "rounded-full",
              statusColors[status],
              statusSizes[size],
              status === "connecting" ? "animate-pulse" : "",
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
            {details?.service && status === "connected" && (
              <div className="mt-1 text-xs text-slate-400">
                Service: {details.service}
              </div>
            )}
            {uptime && (
              <div className="mt-1 text-xs text-slate-400">
                Uptime: {formatUptime(uptime)}
              </div>
            )}
            {statistics?.requestsPerHour !== undefined && (
              <div className="mt-1 text-xs text-slate-400">
                Requests/hour: {statistics.requestsPerHour}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 items-center ml-auto">
          {getStatusIcon()}
          {showLogs && (details || statistics || performance) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 transition-colors hover:text-cyan-400"
              title="View detailed logs"
            >
              {renderIcon(Info, { className: "w-4 h-4" })}
            </button>
          )}
          {showLogs && (details || statistics || performance) && (
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
      {isExpanded && (details || statistics || performance) && (
        <div className="p-3 border-t border-slate-700/50 bg-slate-950/50">
          <div className="space-y-4">
            <div className="flex gap-2 items-center mb-2 text-xs text-slate-400">
              {renderIcon(Info, { className: "w-3 h-3" })}
              <span className="font-medium">Database Details</span>
            </div>

            {/* Service Status */}
            <div className="grid grid-cols-1 gap-2 text-xs">
              {details?.service_status && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Service Status:</span>
                  <span className="font-mono text-slate-200">
                    {details.service_status}
                  </span>
                </div>
              )}

              {details?.database_status && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Database Status:</span>
                  <span
                    className={cn(
                      "font-mono",
                      details.database_status === "connected"
                        ? "text-cyan-400"
                        : "text-red-400"
                    )}
                  >
                    {details.database_status === "connected"
                      ? "✓ Connected"
                      : "✗ Disconnected"}
                  </span>
                </div>
              )}

              {uptime && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Uptime:</span>
                  <span className="font-mono text-slate-200">
                    {formatUptime(uptime)}
                  </span>
                </div>
              )}

              {details?.version && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Version:</span>
                  <span className="font-mono text-slate-200">
                    {details.version}
                  </span>
                </div>
              )}
            </div>

            {/* Statistics */}
            {statistics && (
              <div>
                <div className="flex gap-2 items-center mb-2 text-xs text-slate-400">
                  {renderIcon(Activity, { className: "w-3 h-3" })}
                  <span className="font-medium">Request Statistics</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {statistics.requestsPerHour !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Requests/Hour:</span>
                      <span className="font-mono text-cyan-400">
                        {statistics.requestsPerHour}
                      </span>
                    </div>
                  )}

                  {statistics.requestsPerDay !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Requests/Day:</span>
                      <span className="font-mono text-cyan-400">
                        {statistics.requestsPerDay}
                      </span>
                    </div>
                  )}

                  {statistics.successRate !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Success Rate:</span>
                      <span
                        className={cn(
                          "font-mono",
                          statistics.successRate >= 95
                            ? "text-cyan-400"
                            : statistics.successRate >= 80
                              ? "text-yellow-400"
                              : "text-red-400"
                        )}
                      >
                        {statistics.successRate.toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {statistics.avgResponseTime !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Response:</span>
                      <span className="font-mono text-cyan-300">
                        {statistics.avgResponseTime.toFixed(1)}ms
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance */}
            {performance && (
              <div>
                <div className="flex gap-2 items-center mb-2 text-xs text-slate-400">
                  {renderIcon(Zap, { className: "w-3 h-3" })}
                  <span className="font-medium">Performance</span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {performance.processingTimeMs !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Request Time:</span>
                      <span className="font-mono text-cyan-400">
                        {performance.processingTimeMs.toFixed(1)}ms
                      </span>
                    </div>
                  )}

                  {performance.memoryUsage &&
                    performance.memoryUsage !== "N/A" && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Memory Usage:</span>
                        <span className="font-mono text-yellow-400">
                          {performance.memoryUsage}
                        </span>
                      </div>
                    )}

                  {performance.activeConnections &&
                    performance.activeConnections !== "N/A" && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Active Connections:
                        </span>
                        <span className="font-mono text-cyan-400">
                          {performance.activeConnections}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Timestamp */}
            {details?.last_check && (
              <div className="pt-2 border-t border-slate-700/50">
                <div className="flex gap-2 items-center text-xs text-slate-500">
                  {renderIcon(Clock, { className: "w-3 h-3" })}
                  <span>
                    Last checked:{" "}
                    {new Date(details.last_check).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}

            {details?.error && (
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
      )}
    </div>
  );
};
