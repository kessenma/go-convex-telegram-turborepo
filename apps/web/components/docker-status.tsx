"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, Container, Network, Activity, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "../lib/utils";
import { renderIcon } from "../lib/icon-utils";
import { useStatusOperations } from "../hooks/use-status-operations";

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

export function DockerStatusIndicator({ size = "md", showLogs = true, className }: DockerStatusProps) {
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
          expandIcon: "w-3 h-3"
        };
      case "lg":
        return {
          container: "p-6",
          icon: "w-6 h-6",
          title: "text-lg font-semibold",
          subtitle: "text-sm",
          expandIcon: "w-4 h-4"
        };
      default:
        return {
          container: "p-4",
          icon: "w-5 h-5",
          title: "text-base font-medium",
          subtitle: "text-sm",
          expandIcon: "w-4 h-4"
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
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 transition-all duration-200 dark:bg-gray-900 dark:border-gray-700",
      className
    )}>
      <div 
        className={cn(
          "flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg",
          sizeClasses.container
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={cn("flex-shrink-0", getStatusColor())}>
            {renderIcon(StatusIcon, { 
              className: cn(sizeClasses.icon, loading && "animate-spin") 
            })}
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn("text-gray-900 dark:text-white", sizeClasses.title)}>
              Docker System
            </div>
            <div className={cn("text-gray-500 dark:text-gray-400", sizeClasses.subtitle)}>
              {status.message}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {consecutiveErrors > 0 && (
            <span className="text-xs text-red-500 dark:text-red-400">
              {consecutiveErrors} errors
            </span>
          )}
          {renderIcon(isExpanded ? ChevronDown : ChevronRight, {
            className: cn("text-gray-400 transition-transform", sizeClasses.expandIcon)
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
            <div className="px-4 pt-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
              {/* Services Status */}
              {status.services && status.services.length > 0 && (
                <div>
                  <h4 className="flex items-center mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {renderIcon(Container, { className: "w-4 h-4 mr-2" })}
                    Services ({status.services.length})
                  </h4>
                  <div className="space-y-2">
                    {status.services.map((service: DockerService, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{service.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            service.status === 'running' 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : service.status === 'starting'
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {service.status}
                          </span>
                          {service.uptime && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatUptime(service.uptime)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Network & Ports */}
              {status.networks && status.networks.length > 0 && (
                <div>
                  <h4 className="flex items-center mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {renderIcon(Network, { className: "w-4 h-4 mr-2" })}
                    Network & Ports
                  </h4>
                  {status.networks.map((network: DockerNetwork, networkIndex: number) => (
                    <div key={networkIndex} className="mb-4 space-y-2">
                      {network.name && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 dark:text-gray-300">Network</span>
                          <span className="text-gray-500 dark:text-gray-400">{network.name}</span>
                        </div>
                      )}
                      {network.driver && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 dark:text-gray-300">Driver</span>
                          <span className="text-gray-500 dark:text-gray-400">{network.driver}</span>
                        </div>
                      )}
                      {network.attachedServices && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 dark:text-gray-300">Attached Services</span>
                          <span className="text-gray-500 dark:text-gray-400">{network.attachedServices}</span>
                        </div>
                      )}
                      {network.ports && network.ports.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Exposed Ports:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {network.ports.map((port: string, index: number) => (
                              <span key={index} className="px-2 py-1 font-mono text-xs text-blue-800 bg-blue-100 rounded dark:bg-blue-900/30 dark:text-blue-400">
                                {port}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* System Resources */}
              {status.resources && (
                <div>
                  <h4 className="flex items-center mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {renderIcon(Activity, { className: "w-4 h-4 mr-2" })}
                    System Resources
                  </h4>
                  <div className="space-y-2">
                    {status.resources.cpu_usage !== undefined && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 dark:text-gray-300">CPU Usage</span>
                        <span className="text-gray-500 dark:text-gray-400">{status.resources.cpu_usage.toFixed(1)}%</span>
                      </div>
                    )}
                    {status.resources.memory_usage !== undefined && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Memory Usage</span>
                        <span className="text-gray-500 dark:text-gray-400">{status.resources.memory_usage.toFixed(1)}%</span>
                      </div>
                    )}
                    {status.resources.disk_usage !== undefined && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Disk Usage</span>
                        <span className="text-gray-500 dark:text-gray-400">{status.resources.disk_usage.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Details */}
              {status.details?.error && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">Error Details</h4>
                  <div className="p-2 text-sm text-red-600 bg-red-50 rounded dark:text-red-400 dark:bg-red-900/20">
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