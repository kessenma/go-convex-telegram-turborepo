import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all active threads with pagination
export const getAllActiveThreads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("telegram_threads")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(limit);
  },
});

// Get thread statistics
export const getThreadStats = query({
  args: {},
  handler: async (ctx) => {
    const allThreads = await ctx.db
      .query("telegram_threads")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const totalThreads = allThreads.length;
    const totalMessages = allThreads.reduce((sum, thread) => sum + (thread.messageCount || 0), 0);
    
    return {
      totalThreads,
      totalMessages,
    };
  },
});

// Get thread by document ID
export const getThreadById = query({
  args: {
    threadDocId: v.id("telegram_threads"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.threadDocId);
  },
});