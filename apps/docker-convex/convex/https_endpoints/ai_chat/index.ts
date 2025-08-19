// apps/docker-convex/convex/https_endpoints/ai_chat/index.ts
import { httpRouter } from "convex/server";
import { httpAction } from "../../_generated/server";
import {
  createGeneralConversationFromDb,
  addGeneralMessageFromDb,
  getGeneralConversationBySessionIdFromDb,
  getGeneralConversationMessagesFromDb,
  getRecentGeneralConversationsFromDb,
} from "../../generalChat";
import {
  createRagConversationFromDb,
  addRagMessageFromDb,
  getRagConversationBySessionIdFromDb,
  getRagConversationMessagesFromDb,
  getRecentRagConversationsFromDb,
} from "../../ragChat";

// Helper function to update conversation title
async function updateUnifiedConversationTitleFromDb(
  ctx: any,
  args: { conversationId: string; title: string }
) {
  try {
    // First, try to determine the conversation type by checking both tables
    // We'll try RAG first, then general
    try {
      await ctx.runMutation("ragChat:updateConversationTitle", {
        conversationId: args.conversationId,
        title: args.title,
      });
      return true;
    } catch (ragError) {
      // If RAG update fails, try general conversation
      try {
        await ctx.runMutation("generalChat:updateConversationTitle", {
          conversationId: args.conversationId,
          title: args.title,
        });
        return true;
      } catch (generalError) {
        console.error("Failed to update conversation title in both RAG and general tables:", {
          ragError: ragError instanceof Error ? ragError.message : String(ragError),
          generalError: generalError instanceof Error ? generalError.message : String(generalError),
          conversationId: args.conversationId
        });
        throw new Error(`Failed to update conversation title: conversation not found in either RAG or general tables`);
      }
    }
  } catch (error) {
    console.error("Error in updateUnifiedConversationTitleFromDb:", error);
    throw error;
  }
}



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
        llmModel: llmModel || "llama-3.2",
      });
      conversation = await getRagConversationBySessionIdFromDb(ctx, { sessionId });
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
        llmModel: llmModel || "llama-3.2",
      });
      conversation = await getGeneralConversationBySessionIdFromDb(ctx, { sessionId });
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

// Update Conversation Title API
export const updateConversationTitleAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { conversationId, title } = body;

    if (!conversationId || !title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: conversationId, title" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update the conversation title using the helper function
    await updateUnifiedConversationTitleFromDb(ctx, {
      conversationId,
      title,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Conversation title updated successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating conversation title:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update conversation title" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
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
        messages = await getRagConversationMessagesFromDb(ctx, {
          conversationId,
          limit: limit || 50
        });
      } else {
        messages = await getGeneralConversationMessagesFromDb(ctx, {
          conversationId,
          limit: limit || 50
        });
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
        conversations = await getRecentRagConversationsFromDb(ctx, {
          limit: limit || 20,
          userId
        });
      } else {
        conversations = await getRecentGeneralConversationsFromDb(ctx, {
          limit: limit || 20,
          userId
        });
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

http.route({
  path: "/conversations/update-title",
  method: "POST",
  handler: updateConversationTitleAPI
});

export default http;
