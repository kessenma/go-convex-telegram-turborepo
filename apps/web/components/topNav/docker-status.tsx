"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Container,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useStatusOperations } from "../../hooks/use-status-operations";
import { renderIcon } from "../../lib/icon-utils";
import { cn } from "../../lib/utils";

interface DockerStatusProps {
  size?: "sm" | "md" | "lg";
  showLogs?: boolean;
  className?: string;
}

interface DockerService {
  name: string;
  status: string;
  health?: string;
  port?: string;
  uptime?: string;
  restarts?: number;
}

interface DockerNetwork {
  name?: string;
  driver?: string;
  scope?: string;
  attachedServices?: number;
  ports?: string[];
}

interface DockerResources {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
}

interface DockerStatus {
  status: string;
  message: string;
  ready: boolean;
  services: DockerService[];
  networks: DockerNetwork[];
  resources: DockerResources;
  details?: {
    error?: string;
  };
}

export function DockerStatusIndicator({
  size = "md",
  showLogs = true,
  className,
}: DockerStatusProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const operations = useStatusOperations();
  const status = operations.dockerStatus;
  const loading = operations.loading?.docker || false;
  const lastUpdated = operations.lastUpdated?.docker || 0;
  const consecutiveErrors = operations.consecutiveErrors?.docker || 0;
  const checkDockerStatus = operations.checkDockerStatus;

  const getStatusColor = () => {
    switch (status.status) {
      case "healthy":
        return "text-green-600 dark:text-green-400";
      case "degraded":
        return "text-yellow-600 dark:text-yellow-400";
      case "critical":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = () => {
    if (loading) {
      return Clock;
    }
    switch (status.status) {
      case "healthy":
        return CheckCircle;
      case "degraded":
      case "critical":
        return AlertCircle;
      default:
        return Container;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "p-3",
          icon: "w-4 h-4",
          title: "text-sm font-medium",
          subtitle: "text-xs",
          expandIcon: "w-3 h-3",
        };
      case "lg":
        return {
          container: "p-6",
          icon: "w-6 h-6",
          title: "text-lg font-semibold",
          subtitle: "text-sm",
          expandIcon: "w-4 h-4",
        };
      default:
        return {
          container: "p-4",
          icon: "w-5 h-5",
          title: "text-base font-medium",
          subtitle: "text-sm",
          expandIcon: "w-4 h-4",
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const StatusIcon = getStatusIcon();

  const formatUptime = (uptime: string) => {
    return uptime; // Uptime is already formatted from the API
  };

  const formatLastUpdated = (timestamp: number) => {
    if (!timestamp) return "Never";
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div
      className={cn(
        "rounded-lg border backdrop-blur-sm transition-all duration-200 border-slate-700/50 bg-slate-900/80",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors rounded-lg",
          sizeClasses.container
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={cn("flex-shrink-0", getStatusColor())}>
            {renderIcon(StatusIcon, {
              className: cn(sizeClasses.icon, loading && "animate-spin"),
            })}
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn("text-slate-200", sizeClasses.title)}>
              Docker System
            </div>
            <div className={cn("text-slate-400", sizeClasses.subtitle)}>
              {status.message}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {consecutiveErrors > 0 && (
            <span className="text-xs text-red-400">
              {consecutiveErrors} errors
            </span>
          )}
          {renderIcon(isExpanded ? ChevronDown : ChevronRight, {
            className: cn(
              "text-slate-400 transition-transform",
              sizeClasses.expandIcon
            ),
          })}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-4 pb-4 space-y-4 border-t border-slate-700/50">
              {/* Services Status */}
              {status.services && status.services.length > 0 && (
                <div>
                  <h4 className="flex items-center mb-2 text-sm font-medium text-slate-200">
                    {renderIcon(Container, { className: "w-4 h-4 mr-2" })}
                    Services ({status.services.length})
                  </h4>
                  <div className="space-y-2">
                    {status.services.map(
                      (service: DockerService, index: number) => {
                        const isConvexBackend = service.name.includes('convex-backend');
                        return (
                          <div key={index}>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-300">{service.name}</span>
                              <div className="flex items-center space-x-2">
                                {service.port && (
                                  <span className="px-2 py-1 font-mono text-xs text-cyan-400 rounded bg-cyan-900/30">
                                    {service.port}
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    "px-2 py-1 rounded text-xs font-medium",
                                    service.status === "running"
                                      ? "bg-cyan-900/30 text-cyan-400"
                                      : service.status === "starting"
                                        ? "bg-yellow-900/30 text-yellow-400"
                                        : "bg-red-900/30 text-red-400"
                                  )}
                                >
                                  {service.status}
                                </span>
                                {service.uptime && (
                                  <span className="text-xs text-slate-400">
                                    {formatUptime(service.uptime)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isConvexBackend && (
                              <div className="mt-1 ml-4 text-xs text-slate-400">
                                Backend: {process.env.NEXT_PUBLIC_CONVEX_URL?.split(':')[2] || '3210'} • API: {process.env.NEXT_PUBLIC_CONVEX_HTTP_PORT || '3211'}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* System Resources */}
              {status.resources && (
                <div>
                  <h4 className="flex items-center mb-2 text-sm font-medium text-slate-200">
                    {renderIcon(Activity, { className: "w-4 h-4 mr-2" })}
                    System Resources
                  </h4>
                  <div className="space-y-2">
                    {status.resources.cpu_usage !== undefined && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-300">CPU Usage</span>
                        <span className="text-slate-400">
                          {status.resources.cpu_usage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">RAM Allocated</span>
                      <span className="text-slate-400">
                        {process.env.NEXT_PUBLIC_TOTAL_RAM_ALLOCATED || '11.375G'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">RAM Available</span>
                      <span className="text-slate-400">
                        {process.env.NEXT_PUBLIC_RAM_AVAILABLE || '8G'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">RAM Usage</span>
                      <span className={cn(
                        "text-sm font-medium",
                        (() => {
                          const allocated = parseFloat(process.env.NEXT_PUBLIC_TOTAL_RAM_ALLOCATED?.replace('G', '') || '11.375');
                          const available = parseFloat(process.env.NEXT_PUBLIC_RAM_AVAILABLE?.replace('G', '') || '8');
                          const percentage = (allocated / available) * 100;
                          if (percentage > 100) return "text-red-400";
                          if (percentage > 80) return "text-yellow-400";
                          return "text-green-400";
                        })()
                      )}>
                        {(() => {
                          const allocated = parseFloat(process.env.NEXT_PUBLIC_TOTAL_RAM_ALLOCATED?.replace('G', '') || '11.375');
                          const available = parseFloat(process.env.NEXT_PUBLIC_RAM_AVAILABLE?.replace('G', '') || '8');
                          const percentage = (allocated / available) * 100;
                          return `${percentage.toFixed(1)}%`;
                        })()}
                        {(() => {
                          const allocated = parseFloat(process.env.NEXT_PUBLIC_TOTAL_RAM_ALLOCATED?.replace('G', '') || '11.375');
                          const available = parseFloat(process.env.NEXT_PUBLIC_RAM_AVAILABLE?.replace('G', '') || '8');
                          return allocated > available ? ' (Overcommit)' : '';
                        })()}
                      </span>
                    </div>
                    {status.resources.disk_usage !== undefined && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-300">Disk Usage</span>
                        <span className="text-slate-400">
                          {status.resources.disk_usage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Details */}
              {status.details?.error && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-red-400">
                    Error Details
                  </h4>
                  <div className="p-2 text-sm text-red-400 rounded bg-red-900/20">
                    {status.details.error}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      checkDockerStatus();
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { DockerStatusIndicator as DockerStatus };
