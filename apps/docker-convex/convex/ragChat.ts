// apps/docker-convex/convex/ragChat.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    const now = Date.now();
    
    const conversationId = await ctx.db.insert("rag_conversations", {
      sessionId: args.sessionId,
      title: args.title,
      documentIds: args.documentIds,
      userId: args.userId,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
      isActive: true,
      createdAt: now,
      lastMessageAt: now,
      messageCount: 0,
      totalTokensUsed: 0,
      llmModel: args.llmModel,
    });

    return conversationId;
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
  },
});

// Get conversation by session ID
export const getConversationBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("rag_conversations")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
    
    return conversation;
  },
});

// Get messages for a conversation
export const getConversationMessages = query({
  args: { 
    conversationId: v.id("rag_conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const messages = await ctx.db
      .query("rag_chat_messages")
      .withIndex("by_conversation_and_timestamp", (q) => 
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(limit);
    
    return messages.reverse(); // Return in chronological order
  },
});

// Get recent conversations
export const getRecentConversations = query({
  args: { 
    limit: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    let conversationQuery = ctx.db
      .query("rag_conversations")
      .withIndex("by_active_and_last_message", (q) => q.eq("isActive", true));
    
    if (args.userId) {
      conversationQuery = ctx.db
        .query("rag_conversations")
        .withIndex("by_user", (q) => q.eq("userId", args.userId));
    }
    
    const conversations = await conversationQuery
      .order("desc")
      .take(limit);
    
    // Get document titles for each conversation
    const conversationsWithDocuments = await Promise.all(
      conversations.map(async (conversation) => {
        const documents = await Promise.all(
          conversation.documentIds.map(async (docId) => {
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
  },
});

// Update conversation title
export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("rag_conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      title: args.title,
    });
  },
});

// Mark conversation as inactive
export const deactivateConversation = mutation({
  args: { conversationId: v.id("rag_conversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      isActive: false,
    });
  },
});

// Get conversation statistics
export const getConversationStats = query({
  args: { conversationId: v.id("rag_conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;
    
    const messages = await ctx.db
      .query("rag_chat_messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    
    const userMessages = messages.filter(m => m.role === "user");
    const assistantMessages = messages.filter(m => m.role === "assistant");
    
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
    const limit = args.limit || 10;
    const searchTerm = args.searchTerm.toLowerCase();
    
    // Get all messages and filter in memory (for simple text search)
    const allMessages = await ctx.db
      .query("rag_chat_messages")
      .collect();
    
    // Filter messages that contain the search term
    const messages = allMessages.filter(message => 
      message.content.toLowerCase().includes(searchTerm)
    ).slice(0, limit * 3); // Get more messages to find unique conversations
    
    // Get unique conversations from matching messages
    const conversationIds = [...new Set(messages.map(m => m.conversationId))];
    
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
          .filter(m => m.conversationId === convId)
          .slice(0, 3); // Show up to 3 matching messages
        
        return {
          ...conversation,
          documents: documents.filter(Boolean),
          matchingMessages,
        };
      })
    );
    
    return conversations.filter(Boolean);
  },
});
