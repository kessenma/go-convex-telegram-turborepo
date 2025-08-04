// apps/docker-convex/convex/generalChat.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Input types for helper functions
export type CreateGeneralConversationInput = {
  sessionId: string;
  title?: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  llmModel: string;
};

export type AddGeneralMessageInput = {
  conversationId: Id<"general_conversations">;
  messageId: string;
  role: string;
  content: string;
  tokenCount?: number;
  processingTimeMs?: number;
  metadata?: string;
};

export type GetGeneralConversationBySessionIdInput = {
  sessionId: string;
};

export type GetGeneralConversationMessagesInput = {
  conversationId: Id<"general_conversations">;
  limit?: number;
};

export type GetRecentGeneralConversationsInput = {
  limit?: number;
  userId?: string;
};

export type UpdateGeneralConversationTitleInput = {
  conversationId: Id<"general_conversations">;
  title: string;
};

export type DeactivateGeneralConversationInput = {
  conversationId: Id<"general_conversations">;
};

export type SearchGeneralConversationsInput = {
  searchTerm: string;
  limit?: number;
  userId?: string;
};

export type GetGeneralConversationStatsInput = {
  conversationId: Id<"general_conversations">;
};

// Helper functions for HTTP endpoints
export async function createGeneralConversationFromDb(
  ctx: any,
  args: CreateGeneralConversationInput
) {
  const now = Date.now();
  
  const conversationId = await ctx.db.insert("general_conversations", {
    sessionId: args.sessionId,
    title: args.title,
    userId: args.userId,
    userAgent: args.userAgent,
    ipAddress: args.ipAddress,
    isActive: true,
    isPublic: false,
    createdAt: now,
    lastMessageAt: now,
    messageCount: 0,
    totalTokensUsed: 0,
    llmModel: args.llmModel,
  });

  return conversationId;
}

export async function addGeneralMessageFromDb(
  ctx: any,
  args: AddGeneralMessageInput
) {
  const now = Date.now();
  
  // Insert the message
  const messageDocId = await ctx.db.insert("general_chat_messages", {
    conversationId: args.conversationId,
    messageId: args.messageId,
    role: args.role,
    content: args.content,
    timestamp: now,
    tokenCount: args.tokenCount,
    processingTimeMs: args.processingTimeMs,
    metadata: args.metadata,
  });

  // Update conversation stats
  const conversation = await ctx.db.get(args.conversationId);
  if (conversation) {
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      messageCount: conversation.messageCount + 1,
      totalTokensUsed: conversation.totalTokensUsed + (args.tokenCount || 0),
    });
  }

  return messageDocId;
}

export async function getGeneralConversationBySessionIdFromDb(
  ctx: any,
  args: GetGeneralConversationBySessionIdInput
) {
  const conversation = await ctx.db
    .query("general_conversations")
    .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
    .first();
  
  return conversation;
}

export async function getGeneralConversationMessagesFromDb(
  ctx: any,
  args: GetGeneralConversationMessagesInput
) {
  const limit = args.limit || 50;
  
  const messages = await ctx.db
    .query("general_chat_messages")
    .withIndex("by_conversation_and_timestamp", (q) => 
      q.eq("conversationId", args.conversationId)
    )
    .order("desc")
    .take(limit);
  
  return messages.reverse(); // Return in chronological order
}

