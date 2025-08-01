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
      dimensions: 384, // all-MiniLM-L6-v2 embedding dimensions
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
    documentTitles: v.array(v.string()), // Document titles for quick display
    userId: v.optional(v.string()), // User identifier (if available)
    userAgent: v.optional(v.string()), // User agent for web sessions
    ipAddress: v.optional(v.string()), // IP address for tracking
    isActive: v.boolean(), // Whether conversation is still active
    isPublic: v.boolean(), // Whether conversation is publicly accessible
    createdAt: v.number(), // When conversation started
    lastMessageAt: v.number(), // When last message was sent
    messageCount: v.number(), // Total number of messages in conversation
    totalTokensUsed: v.number(), // Total tokens consumed in this conversation
    llmModel: v.string(), // LLM model being used for this conversation
    metadata: v.optional(v.string()), // JSON string for additional data like chat mode, settings
  })
    .index("by_session_id", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
    .index("by_last_message", ["lastMessageAt"])
    .index("by_active", ["isActive"])
    .index("by_active_and_last_message", ["isActive", "lastMessageAt"])
    .index("by_public", ["isPublic"])
    .index("by_llm_model", ["llmModel"]),

  // General chat conversations table - stores general chat sessions without documents
  general_conversations: defineTable({
    sessionId: v.string(), // Unique session identifier
    title: v.optional(v.string()), // Optional conversation title
    userId: v.optional(v.string()), // User identifier (if available)
    userAgent: v.optional(v.string()), // User agent for web sessions
    ipAddress: v.optional(v.string()), // IP address for tracking
    isActive: v.boolean(), // Whether conversation is still active
    isPublic: v.boolean(), // Whether conversation is publicly accessible
    createdAt: v.number(), // When conversation started
    lastMessageAt: v.number(), // When last message was sent
    messageCount: v.number(), // Total number of messages in conversation
    totalTokensUsed: v.number(), // Total tokens consumed in this conversation
    llmModel: v.string(), // LLM model being used for this conversation
    metadata: v.optional(v.string()), // JSON string for additional data like chat mode, settings
  })
    .index("by_session_id", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
    .index("by_last_message", ["lastMessageAt"])
    .index("by_active", ["isActive"])
    .index("by_active_and_last_message", ["isActive", "lastMessageAt"])
    .index("by_public", ["isPublic"])
    .index("by_llm_model", ["llmModel"]),

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

  // General chat messages table - stores individual messages in general conversations
  general_chat_messages: defineTable({
    conversationId: v.id("general_conversations"), // Reference to conversation
    messageId: v.string(), // Unique message identifier
    role: v.string(), // "user" or "assistant"
    content: v.string(), // Message content
    timestamp: v.number(), // When message was created
    tokenCount: v.optional(v.number()), // Number of tokens in this message
    processingTimeMs: v.optional(v.number()), // Time taken to generate (for assistant messages)
    metadata: v.optional(v.string()), // JSON string for additional data
  })
    .index("by_conversation", ["conversationId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_role", ["role"])
    .index("by_conversation_and_timestamp", ["conversationId", "timestamp"]),

  // Unified conversations table - unified view for both general and RAG conversations
  unified_conversations: defineTable({
    sessionId: v.string(), // Unique session identifier
    type: v.union(v.literal("general"), v.literal("rag")), // Conversation type
    title: v.optional(v.string()), // Optional conversation title
    documentIds: v.array(v.id("rag_documents")), // Documents for RAG mode (empty for general)
    documentTitles: v.array(v.string()), // Document titles for quick display
    userId: v.optional(v.string()), // User identifier (if available)
    userAgent: v.optional(v.string()), // User agent for web sessions
    ipAddress: v.optional(v.string()), // IP address for tracking
    isActive: v.boolean(), // Whether conversation is still active
    isPublic: v.boolean(), // Whether conversation is publicly accessible
    createdAt: v.number(), // When conversation started
    lastMessageAt: v.number(), // When last message was sent
    messageCount: v.number(), // Total number of messages in conversation
    totalTokensUsed: v.number(), // Total tokens consumed in this conversation
    llmModel: v.string(), // LLM model being used for this conversation
    chatMode: v.string(), // Chat mode identifier from UI
    settings: v.optional(v.string()), // JSON string for UI settings and preferences
    metadata: v.optional(v.string()), // JSON string for additional data
  })
    .index("by_session_id", ["sessionId"])
    .index("by_type", ["type"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
    .index("by_last_message", ["lastMessageAt"])
    .index("by_active", ["isActive"])
    .index("by_active_and_last_message", ["isActive", "lastMessageAt"])
    .index("by_public", ["isPublic"])
    .index("by_llm_model", ["llmModel"])
    .index("by_chat_mode", ["chatMode"]),

  // Unified chat messages table - stores messages for unified conversations
  unified_chat_messages: defineTable({
    conversationId: v.id("unified_conversations"), // Reference to unified conversation
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
    }))), // Source documents used for assistant responses (RAG mode)
    metadata: v.optional(v.string()), // JSON string for additional data
    chatMode: v.string(), // Chat mode when message was sent
  })
    .index("by_conversation", ["conversationId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_role", ["role"])
    .index("by_chat_mode", ["chatMode"])
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

  // Service statuses table - stores status updates from Python applications
  service_statuses: defineTable({
    serviceName: v.string(), // Name of the service ("lightweight-llm", "vector-convert-llm")
    status: v.string(), // Service status ("healthy", "degraded", "loading", "starting", "error")
    ready: v.boolean(), // Whether service is ready to handle requests
    message: v.string(), // Status message
    modelLoaded: v.optional(v.boolean()), // Whether model is loaded
    modelLoading: v.optional(v.boolean()), // Whether model is currently loading
    model: v.optional(v.string()), // Model name/path
    uptime: v.optional(v.number()), // Service uptime in seconds
    error: v.optional(v.string()), // Error message if any
    degradedMode: v.optional(v.boolean()), // Whether service is in degraded mode
    memoryUsage: v.optional(v.object({
      processCpuPercent: v.optional(v.number()),
      processMemoryMb: v.optional(v.number()),
      processMemoryPercent: v.optional(v.number()),
      systemMemoryAvailableGb: v.optional(v.number()),
      systemMemoryTotalGb: v.optional(v.number()),
      systemMemoryUsedPercent: v.optional(v.number()),
      rssMb: v.optional(v.number()),
      vmsMb: v.optional(v.number()),
      percent: v.optional(v.number()),
      availableMb: v.optional(v.number()),
    })), // Memory usage statistics
    timestamp: v.number(), // When status was reported
    lastUpdated: v.number(), // When this record was last updated
  })
    .index("by_service_name", ["serviceName"])
    .index("by_status", ["status"])
    .index("by_timestamp", ["timestamp"])
    .index("by_last_updated", ["lastUpdated"])
    .index("by_service_and_timestamp", ["serviceName", "timestamp"]),
});
