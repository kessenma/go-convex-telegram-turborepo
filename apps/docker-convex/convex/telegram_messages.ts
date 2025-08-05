import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Input types for helper functions
export type SaveMessageWithThreadHandlingInput = {
  messageId: number;
  chatId: number;
  userId?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  text: string;
  messageType: string;
  timestamp: number;
  messageThreadId?: number;
  replyToMessageId?: number;
};

export type SaveMessageToThreadInput = {
  messageId: number;
  chatId: number;
  userId?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  text: string;
  messageType: string;
  timestamp: number;
  messageThreadId?: number;
  threadDocId: Id<"telegram_threads">;
  replyToMessageId?: number;
};

export type GetMessagesByChatIdInput = {
  chatId: number;
  limit?: number;
};

export type GetAllMessagesInput = {
  limit?: number;
};

// Helper function to save message with thread handling (for HTTP actions)
export async function saveMessageWithThreadHandlingFromDb(
  ctx: any,
  args: SaveMessageWithThreadHandlingInput
) {
  let threadDocId;

  // If we have a messageThreadId, try to find the existing thread
  if (args.messageThreadId) {
    const existingThread = await ctx.db
      .query("telegram_threads")
      .withIndex("by_chat_and_thread", (q: any) => 
         q.eq("chatId", args.chatId).eq("threadId", args.messageThreadId!)
       )
      .first();

    if (existingThread) {
      // Update existing thread
      await ctx.db.patch(existingThread._id, {
        lastMessageId: args.messageId,
        lastMessageText: args.text,
        lastMessageTimestamp: args.timestamp,
        messageCount: existingThread.messageCount + 1,
        updatedAt: Date.now(),
      });
      threadDocId = existingThread._id;
    } else {
      // Create new thread for this messageThreadId
      const threadTitle = `Thread ${args.messageThreadId}`;
      threadDocId = await ctx.db.insert("telegram_threads", {
        threadId: args.messageThreadId,
        chatId: args.chatId,
        title: threadTitle,
        creatorUserId: args.userId,
        creatorUsername: args.username,
        creatorFirstName: args.firstName,
        creatorLastName: args.lastName,
        firstMessageId: args.messageId,
        lastMessageId: args.messageId,
        lastMessageText: args.text,
        lastMessageTimestamp: args.timestamp,
        messageCount: 1,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }
  // If we have a userId but no messageThreadId, create/update a user-based thread
  else if (args.userId) {
    // Check if thread already exists for this user in this chat
    const existingThread = await ctx.db
      .query("telegram_threads")
      .withIndex("by_chat_and_user", (q: any) => 
        q.eq("chatId", args.chatId).eq("creatorUserId", args.userId!)
      )
      .first();

    if (existingThread) {
      // Update existing thread
      await ctx.db.patch(existingThread._id, {
        lastMessageId: args.messageId,
        lastMessageText: args.text,
        lastMessageTimestamp: args.timestamp,
        messageCount: existingThread.messageCount + 1,
        updatedAt: Date.now(),
      });
      threadDocId = existingThread._id;
    } else {
      // Create new thread for this user
      const threadTitle = args.firstName 
        ? `${args.firstName}${args.lastName ? ` ${args.lastName}` : ''}${args.username ? ` (@${args.username})` : ''}`
        : args.username 
        ? `@${args.username}`
        : `User ${args.userId}`;

      threadDocId = await ctx.db.insert("telegram_threads", {
        threadId: args.userId, // Use userId as threadId for user-based threads
        chatId: args.chatId,
        title: threadTitle,
        creatorUserId: args.userId,
        creatorUsername: args.username,
        creatorFirstName: args.firstName,
        creatorLastName: args.lastName,
        firstMessageId: args.messageId,
        lastMessageId: args.messageId,
        lastMessageText: args.text,
        lastMessageTimestamp: args.timestamp,
        messageCount: 1,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  // Save the message with threadDocId reference
  const messageDocId = await ctx.db.insert("telegram_messages", {
    messageId: args.messageId,
    chatId: args.chatId,
    userId: args.userId,
    username: args.username,
    firstName: args.firstName,
    lastName: args.lastName,
    text: args.text,
    messageType: args.messageType,
    timestamp: args.timestamp,
    messageThreadId: args.messageThreadId,
    threadDocId: threadDocId, // Link to the thread
    replyToMessageId: args.replyToMessageId,
    isActive: true,
    createdAt: Date.now(),
  });

  return { success: true, messageId: messageDocId.toString() };
}

// Helper function to save message to thread (for HTTP actions)
export async function saveMessageToThreadFromDb(
  ctx: any,
  args: SaveMessageToThreadInput
) {
  // Verify the thread exists
  const thread = await ctx.db.get(args.threadDocId);
  if (!thread) {
    throw new Error(`Thread with ID ${args.threadDocId} not found`);
  }

  // Update the thread with the new message info
  await ctx.db.patch(args.threadDocId, {
    lastMessageId: args.messageId,
    lastMessageText: args.text,
    lastMessageTimestamp: args.timestamp,
    messageCount: thread.messageCount + 1,
    updatedAt: Date.now(),
  });

  // Save the message with threadDocId reference
  const messageDocId = await ctx.db.insert("telegram_messages", {
    messageId: args.messageId,
    chatId: args.chatId,
    userId: args.userId,
    username: args.username,
    firstName: args.firstName,
    lastName: args.lastName,
    text: args.text,
    messageType: args.messageType,
    timestamp: args.timestamp,
    messageThreadId: args.messageThreadId,
    threadDocId: args.threadDocId,
    replyToMessageId: args.replyToMessageId,
    isActive: true,
    createdAt: Date.now(),
  });

  return { success: true, messageId: messageDocId.toString() };
}

// Helper function to get messages by chat ID (for HTTP actions)
export async function getMessagesByChatIdFromDb(
  ctx: any,
  args: GetMessagesByChatIdInput
) {
  const limit = args.limit || 50;
  return await ctx.db
    .query("telegram_messages")
    .withIndex("by_chat_id", (q: any) => q.eq("chatId", args.chatId))
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .order("desc")
    .take(limit);
}

// Helper function to get all messages (for HTTP actions)
export async function getAllMessagesFromDb(
  ctx: any,
  args: GetAllMessagesInput
) {
  const limit = args.limit || 50;
  return await ctx.db
    .query("telegram_messages")
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .order("desc")
    .take(limit);
}

// Convex mutations and queries
export const saveMessageWithThreadHandling = mutation({
  args: {
    messageId: v.number(),
    chatId: v.number(),
    userId: v.optional(v.number()),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    text: v.string(),
    messageType: v.string(),
    timestamp: v.number(),
    messageThreadId: v.optional(v.number()),
    replyToMessageId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await saveMessageWithThreadHandlingFromDb(ctx, args);
  },
});

export const saveMessageToThread = mutation({
  args: {
    messageId: v.number(),
    chatId: v.number(),
    userId: v.optional(v.number()),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    text: v.string(),
    messageType: v.string(),
    timestamp: v.number(),
    messageThreadId: v.optional(v.number()),
    threadDocId: v.id("telegram_threads"),
    replyToMessageId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await saveMessageToThreadFromDb(ctx, args);
  },
});

export const getMessagesByChatId = query({
  args: {
    chatId: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await getMessagesByChatIdFromDb(ctx, args);
  },
});

export const getAllMessages = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await getAllMessagesFromDb(ctx, args);
  },
});