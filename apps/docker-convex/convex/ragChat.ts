// apps/docker-convex/convex/ragChat.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Input types for helper functions
export type CreateRagConversationInput = {
  sessionId: string;
  documentIds: Id<"rag_documents">[];
  title?: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  llmModel: string;
};

export type AddRagMessageInput = {
  conversationId: Id<"rag_conversations">;
  messageId: string;
  role: string;
  content: string;
  tokenCount?: number;
  processingTimeMs?: number;
  sources?: {
    documentId: Id<"rag_documents">;
    title: string;
    snippet: string;
    score: number;
  }[];
  metadata?: string;
};

export type GetRagConversationBySessionIdInput = {
  sessionId: string;
};

export type GetRagConversationMessagesInput = {
  conversationId: Id<"rag_conversations">;
  limit?: number;
};

export type GetRecentRagConversationsInput = {
  limit?: number;
  userId?: string;
};

export type UpdateRagConversationTitleInput = {
  conversationId: Id<"rag_conversations">;
  title: string;
};

export type DeactivateRagConversationInput = {
  conversationId: Id<"rag_conversations">;
};

export type SearchRagConversationsInput = {
  searchTerm: string;
  limit?: number;
  userId?: string;
};

export type GetRagConversationStatsInput = {
  conversationId: Id<"rag_conversations">;
};

