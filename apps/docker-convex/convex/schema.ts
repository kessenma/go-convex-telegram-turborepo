// apps/docker-convex/convex/schema.ts
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
    hasEmbedding: v.boolean(), // Whether document has an embedding
  })
    .index("by_upload_date", ["uploadedAt"])
    .index("by_active", ["isActive"])
    .index("by_content_type", ["contentType"])
    .index("by_active_and_date", ["isActive", "uploadedAt"])
    .index("by_has_embedding", ["hasEmbedding"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["isActive", "contentType"]
    }),

  // Document embeddings table - stores vector embeddings with relationship to documents
  document_embeddings: defineTable({
    documentId: v.id("rag_documents"), // Reference to the original document
    embedding: v.array(v.number()), // Vector embedding for semantic search
    embeddingModel: v.string(), // Model used to generate embedding
    embeddingDimensions: v.number(), // Number of dimensions in the embedding
    chunkIndex: v.optional(v.number()), // For chunked documents, which chunk this is
    chunkText: v.optional(v.string()), // Text content of this chunk
    createdAt: v.number(), // When embedding was generated
    processingTimeMs: v.optional(v.number()), // Time taken to generate embedding
    isActive: v.boolean(), // Whether embedding is active for search
  })
    .index("by_document", ["documentId"])
    .index("by_created_at", ["createdAt"])
    .index("by_active", ["isActive"])
    .index("by_model", ["embeddingModel"])
    .index("by_document_and_chunk", ["documentId", "chunkIndex"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768, // sentence-transformers/all-distilroberta-v1 embedding dimensions
      filterFields: ["isActive", "embeddingModel"]
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

  // Conversion jobs table - tracks LLM/embedding conversion history
  conversion_jobs: defineTable({
    jobId: v.string(), // Unique job identifier
    jobType: v.string(), // "embedding", "similarity", "search", "chat"
    status: v.string(), // "pending", "processing", "completed", "failed"
    documentId: v.optional(v.id("rag_documents")), // Reference to document if applicable
    inputText: v.optional(v.string()), // Input text for the job
    outputData: v.optional(v.string()), // JSON string of output data
    errorMessage: v.optional(v.string()), // Error message if job failed
    processingTimeMs: v.optional(v.number()), // Time taken to process in milliseconds
    llmModel: v.optional(v.string()), // Model used for processing
    embeddingDimensions: v.optional(v.number()), // Dimensions of embedding if applicable
    createdAt: v.number(), // When job was created
    startedAt: v.optional(v.number()), // When job processing started
    completedAt: v.optional(v.number()), // When job was completed
    requestSource: v.optional(v.string()), // "web", "telegram", "api"
    userId: v.optional(v.string()), // User who initiated the job
  })
    .index("by_status", ["status"])
    .index("by_job_type", ["jobType"])
    .index("by_document", ["documentId"])
    .index("by_created_at", ["createdAt"])
    .index("by_user", ["userId"])
    .index("by_status_and_type", ["status", "jobType"])
    .index("by_source", ["requestSource"]),

  // Request logs table - tracks API requests for statistics
  request_logs: defineTable({
    endpoint: v.string(), // API endpoint that was called
    method: v.string(), // HTTP method (GET, POST, etc.)
    timestamp: v.number(), // Request timestamp
    responseStatus: v.number(), // HTTP response status code
    processingTimeMs: v.optional(v.number()), // Time taken to process request
    userAgent: v.optional(v.string()), // User agent string
    ipAddress: v.optional(v.string()), // Client IP address (if available)
    requestSource: v.optional(v.string()), // "web", "telegram", "api", "health"
    errorMessage: v.optional(v.string()), // Error message if request failed
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_endpoint", ["endpoint"])
    .index("by_status", ["responseStatus"])
    .index("by_source", ["requestSource"])
    .index("by_endpoint_and_time", ["endpoint", "timestamp"]),

  // Notifications table - tracks user actions and system events
  notifications: defineTable({
    type: v.string(), // "document_uploaded", "document_embedded", "system_event"
    title: v.string(), // Notification title
    message: v.string(), // Notification message/description
    timestamp: v.number(), // When the notification was created
    isRead: v.boolean(), // Whether the notification has been read
    documentId: v.optional(v.id("rag_documents")), // Reference to document if applicable
    metadata: v.optional(v.string()), // JSON string for additional data
    source: v.optional(v.string()), // "web", "telegram", "api", "system"
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_type", ["type"])
    .index("by_read_status", ["isRead"])
    .index("by_type_and_timestamp", ["type", "timestamp"])
    .index("by_read_and_timestamp", ["isRead", "timestamp"]),

  // RAG chat conversations table - stores chat sessions with documents
  rag_conversations: defineTable({
    sessionId: v.string(), // Unique session identifier
    title: v.optional(v.string()), // Optional conversation title
    documentIds: v.array(v.id("rag_documents")), // Documents being chatted with
    userId: v.optional(v.string()), // User identifier (if available)
    userAgent: v.optional(v.string()), // User agent for web sessions
    ipAddress: v.optional(v.string()), // IP address for tracking
    isActive: v.boolean(), // Whether conversation is still active
    createdAt: v.number(), // When conversation started
    lastMessageAt: v.number(), // When last message was sent
    messageCount: v.number(), // Total number of messages in conversation
    totalTokensUsed: v.number(), // Total tokens consumed in this conversation
    llmModel: v.string(), // LLM model being used for this conversation
  })
    .index("by_session_id", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
    .index("by_last_message", ["lastMessageAt"])
    .index("by_active", ["isActive"])
    .index("by_active_and_last_message", ["isActive", "lastMessageAt"]),

  // RAG chat messages table - stores individual messages in conversations
  rag_chat_messages: defineTable({
    conversationId: v.id("rag_conversations"), // Reference to conversation
    messageId: v.string(), // Unique message identifier
    role: v.string(), // "user" or "assistant"
    content: v.string(), // Message content
    timestamp: v.number(), // When message was created
    tokenCount: v.optional(v.number()), // Number of tokens in this message
    processingTimeMs: v.optional(v.number()), // Time taken to generate (for assistant messages)
    sources: v.optional(v.array(v.object({
      documentId: v.id("rag_documents"),
      title: v.string(),
      snippet: v.string(),
      score: v.number(),
    }))), // Source documents used for assistant responses
    metadata: v.optional(v.string()), // JSON string for additional data
  })
    .index("by_conversation", ["conversationId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_role", ["role"])
    .index("by_conversation_and_timestamp", ["conversationId", "timestamp"]),

  // User sessions table - tracks active user sessions for real-time user count
  user_sessions: defineTable({
    sessionId: v.string(), // Unique session identifier (generated client-side)
    userId: v.optional(v.string()), // User identifier if available
    userAgent: v.optional(v.string()), // Browser user agent
    ipAddress: v.optional(v.string()), // Client IP address
    source: v.string(), // "web", "mobile", "telegram"
    isActive: v.boolean(), // Whether session is currently active
    lastHeartbeat: v.number(), // Last heartbeat timestamp
    createdAt: v.number(), // When session was created
    updatedAt: v.number(), // When session was last updated
    metadata: v.optional(v.string()), // JSON string for additional session data
  })
    .index("by_session_id", ["sessionId"])
    .index("by_active", ["isActive"])
    .index("by_last_heartbeat", ["lastHeartbeat"])
    .index("by_source", ["source"])
    .index("by_active_and_heartbeat", ["isActive", "lastHeartbeat"])
    .index("by_created_at", ["createdAt"]),
});
