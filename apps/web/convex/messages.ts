import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all messages with pagination
export const getAllMessages = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("telegram_messages")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(limit);
  },
});

// Get messages by thread document ID
export const getMessagesByThreadDoc = query({
  args: {
    threadDocId: v.id("telegram_threads"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("telegram_messages")
      .withIndex("by_thread_doc", (q) => q.eq("threadDocId", args.threadDocId))
      .order("asc") // Show messages in chronological order within a thread
      .take(limit);
  },
});

// Get messages by chat ID
export const getMessagesByChatId = query({
  args: {
    chatId: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("telegram_messages")
      .withIndex("by_chat_and_timestamp", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .take(limit);
  },
});