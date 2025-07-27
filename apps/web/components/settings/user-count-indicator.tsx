"use client";

import { Users } from "lucide-react";
import { useUserCountStatus } from "../../hooks/use-status-operations";
import { renderIcon } from "../../lib/icon-utils";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { StatusIndicator } from "../ui/status-indicator";
import CountUp from "../ui/text-animations/count-up";

interface UserCountIndicatorProps {
  size?: "sm" | "md" | "lg";
  showLogs?: boolean;
  className?: string;
}

export function UserCountIndicator({
  size = "md",
  showLogs = true,
  className,
}: UserCountIndicatorProps): React.ReactElement {
  const { status, loading } = useUserCountStatus();

  const sizeClasses = {
    sm: "p-3 text-sm",
    md: "p-4 text-base",
    lg: "p-6 text-lg",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
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
    if (loading) return "bg-slate-900/80 backdrop-blur-sm";

    switch (status.status) {
      case "connected":
        return "bg-slate-900/80 backdrop-blur-sm";
      case "connecting":
        return "bg-slate-900/80 backdrop-blur-sm";
      case "disconnected":
        return "bg-slate-900/80 backdrop-blur-sm";
      default:
        return "bg-slate-900/80 backdrop-blur-sm";
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        sizeClasses[size],
        className
      )}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              "flex items-center justify-center rounded-full p-1.5",
              getStatusBgColor()
            )}
          >
            {renderIcon(Users, {
              className: cn(iconSizes[size], getStatusColor()),
            })}
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-slate-100">Active Users</h3>
              <StatusIndicator 
                status={loading ? "connecting" : status.status === "error" ? "disconnected" : status.status}
                size="sm"
                showLabel={false}
              />
            </div>

            <div className="flex items-center mt-1 space-x-2">
              <span className="text-2xl font-bold text-slate-100">
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
              <span className="text-sm text-slate-300">online</span>
            </div>

            {status.bySource && (
              <div className="flex items-center mt-2 space-x-4 text-xs text-slate-300">
                {status.bySource.web && <span>Web: {status.bySource.web}</span>}
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
        <div className="pt-3 mt-3 border-t border-slate-700/50">
          <p className="text-xs text-slate-300">
            Last updated:{" "}
            {new Date(status.details.lastUpdated).toLocaleTimeString()}
          </p>
          {status.details.error && (
            <p className="mt-1 text-xs text-red-400">
              Error: {status.details.error}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
