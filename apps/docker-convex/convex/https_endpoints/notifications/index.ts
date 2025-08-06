/*
 * NOTIFICATIONS API ENDPOINTS
 * apps/docker-convex/convex/https_endpoints/notifications/index.ts
 * =====================
 * 
 * Notification management endpoints for user notifications and alerts.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "../../_generated/server";
import { errorResponse, successResponse, corsHeaders } from "../shared/utils";
import {
  createNotificationFromDb,
  getAllNotificationsFromDb,
  getUnreadCountFromDb,
  markAsReadFromDb,
  markAllAsReadFromDb,
  CreateNotificationInput,
  GetAllNotificationsInput,
  GetUnreadCountInput,
  MarkAsReadInput,
  MarkAllAsReadInput
} from "../../notifications";
// REMOVE: import { createNotification } from "../../_generated/server";
import { api } from "../../_generated/api";

const http = httpRouter();

// =============================================================================
// NOTIFICATION CRUD OPERATIONS
// =============================================================================

// Get notifications for a user
export const getNotificationsAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const limit = url.searchParams.get("limit");
    
    if (!userId) {
      return errorResponse("Missing required parameter: userId", 400);
    }

    const notifications = await getAllNotificationsFromDb(ctx, {
      limit: limit ? parseInt(limit) : undefined
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        notifications,
        count: notifications.length,
        timestamp: Date.now()
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return errorResponse(
      "Failed to fetch notifications",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Create a new notification
export const createNotificationAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { userId, title, message, type, priority, documentId, metadata } = body;
    
    // For system notifications (like document embedding), userId is optional
    if (!title || !message) {
      return errorResponse("Missing required fields: title, message", 400);
    }

    // Use ctx.runMutation with function reference from api
    const notificationId = await ctx.runMutation(api.notifications.createNotification, {
      type: type || "general",
      title,
      message,
      documentId: documentId,
      metadata: metadata || (priority ? JSON.stringify({ priority }) : undefined),
      source: "system"
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        notificationId,
        message: "Notification created successfully",
        timestamp: Date.now()
      }),
      {
        status: 201,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return errorResponse(
      "Failed to create notification",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Get unread notification count
export const getUnreadNotificationsCountAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    
    if (!userId) {
      return errorResponse("Missing required parameter: userId", 400);
    }

    const unreadCount = await getUnreadCountFromDb(ctx, {});
    
    return new Response(
      JSON.stringify({
        success: true,
        unreadCount,
        userId,
        timestamp: Date.now()
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return errorResponse(
      "Failed to fetch unread notification count",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Mark notification as read
export const markNotificationAsReadAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { notificationId, userId } = body;
    
    if (!notificationId || !userId) {
      return errorResponse("Missing required fields: notificationId, userId", 400);
    }

    await markAsReadFromDb(ctx, {
      notificationId
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification marked as read",
        notificationId,
        timestamp: Date.now()
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return errorResponse(
      "Failed to mark notification as read",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Mark all notifications as read for a user
export const markAllNotificationsAsReadAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return errorResponse("Missing required field: userId", 400);
    }

    await markAllAsReadFromDb(ctx, {});
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "All notifications marked as read",
        userId,
        timestamp: Date.now()
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return errorResponse(
      "Failed to mark all notifications as read",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// =============================================================================
// LEGACY LLM MEMORY USAGE ENDPOINT
// =============================================================================

// Save LLM memory usage (Legacy endpoint - now handled by consolidated metrics)
export const saveLLMMemoryUsageAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    
    // Log the memory usage but don't store it separately
    console.log("Legacy LLM memory usage:", body);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Memory usage logged (legacy endpoint)",
        timestamp: Date.now()
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error processing LLM memory usage:", error);
    return errorResponse(
      "Failed to process memory usage",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// =============================================================================
// HTTP ROUTES
// =============================================================================

http.route({
  path: "/notifications",
  method: "GET",
  handler: getNotificationsAPI
});

http.route({
  path: "/notifications",
  method: "POST",
  handler: createNotificationAPI
});

http.route({
  path: "/notifications/unread-count",
  method: "GET",
  handler: getUnreadNotificationsCountAPI
});

http.route({
  path: "/notifications/mark-read",
  method: "POST",
  handler: markNotificationAsReadAPI
});

http.route({
  path: "/notifications/mark-all-read",
  method: "POST",
  handler: markAllNotificationsAsReadAPI
});

http.route({
  path: "/llm-memory-usage",
  method: "POST",
  handler: saveLLMMemoryUsageAPI
});

export default http;