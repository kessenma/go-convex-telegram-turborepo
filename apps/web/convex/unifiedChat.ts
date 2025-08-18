import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Create a new unified conversation
// This replaces separate general/rag conversation creation
// Type determines behavior: "general" for normal chat, "rag" for document-based
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
    const conversationId = await ctx.db.insert("unified_conversations", {
      sessionId: args.sessionId,
      type: args.type,
      documentIds: args.documentIds || [],
      documentTitles: args.documentTitles || [],
      title: args.title,
      userId: args.userId,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
      llmModel: args.llmModel,
      chatMode: args.chatMode,
      settings: args.settings,
      metadata: args.metadata,
      isActive: true,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
      messageCount: 0,
      totalTokensUsed: 0,
    });

    return conversationId;
  },
});

// Add a message to a unified conversation
// Updates conversation metadata automatically
export const addMessage = mutation({
  args: {
    conversationId: v.id("unified_conversations"),
    messageId: v.string(),
    role: v.string(), // "user" | "assistant"
    content: v.string(),
    chatMode: v.string(), // chat mode at message time
    tokenCount: v.optional(v.number()),
    processingTimeMs: v.optional(v.number()),
    // RAG-specific fields (optional for general chat)
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
    // Insert the message
    await ctx.db.insert("unified_messages", {
      conversationId: args.conversationId,
      messageId: args.messageId,
      role: args.role,
      content: args.content,
      chatMode: args.chatMode,
      tokenCount: args.tokenCount || 0,
      processingTimeMs: args.processingTimeMs,
      sources: args.sources || [],
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    // Update conversation metadata
    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      await ctx.db.patch(args.conversationId, {
        lastMessageAt: Date.now(),
        messageCount: (conversation.messageCount || 0) + 1,
        totalTokensUsed:
          (conversation.totalTokensUsed || 0) + (args.tokenCount || 0),
      });
    }

    return true;
  },
});

// Get conversation by session ID
export const getConversationBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("unified_conversations")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    return conversation;
  },
});

// Get messages for a conversation
export const getConversationMessages = query({
  args: {
    conversationId: v.id("unified_conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const messages = await ctx.db
      .query("unified_messages")
      .withIndex("by_conversation", (q) =>
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
    cursor: v.optional(v.string()), // For pagination
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

    // If cursor is provided, start from that point
    if (args.cursor) {
      const cursorDoc = await ctx.db.get(args.cursor as Id<"unified_conversations">);
      if (cursorDoc) {
        queryBuilder = queryBuilder.filter((q) => 
          q.lt(q.field("lastMessageAt"), cursorDoc.lastMessageAt)
        );
      }
    }

    const conversations = await queryBuilder.order("desc").take(limit + 1);
    
    // Check if there are more results
    const hasMore = conversations.length > limit;
    const results = hasMore ? conversations.slice(0, limit) : conversations;
    const nextCursor = hasMore ? results[results.length - 1]._id : null;

    return {
      conversations: results,
      hasMore,
      nextCursor,
    };
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