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
    interval: v.number(),
    // Enhanced location info
    ipAddress: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    zip: v.optional(v.string()),
    timezone: v.optional(v.string()),
    coordinates: v.optional(v.array(v.number())),
    isp: v.optional(v.string()),
    org: v.optional(v.string()),
    as: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval, ipAddress, country, countryCode, region, city, zip, timezone, coordinates, isp, org, as }) => {
    // No auth checks needed for this use case - tracking anonymous users
    const result = await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
    
    // Store location info in separate table if provided
    if (ipAddress && country) {
      // Update or insert location data
      const existing = await ctx.db
        .query("userLocations")
        .withIndex("by_user_session", (q) => 
          q.eq("userId", userId).eq("sessionId", sessionId)
        )
        .first();

      const locationData = {
        ipAddress,
        country,
        countryCode: countryCode || 'Unknown',
        region: region || 'Unknown',
        city: city || 'Unknown',
        zip: zip || 'Unknown',
        timezone: timezone || 'Unknown',
        coordinates: coordinates || [0, 0],
        isp: isp || 'Unknown',
        org: org || 'Unknown',
        as: as || 'Unknown',
        lastUpdated: Date.now(),
      };

      if (existing) {
        await ctx.db.patch(existing._id, locationData);
      } else {
        await ctx.db.insert("userLocations", {
          userId,
          sessionId,
          ...locationData,
        });
      }
    }
    
    return result;
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

// Query to get active users with their IP and location info
export const getActiveUsersWithLocation = query({
  args: { roomId: v.optional(v.string()) },
  handler: async (ctx, { roomId = "system-status" }) => {
    const presenceList = await presence.list(ctx, roomId);
    
    // Join with location data
    const usersWithLocation = await Promise.all(
      presenceList.map(async (user) => {
        // Extract userId from the presence data
        const userId = user.userId || 'unknown';
        
        // Look up the most recent location data for this user
        const locationData = await ctx.db
          .query("userLocations")
          .withIndex("by_user_session", (q) => 
            q.eq("userId", userId)
          )
          .order("desc")
          .first();
        
        return {
          ...user,
          sessionId: 'unknown', // Add sessionId for compatibility
          ipAddress: locationData?.ipAddress || 'unknown',
          country: locationData?.country || 'unknown',
          countryCode: locationData?.countryCode || 'unknown',
          region: locationData?.region || 'unknown',
          city: locationData?.city || 'unknown',
          zip: locationData?.zip || 'unknown',
          timezone: locationData?.timezone || 'unknown',
          coordinates: locationData?.coordinates || [0, 0],
          isp: locationData?.isp || 'unknown',
          org: locationData?.org || 'unknown',
          as: locationData?.as || 'unknown',
        };
      })
    );
    
    return {
      users: usersWithLocation,
      total: usersWithLocation.length,
      timestamp: Date.now(),
    };
  },
});

// Admin function to get detailed presence info for debugging
export const getPresenceDebugInfo = query({
  args: { roomId: v.optional(v.string()) },
  handler: async (ctx, { roomId = "system-status" }) => {
    const presenceList = await presence.list(ctx, roomId);
    return {
      total: presenceList.length,
      users: presenceList,
      timestamp: Date.now(),
    };
  },
});

// Note: The @convex-dev/presence component handles cleanup automatically.
// If you're seeing stuck counts, it might be due to:
// 1. Browser sessions not properly disconnecting (e.g., force-closed tabs)
// 2. Network issues preventing disconnect signals
// 3. Multiple browser tabs/windows from the same user
// The presence system should auto-cleanup after the configured timeout.