/*
 * TELEGRAM API ENDPOINTS
 * apps/docker-convex/convex/https-endpoints/telegram/index.ts
 * =====================
 * 
 * Telegram bot integration endpoints for message handling and bot operations.
 */

import { httpAction } from "../../_generated/server";
import { errorResponse, successResponse } from "../shared/utils";
import { Id } from "../../_generated/dataModel";

// Import helper functions for message and thread management
import { 
  saveMessageWithThreadHandlingFromDb, 
  saveMessageToThreadFromDb, 
  getMessagesByChatIdFromDb, 
  getAllMessagesFromDb 
} from "../../telegram_messages";
import { 
  getAllActiveThreadsFromDb, 
  getThreadsInChatFromDb, 
  getThreadByIdFromDb, 
  getThreadStatsFromDb 
} from "../../telegram_message_threads";

// Save a message with enhanced thread handling
export const saveMessageAPI = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  // Validate required fields
  if (!body.messageId || !body.chatId || !body.text) {
    return errorResponse("Missing required fields: messageId, chatId, text", 400);
  }

  try {
    const result = await saveMessageWithThreadHandlingFromDb(ctx, {
      messageId: body.messageId,
      chatId: body.chatId,
      userId: body.userId,
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
      text: body.text || "",
      messageType: "text",
      timestamp: body.timestamp,
      messageThreadId: body.messageThreadId,
      replyToMessageId: body.replyToMessageId,
    });

    return successResponse({
      success: true, 
      messageId: result.messageId,
      message: "Message saved successfully" 
    });
  } catch (error) {
    console.error("Error saving message:", error);
    return errorResponse(
      "Failed to save message",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Save message to thread API
export const saveMessageToThreadAPI = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  // Validate required fields
  if (!body.messageId || !body.chatId || !body.text) {
    return errorResponse("Missing required fields: messageId, chatId, text", 400);
  }

  try {
    const result = await saveMessageToThreadFromDb(ctx, {
      messageId: body.messageId,
      chatId: body.chatId,
      userId: body.userId,
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
      text: body.text || "",
      messageType: "text",
      timestamp: body.timestamp,
      messageThreadId: body.messageThreadId,
      threadDocId: body.threadDocId,
      replyToMessageId: body.replyToMessageId,
    });

    return successResponse({
      success: true, 
      messageId: result.messageId,
      message: "Message saved to thread successfully" 
    });
  } catch (error) {
    console.error("Error saving message to thread:", error);
    return errorResponse(
      "Failed to save message to thread",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Get messages with optional filtering
export const getMessagesAPI = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  const limit = url.searchParams.get("limit");

  try {
    let messages: any[] = [];
    if (chatId) {
      messages = await getMessagesByChatIdFromDb(ctx, {
        chatId: parseInt(chatId),
        limit: limit ? parseInt(limit) : undefined,
      });
    } else {
      messages = await getAllMessagesFromDb(ctx, {
        limit: limit ? parseInt(limit) : undefined,
      });
    }

    return successResponse({
      success: true, 
      messages: messages,
      count: messages.length 
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return errorResponse(
      "Failed to fetch messages",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Get all active threads
export const getActiveThreadsAPI = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");

  try {
    const threads = await getAllActiveThreadsFromDb(ctx, {
      limit: limit ? parseInt(limit) : undefined,
    });

    return successResponse({
      success: true,
      threads: threads,
      count: threads.length
    });
  } catch (error) {
    console.error("Error fetching active threads:", error);
    return errorResponse(
      "Failed to fetch active threads",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Get threads in chat
export const getThreadsInChatAPI = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  const limit = url.searchParams.get("limit");

  if (!chatId) {
    return errorResponse("Missing required parameter: chatId", 400);
  }

  try {
    const threads = await getThreadsInChatFromDb(ctx, {
      chatId: parseInt(chatId),
      limit: limit ? parseInt(limit) : undefined,
    });

    return successResponse({
      success: true,
      threads: threads,
      count: threads.length
    });
  } catch (error) {
    console.error("Error fetching threads in chat:", error);
    return errorResponse(
      "Failed to fetch threads in chat",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Get thread by ID
export const getThreadByIdAPI = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const threadId = url.searchParams.get("threadId");

  if (!threadId) {
    return errorResponse("Missing required parameter: threadId", 400);
  }

  try {
    const thread = await getThreadByIdFromDb(ctx, {
      threadDocId: threadId as Id<"telegram_threads">,
    });

    return successResponse({
      success: true,
      thread: thread
    });
  } catch (error) {
    console.error("Error fetching thread by ID:", error);
    return errorResponse(
      "Failed to fetch thread",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Get thread statistics
export const getThreadStatsAPI = httpAction(async (ctx, request) => {
  try {
    const stats = await getThreadStatsFromDb(ctx, {});

    return successResponse({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error("Error fetching thread stats:", error);
    return errorResponse(
      "Failed to fetch thread statistics",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});