import { mutation, query } from "./_generated/server";
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

// Save a new message
export const saveMessage = mutation({
  args: {
    messageId: v.number(),
    chatId: v.number(),
    text: v.string(),
    messageType: v.string(), // e.g., 'user_message', 'bot_message'
    timestamp: v.number(),
    messageThreadId: v.optional(v.number()),
    threadDocId: v.optional(v.id("telegram_threads")),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.insert("telegram_messages", { ...args, isActive: true, createdAt: Date.now() });
    return message;
  },
});

// Save a message to a specific thread
export const saveMessageToThread = mutation({
  args: {
    messageId: v.number(),
    chatId: v.number(),
    text: v.string(),
    messageType: v.string(),
    timestamp: v.number(),
    messageThreadId: v.optional(v.number()),
    threadDocId: v.id("telegram_threads"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.insert("telegram_messages", { ...args, isActive: true, createdAt: Date.now() });
    return message;
  },
});

// Get message statistics based on timestamps
export const getMessageStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Get all active messages
    const allMessages = await ctx.db
      .query("telegram_messages")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    // Calculate statistics
    const totalMessages = allMessages.length;
    const messagesLastHour = allMessages.filter(msg => msg.timestamp >= oneHourAgo).length;
    const messagesLastDay = allMessages.filter(msg => msg.timestamp >= oneDayAgo).length;
    
    return {
      totalMessages,
      messagesLastHour,
      messagesLastDay,
      requestsPerHour: messagesLastHour,
      requestsPerDay: messagesLastDay,
    };
  },
});