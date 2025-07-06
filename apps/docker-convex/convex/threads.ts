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

// Get threads in a specific chat
export const getThreadsInChat = query({
  args: {
    chatId: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("telegram_threads")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(limit);
  },
});

// Get thread by ID
export const getThreadById = query({
  args: {
    threadDocId: v.id("telegram_threads"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.threadDocId);
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