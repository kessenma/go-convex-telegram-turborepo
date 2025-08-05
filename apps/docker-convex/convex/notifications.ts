import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Input types for helper functions
export type CreateNotificationInput = {
  type: string;
  title: string;
  message: string;
  documentId?: Id<"rag_documents">;
  metadata?: string;
  source?: string;
};

export type GetAllNotificationsInput = {
  limit?: number;
};

export type GetUnreadCountInput = {};

export type MarkAsReadInput = {
  notificationId: Id<"notifications">;
};

export type MarkAllAsReadInput = {};

// Helper functions for HTTP actions
export async function createNotificationFromDb(
  ctx: any,
  args: CreateNotificationInput
) {
  const notificationId = await ctx.db.insert("notifications", {
    type: args.type,
    title: args.title,
    message: args.message,
    timestamp: Date.now(),
    isRead: false,
    documentId: args.documentId,
    metadata: args.metadata,
    source: args.source || "system",
  });
  
  return notificationId;
}

export async function getAllNotificationsFromDb(
  ctx: any,
  args: GetAllNotificationsInput
) {
  const notifications = await ctx.db
    .query("notifications")
    .withIndex("by_timestamp")
    .order("desc")
    .take(args.limit || 50);
  
  return notifications;
}

export async function getUnreadCountFromDb(
  ctx: any,
  args: GetUnreadCountInput
) {
  const unreadNotifications = await ctx.db
    .query("notifications")
    .withIndex("by_isRead")
    .filter((q: any) => q.eq(q.field("isRead"), false))
    .collect();
  
  return unreadNotifications.length;
}

export async function markAsReadFromDb(
  ctx: any,
  args: MarkAsReadInput
) {
  await ctx.db.patch(args.notificationId, { isRead: true });
}

export async function markAllAsReadFromDb(
  ctx: any,
  args: MarkAllAsReadInput
) {
  const unreadNotifications = await ctx.db
    .query("notifications")
    .withIndex("by_isRead")
    .filter((q: any) => q.eq(q.field("isRead"), false))
    .collect();
  
  let markedCount = 0;
  for (const notification of unreadNotifications) {
    await ctx.db.patch(notification._id, { isRead: true });
    markedCount++;
  }
  
  return markedCount;
}

// Create a new notification
export const createNotification = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    message: v.string(),
    documentId: v.optional(v.id("rag_documents")),
    metadata: v.optional(v.string()), // must be string
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      type: args.type,
      title: args.title,
      message: args.message,
      timestamp: Date.now(),
      isRead: false,
      documentId: args.documentId,
      metadata: args.metadata,
      source: args.source || "system",
    });
    
    return notificationId;
  },
});

// Get all notifications ordered by timestamp (newest first)
export const getAllNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit || 50);
    
    return notifications;
  },
});

// Get unread notifications count
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_read_status", (q) => q.eq("isRead", false))
      .collect();
    
    return unreadNotifications.length;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_read_status", (q) => q.eq("isRead", false))
      .collect();
    
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }
    
    return unreadNotifications.length;
  },
});

// Delete a notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});

// Get notifications by type
export const getNotificationsByType = query({
  args: {
    type: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_type_and_timestamp", (q) => q.eq("type", args.type))
      .order("desc")
      .take(args.limit || 20);
    
    return notifications;
  },
});

// Helper function to create document upload notification
export const createDocumentUploadNotification = mutation({
  args: {
    documentTitle: v.string(),
    documentId: v.id("rag_documents"),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      type: "document_uploaded",
      title: "Document Uploaded",
      message: `Document "${args.documentTitle}" has been successfully uploaded.`,
      timestamp: Date.now(),
      isRead: false,
      documentId: args.documentId,
      source: args.source || "web",
    });
  },
});

// Helper function to create document embedding notification
export const createDocumentEmbeddingNotification = mutation({
  args: {
    documentTitle: v.string(),
    documentId: v.id("rag_documents"),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      type: "document_embedded",
      title: "Document Embedded",
      message: `Document "${args.documentTitle}" has been successfully embedded and is ready for search.`,
      timestamp: Date.now(),
      isRead: false,
      documentId: args.documentId,
      source: args.source || "web",
    });
  },
});

// Helper function to create document deletion notification
export const createDocumentDeletionNotification = mutation({
  args: {
    documentTitle: v.string(),
    documentId: v.id("rag_documents"),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      type: "document_deleted",
      title: "Document Deleted",
      message: `Document "${args.documentTitle}" has been successfully deleted.`,
      timestamp: Date.now(),
      isRead: false,
      documentId: args.documentId,
      source: args.source || "web",
    });
  },
});