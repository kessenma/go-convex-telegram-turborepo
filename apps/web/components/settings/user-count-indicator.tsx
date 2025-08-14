"use client";

import { Users, Globe, MapPin, Building, Mail, Clock, Wifi } from "lucide-react";
import { renderIcon } from "../../lib/icon-utils";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { StatusIndicator } from "../ui/status-indicator";
import CountUp from "../ui/text-animations/count-up";
import { EnhancedFacePile } from "../ui/enhanced-face-pile";
import { usePresenceWithLocation } from "../../hooks/use-presence-with-location";

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
  // Use the enhanced presence hook with location data
  const { onlineUsers, activeUserCount, isActive } = usePresenceWithLocation("system-status");
  
  console.log("UserCountIndicator render:", { onlineUsers, activeUserCount, isActive });

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
              "flex items-center justify-center rounded-full p-1.5 relative",
              getStatusBgColor()
            )}
          >
            {/* Tron-like glow effect for the icon */}
            <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-sm"></div>
            <div className="absolute inset-0 rounded-full border border-cyan-400/30"></div>
            {renderIcon(Users, {
              className: cn(iconSizes[size], "text-cyan-400 relative z-10"),
            })}
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-cyan-300 tracking-wide">Active Users</h3>
              <StatusIndicator 
                status={isActive ? "connected" : "disconnected"}
                size="sm"
                showLabel={false}
              />
            </div>

            <div className="flex items-center mt-1 space-x-2">
              <span className="text-2xl font-bold text-cyan-400 relative">
                <span className="absolute -inset-1 bg-cyan-400/10 blur-sm rounded"></span>
                <CountUp
                  to={activeUserCount}
                  duration={1.5}
                  className="tabular-nums relative z-10"
                />
              </span>
              <span className="text-sm text-cyan-200/70">online</span>
            </div>
            
            {/* Display online users using EnhancedFacePile with IP/country info */}
            {onlineUsers.length > 0 && (
              <div className="mt-2 relative">
                <EnhancedFacePile presenceState={onlineUsers} showLocation={true} />
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogs && (
        <div className="pt-3 mt-3 border-t border-cyan-500/20 relative">
          {/* Tron-like horizontal line glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
          
          <p className="text-xs text-cyan-300/80">
            Real-time presence tracking with FacePile via @convex-dev/presence
          </p>
          {onlineUsers.length > 0 && (
            <p className="mt-1 text-xs text-cyan-200/50">
              Showing {onlineUsers.length} online user{onlineUsers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
