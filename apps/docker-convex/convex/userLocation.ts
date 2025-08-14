import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Store user location data separately from presence
export const updateUserLocation = mutation({
  args: {
    userId: v.string(),
    sessionId: v.string(),
    ipAddress: v.string(),
    country: v.string(),
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
  handler: async (ctx, args) => {
    // Upsert user location data
    const existing = await ctx.db
      .query("userLocations")
      .withIndex("by_user_session", (q) => 
        q.eq("userId", args.userId).eq("sessionId", args.sessionId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastUpdated: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("userLocations", {
        ...args,
        lastUpdated: Date.now(),
      });
    }
  },
});

// Get location data for a specific user session
export const getUserLocation = query({
  args: {
    userId: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, { userId, sessionId }) => {
    return await ctx.db
      .query("userLocations")
      .withIndex("by_user_session", (q) => 
        q.eq("userId", userId).eq("sessionId", sessionId)
      )
      .first();
  },
});

// Get all user locations (for admin/debug purposes)
export const getAllUserLocations = query({
  handler: async (ctx) => {
    return await ctx.db.query("userLocations").collect();
  },
});

// Clean up old location data (older than 24 hours)
export const cleanupOldLocations = mutation({
  handler: async (ctx) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const oldLocations = await ctx.db
      .query("userLocations")
      .filter((q) => q.lt(q.field("lastUpdated"), oneDayAgo))
      .collect();

    for (const location of oldLocations) {
      await ctx.db.delete(location._id);
    }

    return { deleted: oldLocations.length };
  },
});