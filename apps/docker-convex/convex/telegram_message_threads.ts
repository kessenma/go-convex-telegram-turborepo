import { v } from "convex/values";
import { query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Input types for helper functions
export type GetAllActiveThreadsInput = {
  limit?: number;
};

export type GetThreadsInChatInput = {
  chatId: number;
  limit?: number;
};

export type GetThreadByIdInput = {
  threadDocId: Id<"telegram_threads">;
};

export type GetThreadStatsInput = {
  // No specific input needed for general stats
};

// Helper functions for HTTP actions
export async function getAllActiveThreadsFromDb(
  ctx: any,
  args: GetAllActiveThreadsInput
) {
  const limit = args.limit || 50;
  return await ctx.db
    .query("telegram_threads")
    .withIndex("by_active", (q: any) => q.eq("isActive", true))
    .order("desc")
    .take(limit);
}

export async function getThreadsInChatFromDb(
  ctx: any,
  args: GetThreadsInChatInput
) {
  const limit = args.limit || 50;
  return await ctx.db
    .query("telegram_threads")
    .withIndex("by_chat_and_active", (q: any) => q.eq("chatId", args.chatId).eq("isActive", true))
    .order("desc")
    .take(limit);
}

export async function getThreadByIdFromDb(
  ctx: any,
  args: GetThreadByIdInput
) {
  return await ctx.db.get(args.threadDocId);
}

export async function getThreadStatsFromDb(
  ctx: any,
  args: GetThreadStatsInput
) {
  const allThreads = await ctx.db
    .query("telegram_threads")
    .withIndex("by_active", (q: any) => q.eq("isActive", true))
    .collect();

  const totalThreads = allThreads.length;
  const totalMessages = allThreads.reduce((sum: number, thread: any) => sum + thread.messageCount, 0);
  
  return {
    totalThreads,
    totalMessages,
    averageMessagesPerThread: totalThreads > 0 ? Math.round(totalMessages / totalThreads) : 0,
  };
}

// Convex queries
export const getAllActiveThreads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await getAllActiveThreadsFromDb(ctx, args);
  },
});

export const getThreadsInChat = query({
  args: {
    chatId: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await getThreadsInChatFromDb(ctx, args);
  },
});

export const getThreadById = query({
  args: {
    threadDocId: v.id("telegram_threads"),
  },
  handler: async (ctx, args) => {
    return await getThreadByIdFromDb(ctx, args);
  },
});

export const getThreadStats = query({
  args: {},
  handler: async (ctx) => {
    return await getThreadStatsFromDb(ctx, {});
  },
});