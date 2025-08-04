"use client";

import { api } from "../generated-convex";
import usePresence from "@convex-dev/presence/react";
import { useEffect, useState } from "react";

/**
 * Hook to manage user presence for tracking active users
 * Uses Convex presence component for real-time updates without polling
 * @param enabled - Whether to enable presence tracking (defaults to true)
 * @param roomId - Room identifier for presence tracking (defaults to "main-site")
 */
export function useUserPresence(enabled: boolean = true, roomId: string = "main-site") {
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Use the Convex presence hook
  const presenceState = usePresence(
    enabled ? api.presence : undefined,
    roomId,
    userId
  );

  // Extract just the count for compatibility with existing components
  const activeUserCount = presenceState?.length || 0;

  return {
    activeUserCount,
    presenceState,
    userId,
    isActive: enabled && presenceState !== undefined,
  };
}