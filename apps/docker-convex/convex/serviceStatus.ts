import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create new service status entry (always creates new records for history)
export const updateServiceStatus = mutation({
  args: {
    serviceName: v.string(),
    status: v.string(),
    ready: v.boolean(),
    message: v.string(),
    modelLoaded: v.optional(v.boolean()),
    modelLoading: v.optional(v.boolean()),
    model: v.optional(v.string()),
    uptime: v.optional(v.number()),
    error: v.optional(v.string()),
    degradedMode: v.optional(v.boolean()),
    memoryUsage: v.optional(v.object({
      processCpuPercent: v.optional(v.number()),
      processMemoryMb: v.optional(v.number()),
      processMemoryPercent: v.optional(v.number()),
      systemMemoryAvailableGb: v.optional(v.number()),
      systemMemoryTotalGb: v.optional(v.number()),
      systemMemoryUsedPercent: v.optional(v.number()),
      rssMb: v.optional(v.number()),
      vmsMb: v.optional(v.number()),
      percent: v.optional(v.number()),
      availableMb: v.optional(v.number()),
    })),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Always create new status entry for historical tracking
    const id = await ctx.db.insert("service_statuses", {
      ...args,
      lastUpdated: now,
    });
    
    return { success: true, created: true, id };
  },
});

// Query to get all service statuses
export const getAllServiceStatuses = query({
  args: {},
  handler: async (ctx) => {
    const statuses = await ctx.db
      .query("service_statuses")
      .withIndex("by_last_updated")
      .order("desc")
      .collect();
    
    return statuses;
  },
});

// Query to get a specific service status
export const getServiceStatus = query({
  args: {
    serviceName: v.string(),
  },
  handler: async (ctx, args) => {
    const status = await ctx.db
      .query("service_statuses")
      .withIndex("by_service_name", (q) => q.eq("serviceName", args.serviceName))
      .first();
    
    return status;
  },
});

// Mutation to cleanup old status entries (keep only latest 100 entries)
export const cleanupOldStatuses = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all statuses ordered by timestamp (newest first)
    const allStatuses = await ctx.db
      .query("service_statuses")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();
    
    // If we have more than 100 entries, delete the oldest ones
    if (allStatuses.length > 100) {
      const statusesToDelete = allStatuses.slice(100); // Keep first 100, delete the rest
      
      for (const status of statusesToDelete) {
        await ctx.db.delete(status._id);
      }
      
      return { deleted: statusesToDelete.length, remaining: 100 };
    }
    
    return { deleted: 0, remaining: allStatuses.length };
  },
});