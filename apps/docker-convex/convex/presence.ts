import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";

export const presence = new Presence(components.presence);

export const heartbeat = mutation({
  args: { 
    roomId: v.string(), 
    userId: v.string(), 
    sessionId: v.string(), 
    interval: v.number() 
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    // No auth checks needed for this use case - tracking anonymous users
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    // Avoid adding per-user reads so all subscriptions can share same cache
    return await presence.list(ctx, roomToken);
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    // Can't check auth here because it's called over http from sendBeacon
    return await presence.disconnect(ctx, sessionToken);
  },
});

// Helper query to get just the count of active users
export const getActiveUserCount = query({
  args: { roomId: v.optional(v.string()) },
  handler: async (ctx, { roomId = "main-site" }) => {
    const presenceList = await presence.list(ctx, roomId);
    return {
      total: presenceList.length,
      timestamp: Date.now(),
    };
  },
});