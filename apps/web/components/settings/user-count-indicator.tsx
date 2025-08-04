"use client";

import { Users } from "lucide-react";
import { usePresence } from "../../hooks/use-presence";
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
  const { activeUserCount, isActive } = usePresence(true, "system-status");

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
    return isActive ? "text-green-500" : "text-gray-500";
  };

  const getStatusBgColor = () => {
    return "bg-slate-900/80 backdrop-blur-sm";
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
                status={isActive ? "connected" : "disconnected"}
                size="sm"
                showLabel={false}
              />
            </div>

            <div className="flex items-center mt-1 space-x-2">
              <span className="text-2xl font-bold text-slate-100">
                <CountUp
                  to={activeUserCount}
                  duration={1.5}
                  className="tabular-nums"
                />
              </span>
              <span className="text-sm text-slate-300">online</span>
            </div>
          </div>
        </div>
      </div>

      {showLogs && (
        <div className="pt-3 mt-3 border-t border-slate-700/50">
          <p className="text-xs text-slate-300">
            Real-time presence tracking via @convex-dev/presence
          </p>
        </div>
      )}
    </Card>
  );
}
