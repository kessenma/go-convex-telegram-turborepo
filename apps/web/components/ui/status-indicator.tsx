"use client";
import React from "react";
import { cn } from "../../lib/utils";

interface StatusIndicatorProps {
  status: "connected" | "connecting" | "disconnected";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const statusColors = {
  connected: "bg-green-500",
  connecting: "bg-yellow-500",
  disconnected: "bg-red-500"
};

const statusSizes = {
  sm: "w-z h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4"
};

const statusLabels = {
  connected: "Connected",
  connecting: "Connecting",
  disconnected: "Disconnected"
};

export const StatusIndicator = ({
  status,
  size = "md",
  showLabel = false,
  className
}: StatusIndicatorProps) => {
  return (
    <div className={cn("flex gap-2 items-center", className)}>
      <div className={cn(
        "rounded-full animate-pulse",
        statusColors[status],
        statusSizes[size],
        "shadow-lg",
        `shadow-${status === "connected" ? "green" : status === "connecting" ? "yellow" : "red"}-500/50`
      )} />
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
};