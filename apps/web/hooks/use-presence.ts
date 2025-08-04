"use client";

import { api } from "../generated-convex";
import useConvexPresence from "@convex-dev/presence/react";
import { useState } from "react";

/**
 * Hook to manage user presence for tracking active users
 * Uses Convex presence component for real-time updates without polling
 * @param enabled - Whether to enable presence tracking (defaults to true)
 * @param roomId - Room identifier for presence tracking (defaults to "main-site")
 */
export function usePresence(enabled: boolean = true, roomId: string = "main-site") {
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Use the Convex presence hook - only call when enabled
  const presenceState = enabled ? useConvexPresence(
    api.presence,
    roomId,
    userId
  ) : null;

  // Extract just the count for compatibility with existing components
  const activeUserCount = presenceState?.length || 0;

  return {
    activeUserCount,
    presenceState,
    userId,
    isActive: enabled && presenceState !== null,
  };
}