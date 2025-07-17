"use client";

import React from "react";
import { Users } from "lucide-react";
import { cn } from "../../lib/utils";
import { renderIcon } from "../../lib/icon-utils";
import { useUserCountStatus } from "../../hooks/use-status-operations";
import CountUp from "../ui/text-animations/count-up";

interface UserCountIndicatorProps {
  size?: "sm" | "md" | "lg";
  showLogs?: boolean;
  className?: string;
}

export function UserCountIndicator({
  size = "md",
  showLogs = true,
  className
}: UserCountIndicatorProps) {
  const { status, loading } = useUserCountStatus();

  const sizeClasses = {
    sm: "p-3 text-sm",
    md: "p-4 text-base",
    lg: "p-6 text-lg"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const getStatusColor = () => {
    if (loading) return "text-yellow-500";
    
    switch (status.status) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      case "disconnected":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBgColor = () => {
    if (loading) return "bg-yellow-50 dark:bg-yellow-900/20";
    
    switch (status.status) {
      case "connected":
        return "bg-green-50 dark:bg-green-900/20";
      case "connecting":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      case "disconnected":
        return "bg-red-50 dark:bg-red-900/20";
      default:
        return "bg-gray-50 dark:bg-gray-900/20";
    }
  };

  return (
    <div className={cn(
      "rounded-lg border transition-all duration-200",
      sizeClasses[size],
      getStatusBgColor(),
      "border-gray-200 dark:border-gray-700",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "flex items-center justify-center rounded-full p-1.5",
            getStatusBgColor()
          )}>
            {renderIcon(Users, {
              className: cn(iconSizes[size], getStatusColor())
            })}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Active Users
              </h3>
              <div className={cn(
                "w-2 h-2 rounded-full",
                loading ? "bg-yellow-400 animate-pulse" : 
                status.status === "connected" ? "bg-green-400" :
                status.status === "connecting" ? "bg-yellow-400 animate-pulse" :
                "bg-red-400"
              )} />
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  <CountUp
                    to={status.activeUsers}
                    duration={1.5}
                    className="tabular-nums"
                  />
                )}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                online
              </span>
            </div>
            
            {status.bySource && (
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                {status.bySource.web && (
                  <span>Web: {status.bySource.web}</span>
                )}
                {status.bySource.mobile && (
                  <span>Mobile: {status.bySource.mobile}</span>
                )}
                {status.bySource.telegram && (
                  <span>Telegram: {status.bySource.telegram}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showLogs && status.details?.lastUpdated && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {new Date(status.details.lastUpdated).toLocaleTimeString()}
          </p>
          {status.details.error && (
            <p className="text-xs text-red-500 mt-1">
              Error: {status.details.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}