// apps/web/convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // RAG documents table - stores uploaded documents for vector search
  rag_documents: defineTable({
    title: v.string(), // Document title/filename
    content: v.string(), // Full text content
    contentType: v.string(), // "markdown" or "text"
    fileSize: v.number(), // Size in bytes
    uploadedAt: v.number(), // Upload timestamp
    lastModified: v.number(), // Last modification timestamp
    isActive: v.boolean(), // Whether document is active for search
    tags: v.optional(v.array(v.string())), // Optional tags for categorization
    summary: v.optional(v.string()), // Optional summary/description
    wordCount: v.number(), // Number of words in content
    embedding: v.optional(v.array(v.number())), // Vector embedding for semantic search
  })
    .index("by_upload_date", ["uploadedAt"])
    .index("by_active", ["isActive"])
    .index("by_content_type", ["contentType"])
    .index("by_active_and_date", ["isActive", "uploadedAt"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["isActive", "contentType"]
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536, // OpenAI embedding dimensions
      filterFields: ["isActive", "contentType"]
    }),

  // Telegram threads table - stores conversation threads
  telegram_threads: defineTable({
    threadId: v.number(), // Telegram's message_thread_id or userId for user-based threads
    chatId: v.number(), // Chat where this thread exists
    title: v.optional(v.string()), // Thread title if available
    creatorUserId: v.optional(v.number()), // User who created the thread
    creatorUsername: v.optional(v.string()),
    creatorFirstName: v.optional(v.string()),
    creatorLastName: v.optional(v.string()),
    firstMessageId: v.optional(v.number()), // ID of the first message in thread
    lastMessageId: v.optional(v.number()), // ID of the most recent message
    lastMessageText: v.optional(v.string()), // Preview of last message
    lastMessageTimestamp: v.optional(v.number()), // Timestamp of last message
    messageCount: v.number(), // Total number of messages in thread
    isActive: v.boolean(), // Whether thread is still active
    createdAt: v.number(), // When thread was first seen
    updatedAt: v.number(), // When thread was last updated
  })
    .index("by_chat_id", ["chatId"])
    .index("by_thread_id", ["threadId"])
    .index("by_chat_and_thread", ["chatId", "threadId"])
    .index("by_chat_and_user", ["chatId", "creatorUserId"])
    .index("by_active", ["isActive"])
    .index("by_last_message", ["lastMessageTimestamp"])
    .index("by_active_with_timestamp", ["isActive", "lastMessageTimestamp"]),

  // Telegram messages table
  telegram_messages: defineTable({
    messageId: v.number(),
    chatId: v.number(),
    userId: v.optional(v.number()),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    text: v.string(),
    messageType: v.string(), // "text", "photo", "document", etc.
    timestamp: v.number(), // Unix timestamp from Telegram
    createdAt: v.number(), // When the record was created in our DB
    // Thread support
    messageThreadId: v.optional(v.number()), // Telegram thread ID if message is in a thread
    replyToMessageId: v.optional(v.number()), // ID of message this is replying to
    // Reference to our thread record
    threadDocId: v.optional(v.id("telegram_threads")), // Reference to telegram_threads table
    isActive: v.boolean(), // Whether message is active
  })
    .index("by_chat_id", ["chatId"])
    .index("by_user_id", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_thread", ["chatId", "messageThreadId"])
    .index("by_thread_doc", ["threadDocId"])
    .index("by_reply", ["replyToMessageId"])
    .index("by_active", ["isActive"])
    .index("by_chat_and_timestamp", ["chatId", "timestamp"]),
});