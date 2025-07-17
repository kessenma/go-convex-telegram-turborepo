// apps/docker-convex/convex/userSessions.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Session timeout in milliseconds (5 minutes)
const SESSION_TIMEOUT = 5 * 60 * 1000;

/**
 * Create or update a user session
 */
export const upsertSession = mutation({
  args: {
    sessionId: v.string(),
    userId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    source: v.string(), // "web", "mobile", "telegram"
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if session already exists
    const existingSession = await ctx.db
      .query("user_sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existingSession) {
      // Update existing session
      await ctx.db.patch(existingSession._id, {
        isActive: true,
        lastHeartbeat: now,
        updatedAt: now,
        userAgent: args.userAgent,
        metadata: args.metadata,
      });
      return existingSession._id;
    } else {
      // Create new session
      const sessionId = await ctx.db.insert("user_sessions", {
        sessionId: args.sessionId,
        userId: args.userId,
        userAgent: args.userAgent,
        source: args.source,
        isActive: true,
        lastHeartbeat: now,
        createdAt: now,
        updatedAt: now,
        metadata: args.metadata,
      });
      return sessionId;
    }
  },
});

/**
 * Update session heartbeat to keep it alive
 */
export const heartbeat = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const session = await ctx.db
      .query("user_sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        isActive: true,
        lastHeartbeat: now,
        updatedAt: now,
      });
      return true;
    }
    return false;
  },
});

/**
 * Mark a session as inactive
 */
export const endSession = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("user_sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
      return true;
    }
    return false;
  },
});

/**
 * Get count of active users
 */
export const getActiveUserCount = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoffTime = now - SESSION_TIMEOUT;

    // Count sessions that are active and have recent heartbeats
    const activeSessions = await ctx.db
      .query("user_sessions")
      .withIndex("by_active_and_heartbeat", (q) => 
        q.eq("isActive", true).gte("lastHeartbeat", cutoffTime)
      )
      .collect();

    return {
      total: activeSessions.length,
      bySource: activeSessions.reduce((acc, session) => {
        acc[session.source] = (acc[session.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      timestamp: now,
    };
  },
});

/**
 * Get detailed session statistics
 */
export const getSessionStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoffTime = now - SESSION_TIMEOUT;
    const last24Hours = now - (24 * 60 * 60 * 1000);

    // Active sessions
    const activeSessions = await ctx.db
      .query("user_sessions")
      .withIndex("by_active_and_heartbeat", (q) => 
        q.eq("isActive", true).gte("lastHeartbeat", cutoffTime)
      )
      .collect();

    // Sessions created in last 24 hours
    const recentSessions = await ctx.db
      .query("user_sessions")
      .withIndex("by_created_at", (q) => q.gte("createdAt", last24Hours))
      .collect();

    // Calculate peak concurrent users in last 24 hours
    const hourlyBuckets: Record<number, number> = {};
    recentSessions.forEach(session => {
      const hour = Math.floor(session.createdAt / (60 * 60 * 1000));
      hourlyBuckets[hour] = (hourlyBuckets[hour] || 0) + 1;
    });
    
    const peakConcurrent = Math.max(...Object.values(hourlyBuckets), 0);

    return {
      current: {
        total: activeSessions.length,
        bySource: activeSessions.reduce((acc, session) => {
          acc[session.source] = (acc[session.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      last24Hours: {
        totalSessions: recentSessions.length,
        peakConcurrent,
        uniqueUsers: new Set(recentSessions.map(s => s.userId).filter(Boolean)).size,
      },
      timestamp: now,
    };
  },
});

/**
 * Clean up expired sessions (should be called periodically)
 */
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoffTime = now - SESSION_TIMEOUT;

    // Find expired sessions
    const expiredSessions = await ctx.db
      .query("user_sessions")
      .withIndex("by_last_heartbeat", (q) => q.lt("lastHeartbeat", cutoffTime))
      .collect();

    // Mark them as inactive
    const updatePromises = expiredSessions.map(session => 
      ctx.db.patch(session._id, {
        isActive: false,
        updatedAt: now,
      })
    );

    await Promise.all(updatePromises);

    return {
      cleanedUp: expiredSessions.length,
      timestamp: now,
    };
  },
});

/**
 * Get all active sessions (for admin/debugging)
 */
export const getActiveSessions = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoffTime = now - SESSION_TIMEOUT;

    const activeSessions = await ctx.db
      .query("user_sessions")
      .withIndex("by_active_and_heartbeat", (q) => 
        q.eq("isActive", true).gte("lastHeartbeat", cutoffTime)
      )
      .collect();

    return activeSessions.map(session => ({
      sessionId: session.sessionId,
      userId: session.userId,
      source: session.source,
      createdAt: session.createdAt,
      lastHeartbeat: session.lastHeartbeat,
      userAgent: session.userAgent,
    }));
  },
});