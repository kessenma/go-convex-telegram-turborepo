import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Example items table (from the original example)
  items: defineTable({
    name: v.string(),
    description: v.string(),
    createdAt: v.number(),
  }),

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
  })
    .index("by_chat_id", ["chatId"])
    .index("by_user_id", ["userId"])
    .index("by_timestamp", ["timestamp"]),
});