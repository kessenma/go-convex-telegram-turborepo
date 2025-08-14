// apps/docker-convex/convex/unifiedChat.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Unified conversations and messages helpers
 * Backed by:
 *  - unified_conversations
 *  - unified_chat_messages
 */

// Create a unified conversation
export const createConversation = mutation({
  args: {
    sessionId: v.string(),
    type: v.union(v.literal("general"), v.literal("rag")),
    documentIds: v.optional(v.array(v.id("rag_documents"))), // pass [] for general
    documentTitles: v.optional(v.array(v.string())), // pass [] for general
    title: v.optional(v.string()),
    userId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    llmModel: v.string(),
    chatMode: v.string(), // mirror UI chat mode
    settings: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const documentIds = args.documentIds ?? [];
    // If titles not provided, derive from docs (best-effort)
    let documentTitles = args.documentTitles ?? [];
    if (documentTitles.length === 0 && documentIds.length > 0) {
      const titles = await Promise.all(
        documentIds.map(async (docId) => {
          const doc = await ctx.db.get(docId);
          return doc?.title || "Untitled Document";
        })
      );
      documentTitles = titles;
    }

    const conversationId = await ctx.db.insert("unified_conversations", {
      sessionId: args.sessionId,
      type: args.type,
      title: args.title,
      documentIds,
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
      chatMode: args.chatMode,
      settings: args.settings,
      metadata: args.metadata,
    });

    return conversationId;
  },
});

// Add a message to a unified conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("unified_conversations"),
    messageId: v.string(),
    role: v.string(), // "user" | "assistant"
    content: v.string(),
    chatMode: v.string(), // chat mode at message time
    tokenCount: v.optional(v.number()),
    processingTimeMs: v.optional(v.number()),
    // RAG sources if any
    sources: v.optional(
      v.array(
        v.object({
          documentId: v.id("rag_documents"),
          title: v.string(),
          snippet: v.string(),
          score: v.number(),
        })
      )
    ),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const messageDocId = await ctx.db.insert("unified_chat_messages", {
      conversationId: args.conversationId,
      messageId: args.messageId,
      role: args.role,
      content: args.content,
      timestamp: now,
      tokenCount: args.tokenCount,
      processingTimeMs: args.processingTimeMs,
      sources: args.sources,
      metadata: args.metadata,
      chatMode: args.chatMode,
    });

    // Update conversation stats
    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      await ctx.db.patch(args.conversationId, {
        lastMessageAt: now,
        messageCount: (conversation.messageCount || 0) + 1,
        totalTokensUsed: (conversation.totalTokensUsed || 0) + (args.tokenCount || 0),
      });
    }

    return messageDocId;
  },
});

// Get conversation by session ID
export const getConversationBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("unified_conversations")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
    return conversation;
  },
});

// Get messages for a unified conversation (chronological)
export const getConversationMessages = query({
  args: {
    conversationId: v.id("unified_conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    const messages = await ctx.db
      .query("unified_chat_messages")
      .withIndex("by_conversation_and_timestamp", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(limit);

    return messages.reverse();
  },
});

// Get recent unified conversations (active first by recency)
// Optionally filter by userId
export const getRecentConversations = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let queryBuilder = ctx.db
      .query("unified_conversations")
      .withIndex("by_active_and_last_message", (q) => q.eq("isActive", true));

    if (args.userId) {
      queryBuilder = ctx.db
        .query("unified_conversations")
        .withIndex("by_user", (q) => q.eq("userId", args.userId));
    }

    const conversations = await queryBuilder.order("desc").take(limit);
    return conversations;
  },
});

// Update conversation title
export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("unified_conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, { title: args.title });
    return true;
  },
});

// Mark conversation inactive
export const deactivateConversation = mutation({
  args: {
    conversationId: v.id("unified_conversations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, { isActive: false });
    return true;
  },
});
