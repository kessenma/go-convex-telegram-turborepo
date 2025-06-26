import { mutation, query, httpAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Define the schema for telegram messages
export const saveMessage = mutation({
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
  },
  handler: async (ctx, args) => {
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
      createdAt: Date.now(),
    });
    return messageDocId;
  },
});

// Query to get messages by chat ID
export const getMessagesByChatId = query({
  args: {
    chatId: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("telegram_messages")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .order("desc")
      .take(limit);
  },
});

// Query to get all messages
export const getAllMessages = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    return await ctx.db
      .query("telegram_messages")
      .order("desc")
      .take(limit);
  },
});

// HTTP API endpoint for the Go bot to save messages
export const saveMessageAPI = httpAction(async (ctx, request) => {
  // Parse the request body
  const body = await request.json();
  
  // Validate required fields
  if (!body.messageId || !body.chatId || !body.text) {
    return new Response(
      JSON.stringify({ 
        error: "Missing required fields: messageId, chatId, text" 
      }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    // Save the message using the mutation
    const messageId = await ctx.runMutation(api.telegram.saveMessage, {
      messageId: body.messageId,
      chatId: body.chatId,
      userId: body.userId,
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
      text: body.text,
      messageType: body.messageType || "text",
      timestamp: body.timestamp || Date.now(),
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: messageId,
        message: "Message saved successfully" 
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error saving message:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to save message",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// HTTP API endpoint to get messages
export const getMessagesAPI = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  const limit = url.searchParams.get("limit");

  try {
    let messages;
    if (chatId) {
      messages = await ctx.runQuery(api.telegram.getMessagesByChatId, {
        chatId: parseInt(chatId),
        limit: limit ? parseInt(limit) : undefined,
      });
    } else {
      messages = await ctx.runQuery(api.telegram.getAllMessages, {
        limit: limit ? parseInt(limit) : undefined,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messages: messages,
        count: messages.length 
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch messages",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});