export async function getRecentGeneralConversationsFromDb(
  ctx: any,
  args: GetRecentGeneralConversationsInput
) {
  const limit = args.limit || 20;
  
  let conversationQuery = ctx.db
    .query("general_conversations")
    .withIndex("by_active_and_last_message", (q) => q.eq("isActive", true));
  
  if (args.userId) {
    conversationQuery = ctx.db
      .query("general_conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));
  }
  
  const conversations = await conversationQuery
    .order("desc")
    .take(limit);
  
  return conversations;
}

export async function updateGeneralConversationTitleFromDb(
  ctx: MutationCtx,
  args: UpdateGeneralConversationTitleInput
) {
  await ctx.db.patch(args.conversationId, {
    title: args.title,
  });
}

export async function deactivateGeneralConversationFromDb(
  ctx: MutationCtx,
  args: DeactivateGeneralConversationInput
) {
  await ctx.db.patch(args.conversationId, {
    isActive: false,
  });
}

export async function searchGeneralConversationsFromDb(
  ctx: QueryCtx,
  args: SearchGeneralConversationsInput
) {
  const limit = args.limit || 10;
  const searchTerm = args.searchTerm.toLowerCase();
  
  // Get all messages and filter in memory (for simple text search)
  const allMessages = await ctx.db
    .query("general_chat_messages")
    .collect();
  
  // Filter messages that contain the search term
  const messages = allMessages.filter((message) => 
    message.content.toLowerCase().includes(searchTerm)
  ).slice(0, limit * 3); // Get more messages to find unique conversations
  
  // Get unique conversations from matching messages
  const conversationIds = [...new Set(messages.map((m) => m.conversationId))];
  
  const conversations = await Promise.all(
    conversationIds.slice(0, limit).map(async (convId) => {
      const conversation = await ctx.db.get(convId);
      if (!conversation) return null;
      
      // Filter by user if specified
      if (args.userId && conversation.userId !== args.userId) {
        return null;
      }
      
      // Get matching messages for this conversation
      const matchingMessages = messages
        .filter((m) => m.conversationId === convId)
        .slice(0, 3); // Show up to 3 matching messages
      
      return {
        ...conversation,
        matchingMessages,
      };
    })
  );
  
  return conversations.filter(Boolean);
}

export async function getGeneralConversationStatsFromDb(
  ctx: QueryCtx,
  args: GetGeneralConversationStatsInput
) {
  const conversation = await ctx.db.get(args.conversationId);
  if (!conversation) return null;
  
  const messages = await ctx.db
    .query("general_chat_messages")
    .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
    .collect();
  
  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  
  const avgProcessingTime = assistantMessages.length > 0
    ? assistantMessages.reduce((sum, m) => sum + (m.processingTimeMs || 0), 0) / assistantMessages.length
    : 0;
  
  return {
    conversation,
    totalMessages: messages.length,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    totalTokens: conversation.totalTokensUsed,
    avgProcessingTimeMs: Math.round(avgProcessingTime),
    duration: conversation.lastMessageAt - conversation.createdAt,
  };
}

// Create a new general conversation
export const createConversation = mutation({
  args: {
    sessionId: v.string(),
    title: v.optional(v.string()),
    userId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    llmModel: v.string(),
  },
  handler: async (ctx, args) => {
    return await createGeneralConversationFromDb(ctx, args);
  },
});

// Add a message to a general conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("general_conversations"),
    messageId: v.string(),
    role: v.string(),
    content: v.string(),
    tokenCount: v.optional(v.number()),
    processingTimeMs: v.optional(v.number()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await addGeneralMessageFromDb(ctx, args);
  },
});

// Get conversation by session ID
export const getConversationBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await getGeneralConversationBySessionIdFromDb(ctx, args);
  },
});

// Get conversation messages
export const getConversationMessages = query({
  args: {
    conversationId: v.id("general_conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await getGeneralConversationMessagesFromDb(ctx, args);
  },
});

// Get recent conversations
export const getRecentConversations = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await getRecentGeneralConversationsFromDb(ctx, args);
  },
});

// Update conversation title
export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("general_conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    return await updateGeneralConversationTitleFromDb(ctx, args);
  },
});

// Deactivate conversation
export const deactivateConversation = mutation({
  args: { conversationId: v.id("general_conversations") },
  handler: async (ctx, args) => {
    return await deactivateGeneralConversationFromDb(ctx, args);
  },
});

// Search conversations
export const searchConversations = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await searchGeneralConversationsFromDb(ctx, args);
  },
});

// Get conversation statistics
export const getConversationStats = query({
  args: { conversationId: v.id("general_conversations") },
  handler: async (ctx, args) => {
    return await getGeneralConversationStatsFromDb(ctx, args);
  },
});