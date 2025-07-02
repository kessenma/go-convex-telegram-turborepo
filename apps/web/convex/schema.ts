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
});