// apps/docker-convex/convex/https_endpoints/ai_chat/index.ts
import { httpRouter } from "convex/server";
import { httpAction } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { errorResponse, successResponse } from "../shared/utils";
import { OpenAI } from "openai";
import { v4 as uuidv4 } from "uuid";
import {
  createGeneralConversationFromDb,
  addGeneralMessageFromDb,
  getGeneralConversationBySessionIdFromDb,
  getGeneralConversationMessagesFromDb,
  getRecentGeneralConversationsFromDb,
  CreateGeneralConversationInput,
  AddGeneralMessageInput,
  GetGeneralConversationBySessionIdInput,
  GetGeneralConversationMessagesInput,
  GetRecentGeneralConversationsInput,
} from "../../generalChat";
import {
  createRagConversationFromDb,
  addRagMessageFromDb,
  getRagConversationBySessionIdFromDb,
  getRagConversationMessagesFromDb,
  getRecentRagConversationsFromDb,
  CreateRagConversationInput,
  AddRagMessageInput,
  GetRagConversationBySessionIdInput,
  GetRagConversationMessagesInput,
  GetRecentRagConversationsInput,
} from "../../ragChat";



const http = httpRouter();

// General Chat API
export const generalChatAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { sessionId, message, userId, userAgent, ipAddress, llmModel } = body;

    if (!sessionId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sessionId, message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get or create conversation
    let conversation = await getGeneralConversationBySessionIdFromDb(ctx, { sessionId });

    if (!conversation) {
      const conversationId = await createGeneralConversationFromDb(ctx, {
        sessionId,
        title: `Chat ${new Date().toLocaleString()}`,
        userId,
        userAgent,
        ipAddress,
        llmModel: llmModel || "gpt-4",
      });
      conversation = await ctx.db.get(conversationId);
    }

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: "Failed to create or retrieve conversation" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Add user message
    const userMessageId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    await addGeneralMessageFromDb(ctx, {
      conversationId: conversation._id,
      messageId: userMessageId,
      role: "user",
      content: message,
    });

    // Generate AI response (placeholder for now)
    const aiResponse = "This is a placeholder AI response for general chat.";
    const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await addGeneralMessageFromDb(ctx, {
      conversationId: conversation._id,
      messageId: assistantMessageId,
      role: "assistant",
      content: aiResponse,
      tokenCount: aiResponse.length,
      processingTimeMs: 100,
    });

    return new Response(
      JSON.stringify({
        conversationId: conversation._id,
        sessionId,
        response: aiResponse,
        messageId: assistantMessageId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("General chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// RAG Chat API
export const ragChatAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { sessionId, message, documentIds, userId, userAgent, ipAddress, llmModel } = body;

    if (!sessionId || !message || !documentIds || !Array.isArray(documentIds)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sessionId, message, documentIds" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get or create conversation
    let conversation = await getRagConversationBySessionIdFromDb(ctx, { sessionId });

    if (!conversation) {
      const conversationId = await createRagConversationFromDb(ctx, {
        sessionId,
        documentIds,
        title: `RAG Chat ${new Date().toLocaleString()}`,
        userId,
        userAgent,
        ipAddress,
        llmModel: llmModel || "gpt-4",
      });
      conversation = await ctx.db.get(conversationId);
    }

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: "Failed to create or retrieve conversation" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Add user message
    const userMessageId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    await addRagMessageFromDb(ctx, {
      conversationId: conversation._id,
      messageId: userMessageId,
      role: "user",
      content: message,
    });

    // Generate AI response with RAG (placeholder for now)
    const aiResponse = "This is a placeholder AI response for RAG chat with document context.";
    const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await addRagMessageFromDb(ctx, {
      conversationId: conversation._id,
      messageId: assistantMessageId,
      role: "assistant",
      content: aiResponse,
      tokenCount: aiResponse.length,
      processingTimeMs: 150,
      sources: [
        {
          documentId: documentIds[0],
          title: "Sample Document",
          snippet: "This is a sample snippet from the document.",
          score: 0.95,
        },
      ],
    });

    return new Response(
      JSON.stringify({
        conversationId: conversation._id,
        sessionId,
        response: aiResponse,
        messageId: assistantMessageId,
        sources: [
          {
            documentId: documentIds[0],
            title: "Sample Document",
            snippet: "This is a sample snippet from the document.",
            score: 0.95,
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("RAG chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Placeholder exports for missing functions
export const getActiveThreadsAPI = httpAction(async (ctx, request) => {
  return new Response(
    JSON.stringify({ threads: [], message: "Not implemented yet" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

export const getThreadStatsAPI = httpAction(async (ctx, request) => {
  return new Response(
    JSON.stringify({ stats: {}, message: "Not implemented yet" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

export const getThreadByIdAPI = httpAction(async (ctx, request) => {
  return new Response(
    JSON.stringify({ thread: null, message: "Not implemented yet" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

export const searchConversationsAPI = httpAction(async (ctx, request) => {
  return new Response(
    JSON.stringify({ conversations: [], message: "Not implemented yet" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

export const getChatHistoryAPI = httpAction(async (ctx, request) => {
  return new Response(
    JSON.stringify({ history: [], message: "Not implemented yet" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

export const createThreadAPI = httpAction(async (ctx, request) => {
  return new Response(
    JSON.stringify({ threadId: null, message: "Not implemented yet" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

export const updateThreadAPI = httpAction(async (ctx, request) => {
  return new Response(
    JSON.stringify({ success: false, message: "Not implemented yet" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

export const deleteThreadAPI = httpAction(async (ctx, request) => {
  return new Response(
    JSON.stringify({ success: false, message: "Not implemented yet" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

// HTTP routes (keeping the existing router structure)
http.route({
  path: "/general-chat",
  method: "POST",
  handler: generalChatAPI
});

http.route({
  path: "/rag-chat",
  method: "POST",
  handler: ragChatAPI
});

// Get conversation messages
http.route({
  path: "/conversations/:conversationId/messages",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const conversationId = url.pathname.split("/")[2] as any;
      const chatType = url.searchParams.get("type") || "general";
      const limit = parseInt(url.searchParams.get("limit") || "50");

      if (!conversationId) {
        return new Response(
          JSON.stringify({ error: "Missing conversationId" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      let messages;
      if (chatType === "rag") {
        messages = await ctx.db
          .query("rag_messages")
          .filter((q) => q.eq(q.field("conversationId"), conversationId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .order("desc")
          .take(limit || 50);
      } else {
        messages = await ctx.db
          .query("general_messages")
          .filter((q) => q.eq(q.field("conversationId"), conversationId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .order("desc")
          .take(limit || 50);
      }

      return new Response(
        JSON.stringify({ messages }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Get conversation messages API error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })
});

// Get recent conversations
http.route({
  path: "/conversations/recent",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const chatType = url.searchParams.get("type") || "general";
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const userId = url.searchParams.get("userId") || undefined;

      let conversations;
      if (chatType === "rag") {
        let query = ctx.db
          .query("rag_conversations")
          .filter((q) => q.eq(q.field("isActive"), true));
        
        if (userId) {
          query = query.filter((q) => q.eq(q.field("userId"), userId));
        }
        
        conversations = await query
          .order("desc")
          .take(limit || 20);
      } else {
        let query = ctx.db
          .query("general_conversations")
          .filter((q) => q.eq(q.field("isActive"), true));
        
        if (userId) {
          query = query.filter((q) => q.eq(q.field("userId"), userId));
        }
        
        conversations = await query
          .order("desc")
          .take(limit || 20);
      }

      return new Response(
        JSON.stringify({ conversations }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Get recent conversations API error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })
});

export default http;