// Helper functions for HTTP endpoints
export async function createRagConversationFromDb(
  ctx: any,
  args: CreateRagConversationInput
) {
  const now = Date.now();
  
  // Get document titles for the documentTitles field
  const documentTitles = await Promise.all(
    args.documentIds.map(async (docId) => {
      const doc = await ctx.db.get(docId);
      return doc?.title || "Unknown Document";
    })
  );
  
  const conversationId = await ctx.db.insert("rag_conversations", {
    sessionId: args.sessionId,
    title: args.title,
    documentIds: args.documentIds,
    documentTitles,
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

export async function addRagMessageFromDb(
  ctx: any,
  args: AddRagMessageInput
) {
  const now = Date.now();
  
  // Insert the message
  const messageDocId = await ctx.db.insert("rag_chat_messages", {
    conversationId: args.conversationId,
    messageId: args.messageId,
    role: args.role,
    content: args.content,
    timestamp: now,
    tokenCount: args.tokenCount,
    processingTimeMs: args.processingTimeMs,
    sources: args.sources,
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

export async function getRagConversationBySessionIdFromDb(
  ctx: any,
  args: GetRagConversationBySessionIdInput
) {
  const conversation = await ctx.db
    .query("rag_conversations")
    .withIndex("by_session_id", (q: any) => q.eq("sessionId", args.sessionId))
    .first();
  
  return conversation;
}

export async function getRagConversationMessagesFromDb(
  ctx: any,
  args: GetRagConversationMessagesInput
) {
  const limit = args.limit || 50;
  
  const messages = await ctx.db
    .query("rag_chat_messages")
    .withIndex("by_conversation_and_timestamp", (q: any) => 
      q.eq("conversationId", args.conversationId)
    )
    .order("desc")
    .take(limit);
  
  return messages.reverse(); // Return in chronological order
}

export async function getRecentRagConversationsFromDb(
  ctx: any,
  args: GetRecentRagConversationsInput
) {
  const limit = args.limit || 20;
  
  let conversationQuery = ctx.db
    .query("rag_conversations")
    .withIndex("by_active_and_last_message", (q: any) => q.eq("isActive", true));
  
  if (args.userId) {
    conversationQuery = ctx.db
      .query("rag_conversations")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId));
  }
  
  const conversations = await conversationQuery
    .order("desc")
    .take(limit);
  
  // Get document titles for each conversation
  const conversationsWithDocuments = await Promise.all(
    conversations.map(async (conversation: any) => {
      const documents = await Promise.all(
        conversation.documentIds.map(async (docId: any) => {
          const doc = await ctx.db.get(docId);
          return doc ? { _id: doc._id, title: doc.title } : null;
        })
      );
      
      return {
        ...conversation,
        documents: documents.filter(Boolean),
      };
    })
  );
  
  return conversationsWithDocuments;
}

export async function updateRagConversationTitleFromDb(
  ctx: MutationCtx,
  args: UpdateRagConversationTitleInput
) {
  await ctx.db.patch(args.conversationId, {
    title: args.title,
  });
}

export async function deactivateRagConversationFromDb(
  ctx: MutationCtx,
  args: DeactivateRagConversationInput
) {
  await ctx.db.patch(args.conversationId, {
    isActive: false,
  });
}

export async function searchRagConversationsFromDb(
  ctx: QueryCtx,
  args: SearchRagConversationsInput
) {
  const limit = args.limit || 10;
  const searchTerm = args.searchTerm.toLowerCase();
  
  // Get all messages and filter in memory (for simple text search)
  const allMessages = await ctx.db
    .query("rag_chat_messages")
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
      
      // Get document titles
      const documents = await Promise.all(
        conversation.documentIds.map(async (docId) => {
          const doc = await ctx.db.get(docId);
          return doc ? { _id: doc._id, title: doc.title } : null;
        })
      );
      
      // Get matching messages for this conversation
      const matchingMessages = messages
        .filter((m) => m.conversationId === convId)
        .slice(0, 3); // Show up to 3 matching messages
      
      return {
        ...conversation,
        documents: documents.filter(Boolean),
        matchingMessages,
      };
    })
  );
  
  return conversations.filter(Boolean);
}

export async function getRagConversationStatsFromDb(
  ctx: QueryCtx,
  args: GetRagConversationStatsInput
) {
  const conversation = await ctx.db.get(args.conversationId);
  if (!conversation) return null;
  
  const messages = await ctx.db
    .query("rag_chat_messages")
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

// Create a new RAG conversation
export const createConversation = mutation({
  args: {
    sessionId: v.string(),
    documentIds: v.array(v.id("rag_documents")),
    title: v.optional(v.string()),
    userId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    llmModel: v.string(),
  },
  handler: async (ctx, args) => {
    return await createRagConversationFromDb(ctx, args);
  },
});

// Add a message to a conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("rag_conversations"),
    messageId: v.string(),
    role: v.string(),
    content: v.string(),
    tokenCount: v.optional(v.number()),
    processingTimeMs: v.optional(v.number()),
    sources: v.optional(v.array(v.object({
      documentId: v.id("rag_documents"),
      title: v.string(),
      snippet: v.string(),
      score: v.number(),
    }))),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await addRagMessageFromDb(ctx, args);
  },
});

// Get conversation by session ID
export const getConversationBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await getRagConversationBySessionIdFromDb(ctx, args);
  },
});

// Get messages for a conversation
export const getConversationMessages = query({
  args: { 
    conversationId: v.id("rag_conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await getRagConversationMessagesFromDb(ctx, args);
  },
});

// Get recent conversations
export const getRecentConversations = query({
  args: { 
    limit: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await getRecentRagConversationsFromDb(ctx, args);
  },
});

// Update conversation title
export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("rag_conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    return await updateRagConversationTitleFromDb(ctx, args);
  },
});

// Mark conversation as inactive
export const deactivateConversation = mutation({
  args: { conversationId: v.id("rag_conversations") },
  handler: async (ctx, args) => {
    return await deactivateRagConversationFromDb(ctx, args);
  },
});

// Get conversation statistics
export const getConversationStats = query({
  args: { conversationId: v.id("rag_conversations") },
  handler: async (ctx, args) => {
    return await getRagConversationStatsFromDb(ctx, args);
  },
});

// Search conversations by content
export const searchConversations = query({
  args: { 
    searchTerm: v.string(),
    limit: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await searchRagConversationsFromDb(ctx, args);
  },
});
