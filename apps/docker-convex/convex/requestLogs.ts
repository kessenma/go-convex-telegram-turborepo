// apps/docker-convex/convex/requestLogs.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Log a request for statistics tracking
export const logRequest = mutation({
  args: {
    endpoint: v.string(),
    method: v.string(),
    responseStatus: v.number(),
    processingTimeMs: v.optional(v.number()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    requestSource: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("request_logs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get request statistics for the last hour
export const getRequestStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds
    const oneDayAgo = now - (24 * 60 * 60 * 1000); // 24 hours in milliseconds

    // Get requests from the last hour
    const recentRequests = await ctx.db
      .query("request_logs")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), oneHourAgo))
      .collect();

    // Get requests from the last 24 hours for daily stats
    const dailyRequests = await ctx.db
      .query("request_logs")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), oneDayAgo))
      .collect();

    // Calculate statistics
    const requestsPerHour = recentRequests.length;
    const requestsPerDay = dailyRequests.length;
    
    // Calculate success rate (2xx status codes)
    const successfulRequests = recentRequests.filter(r => r.responseStatus >= 200 && r.responseStatus < 300);
    const successRate = recentRequests.length > 0 ? (successfulRequests.length / recentRequests.length) * 100 : 100;

    // Calculate average response time
    const requestsWithTiming = recentRequests.filter(r => r.processingTimeMs !== undefined);
    const avgResponseTime = requestsWithTiming.length > 0 
      ? requestsWithTiming.reduce((sum, r) => sum + (r.processingTimeMs || 0), 0) / requestsWithTiming.length
      : 0;

    // Get endpoint breakdown
    const endpointStats = recentRequests.reduce((acc, req) => {
      acc[req.endpoint] = (acc[req.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      requestsPerHour,
      requestsPerDay,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      endpointStats,
      totalRequests: recentRequests.length,
      timestamp: now,
    };
  },
});

// Get system uptime (approximate based on first request log)
export const getSystemUptime = query({
  args: {},
  handler: async (ctx) => {
    const firstRequest = await ctx.db
      .query("request_logs")
      .withIndex("by_timestamp")
      .order("asc")
      .first();

    if (!firstRequest) {
      return {
        uptime: 0,
        startTime: Date.now(),
      };
    }

    const uptime = Date.now() - firstRequest.timestamp;
    return {
      uptime: uptime / 1000, // Return in seconds
      startTime: firstRequest.timestamp,
    };
  },
});