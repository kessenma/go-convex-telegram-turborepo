// apps/docker-convex/convex/generalChat.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    const conversationId = await ctx.db.insert("general_conversations", {
      sessionId: args.sessionId,
      title: args.title,
      userId: args.userId,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
      isActive: true,
      isPublic: false,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
      messageCount: 0,
      totalTokensUsed: 0,
      llmModel: args.llmModel,
    });

    return conversationId;
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
    // Insert the message
    const messageDocId = await ctx.db.insert("general_chat_messages", {
      conversationId: args.conversationId,
      messageId: args.messageId,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      tokenCount: args.tokenCount,
      processingTimeMs: args.processingTimeMs,
      metadata: args.metadata,
    });

    // Update conversation stats
    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      await ctx.db.patch(args.conversationId, {
        lastMessageAt: Date.now(),
        messageCount: conversation.messageCount + 1,
        totalTokensUsed: conversation.totalTokensUsed + (args.tokenCount || 0),
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
      .query("general_conversations")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return conversation;
  },
});

// Get conversation messages
export const getConversationMessages = query({
  args: {
    conversationId: v.id("general_conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("general_chat_messages")
      .withIndex("by_conversation_and_timestamp", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .take(args.limit || 100);

    return messages;
  },
});

// Get recent conversations
export const getRecentConversations = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("general_conversations")
      .withIndex("by_active_and_last_message", (q) => q.eq("isActive", true))
      .order("desc");

    if (args.userId) {
      query = ctx.db
        .query("general_conversations")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc");
    }

    const conversations = await query.take(args.limit || 20);
    return conversations;
  },
});

// Update conversation title
export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("general_conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      title: args.title,
    });
  },
});

// Deactivate conversation
export const deactivateConversation = mutation({
  args: { conversationId: v.id("general_conversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      isActive: false,
    });
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
    let conversations = await ctx.db
      .query("general_conversations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    if (args.userId) {
      conversations = conversations.filter((conv) => conv.userId === args.userId);
    }

    // Simple text search in title
    const filtered = conversations.filter((conv) =>
      conv.title?.toLowerCase().includes(args.searchTerm.toLowerCase())
    );

    return filtered.slice(0, args.limit || 20);
  },
});

// Get conversation statistics
export const getConversationStats = query({
  args: { conversationId: v.id("general_conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      return null;
    }

    const messages = await ctx.db
      .query("general_chat_messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    return {
      conversation,
      totalMessages: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      totalTokens: conversation.totalTokensUsed,
      averageProcessingTime:
        assistantMessages.length > 0
          ? assistantMessages.reduce((sum, m) => sum + (m.processingTimeMs || 0), 0) /
          assistantMessages.length
          : 0,
    };
  },
});