import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  conversations: {
    index: {
      updateConversationType: FunctionReference<
        "mutation",
        "public",
        {
          conversationId: Id<"unified_conversations">;
          documentIds?: Array<Id<"rag_documents">>;
          documentTitles?: Array<string>;
          newType: "general" | "rag";
        },
        any
      >;
    };
    updateConversationType: FunctionReference<
      "mutation",
      "public",
      {
        conversationId: Id<"unified_conversations">;
        documentIds?: Array<Id<"rag_documents">>;
        documentTitles?: Array<string>;
        newType: "general" | "rag";
      },
      any
    >;
  };
  documents: {
    saveDocument: FunctionReference<
      "mutation",
      "public",
      {
        content: string;
        contentType: string;
        summary?: string;
        tags?: Array<string>;
        title: string;
      },
      any
    >;
    getAllDocuments: FunctionReference<
      "query",
      "public",
      { cursor?: string; limit?: number },
      any
    >;
    getDocumentById: FunctionReference<
      "query",
      "public",
      { documentId: Id<"rag_documents"> },
      any
    >;
    updateDocument: FunctionReference<
      "mutation",
      "public",
      {
        content?: string;
        documentId: Id<"rag_documents">;
        summary?: string;
        tags?: Array<string>;
        title?: string;
      },
      any
    >;
    deleteDocument: FunctionReference<
      "mutation",
      "public",
      { documentId: Id<"rag_documents"> },
      any
    >;
    searchDocuments: FunctionReference<
      "query",
      "public",
      { limit?: number; searchTerm: string },
      any
    >;
    saveDocumentsBatch: FunctionReference<
      "mutation",
      "public",
      {
        documents: Array<{
          content: string;
          contentType: string;
          summary?: string;
          tags?: Array<string>;
          title: string;
        }>;
      },
      any
    >;
    getDocumentStats: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getEnhancedDocumentStats: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getDocumentUploadStats: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getDocumentsByIds: FunctionReference<
      "query",
      "public",
      { documentIds: Array<Id<"rag_documents">> },
      any
    >;
  };
  embeddings: {
    generateEmbedding: FunctionReference<
      "action",
      "public",
      { text: string },
      any
    >;
    createDocumentEmbedding: FunctionReference<
      "mutation",
      "public",
      {
        chunkIndex?: number;
        chunkText?: string;
        documentId: Id<"rag_documents">;
        embedding: Array<number>;
        embeddingDimensions: number;
        embeddingModel: string;
        processingTimeMs?: number;
      },
      any
    >;
    getDocumentEmbeddings: FunctionReference<
      "query",
      "public",
      { documentId: Id<"rag_documents"> },
      any
    >;
    getEmbeddingById: FunctionReference<
      "query",
      "public",
      { embeddingId: Id<"document_embeddings"> },
      any
    >;
    getAllDocumentEmbeddings: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getAllEmbeddingsForAtlas: FunctionReference<
      "query",
      "public",
      { limit?: number; offset?: number },
      any
    >;
    getEmbeddingsCount: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    deleteDocumentEmbeddings: FunctionReference<
      "mutation",
      "public",
      { documentId: Id<"rag_documents"> },
      any
    >;
    processDocumentWithChunking: FunctionReference<
      "action",
      "public",
      { documentId: Id<"rag_documents">; maxChunkSize?: number },
      any
    >;
    checkLLMServiceStatus: FunctionReference<
      "action",
      "public",
      Record<string, never>,
      any
    >;
  };
  generalChat: {
    createConversation: FunctionReference<
      "mutation",
      "public",
      {
        ipAddress?: string;
        llmModel: string;
        sessionId: string;
        title?: string;
        userAgent?: string;
        userId?: string;
      },
      any
    >;
    addMessage: FunctionReference<
      "mutation",
      "public",
      {
        content: string;
        conversationId: Id<"general_conversations">;
        messageId: string;
        metadata?: string;
        processingTimeMs?: number;
        role: string;
        tokenCount?: number;
      },
      any
    >;
    getConversationBySessionId: FunctionReference<
      "query",
      "public",
      { sessionId: string },
      any
    >;
    getConversationMessages: FunctionReference<
      "query",
      "public",
      { conversationId: Id<"general_conversations">; limit?: number },
      any
    >;
    getRecentConversations: FunctionReference<
      "query",
      "public",
      { limit?: number; userId?: string },
      any
    >;
    updateConversationTitle: FunctionReference<
      "mutation",
      "public",
      { conversationId: Id<"general_conversations">; title: string },
      any
    >;
    deactivateConversation: FunctionReference<
      "mutation",
      "public",
      { conversationId: Id<"general_conversations"> },
      any
    >;
    searchConversations: FunctionReference<
      "query",
      "public",
      { limit?: number; searchTerm: string; userId?: string },
      any
    >;
    getConversationStats: FunctionReference<
      "query",
      "public",
      { conversationId: Id<"general_conversations"> },
      any
    >;
  };
  messages: {
    getAllMessages: FunctionReference<
      "query",
      "public",
      { limit?: number },
      any
    >;
    getMessagesByThreadDoc: FunctionReference<
      "query",
      "public",
      { limit?: number; threadDocId: Id<"telegram_threads"> },
      any
    >;
    getMessagesByChatId: FunctionReference<
      "query",
      "public",
      { chatId: number; limit?: number },
      any
    >;
    saveMessage: FunctionReference<
      "mutation",
      "public",
      {
        chatId: number;
        messageId: number;
        messageThreadId?: number;
        messageType: string;
        text: string;
        threadDocId?: Id<"telegram_threads">;
        timestamp: number;
      },
      any
    >;
    saveMessageToThread: FunctionReference<
      "mutation",
      "public",
      {
        chatId: number;
        messageId: number;
        messageThreadId?: number;
        messageType: string;
        text: string;
        threadDocId: Id<"telegram_threads">;
        timestamp: number;
      },
      any
    >;
    getMessageStats: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
  };
  messagesThread: {
    saveMessageToThread: FunctionReference<
      "mutation",
      "public",
      {
        chatId: number;
        firstName?: string;
        lastName?: string;
        messageId: number;
        messageThreadId?: number;
        messageType: string;
        replyToMessageId?: number;
        text: string;
        threadDocId: Id<"telegram_threads">;
        timestamp: number;
        userId?: number;
        username?: string;
      },
      any
    >;
    saveMessageWithThreadHandling: FunctionReference<
      "mutation",
      "public",
      {
        chatId: number;
        firstName?: string;
        lastName?: string;
        messageId: number;
        messageThreadId?: number;
        messageType: string;
        replyToMessageId?: number;
        text: string;
        timestamp: number;
        userId?: number;
        username?: string;
      },
      any
    >;
  };
  notifications: {
    createNotification: FunctionReference<
      "mutation",
      "public",
      {
        documentId?: Id<"rag_documents">;
        message: string;
        metadata?: string;
        source?: string;
        title: string;
        type: string;
      },
      any
    >;
    getAllNotifications: FunctionReference<
      "query",
      "public",
      { limit?: number },
      any
    >;
    getUnreadCount: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    markAsRead: FunctionReference<
      "mutation",
      "public",
      { notificationId: Id<"notifications"> },
      any
    >;
    markAllAsRead: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
    deleteNotification: FunctionReference<
      "mutation",
      "public",
      { notificationId: Id<"notifications"> },
      any
    >;
    getNotificationsByType: FunctionReference<
      "query",
      "public",
      { limit?: number; type: string },
      any
    >;
    createDocumentUploadNotification: FunctionReference<
      "mutation",
      "public",
      {
        documentId: Id<"rag_documents">;
        documentTitle: string;
        source?: string;
      },
      any
    >;
    createDocumentEmbeddingNotification: FunctionReference<
      "mutation",
      "public",
      {
        documentId: Id<"rag_documents">;
        documentTitle: string;
        source?: string;
      },
      any
    >;
    createDocumentDeletionNotification: FunctionReference<
      "mutation",
      "public",
      {
        documentId: Id<"rag_documents">;
        documentTitle: string;
        source?: string;
      },
      any
    >;
  };
  ragChat: {
    createConversation: FunctionReference<
      "mutation",
      "public",
      {
        documentIds: Array<Id<"rag_documents">>;
        ipAddress?: string;
        llmModel: string;
        sessionId: string;
        title?: string;
        userAgent?: string;
        userId?: string;
      },
      any
    >;
    addMessage: FunctionReference<
      "mutation",
      "public",
      {
        content: string;
        conversationId: Id<"rag_conversations">;
        messageId: string;
        metadata?: string;
        processingTimeMs?: number;
        role: string;
        sources?: Array<{
          documentId: Id<"rag_documents">;
          score: number;
          snippet: string;
          title: string;
        }>;
        tokenCount?: number;
      },
      any
    >;
    getConversationBySessionId: FunctionReference<
      "query",
      "public",
      { sessionId: string },
      any
    >;
    getConversationMessages: FunctionReference<
      "query",
      "public",
      { conversationId: Id<"rag_conversations">; limit?: number },
      any
    >;
    getRecentConversations: FunctionReference<
      "query",
      "public",
      { limit?: number; userId?: string },
      any
    >;
    updateConversationTitle: FunctionReference<
      "mutation",
      "public",
      { conversationId: Id<"rag_conversations">; title: string },
      any
    >;
    deactivateConversation: FunctionReference<
      "mutation",
      "public",
      { conversationId: Id<"rag_conversations"> },
      any
    >;
    getConversationStats: FunctionReference<
      "query",
      "public",
      { conversationId: Id<"rag_conversations"> },
      any
    >;
    searchConversations: FunctionReference<
      "query",
      "public",
      { limit?: number; searchTerm: string; userId?: string },
      any
    >;
  };
  serviceStatus: {
    updateServiceStatus: FunctionReference<
      "mutation",
      "public",
      {
        degradedMode?: boolean;
        error?: string;
        memoryUsage?: {
          availableMb?: number;
          percent?: number;
          processCpuPercent?: number;
          processMemoryMb?: number;
          processMemoryPercent?: number;
          rssMb?: number;
          systemMemoryAvailableGb?: number;
          systemMemoryTotalGb?: number;
          systemMemoryUsedPercent?: number;
          vmsMb?: number;
        };
        message: string;
        model?: string;
        modelLoaded?: boolean;
        modelLoading?: boolean;
        ready: boolean;
        serviceName: string;
        status: string;
        timestamp: number;
        uptime?: number;
      },
      any
    >;
    getAllServiceStatuses: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getServiceStatus: FunctionReference<
      "query",
      "public",
      { serviceName: string },
      any
    >;
    cleanupOldStatuses: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
  };
  threads: {
    getAllActiveThreads: FunctionReference<
      "query",
      "public",
      { limit?: number },
      any
    >;
    getThreadsInChat: FunctionReference<
      "query",
      "public",
      { chatId: number; limit?: number },
      any
    >;
    getThreadById: FunctionReference<
      "query",
      "public",
      { threadDocId: Id<"telegram_threads"> },
      any
    >;
    getThreadStats: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
  };
  userSessions: {
    upsertSession: FunctionReference<
      "mutation",
      "public",
      {
        metadata?: string;
        sessionId: string;
        source: string;
        userAgent?: string;
        userId?: string;
      },
      any
    >;
    heartbeat: FunctionReference<
      "mutation",
      "public",
      { sessionId: string },
      any
    >;
    endSession: FunctionReference<
      "mutation",
      "public",
      { sessionId: string },
      any
    >;
    getActiveUserCount: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    getSessionStats: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    cleanupExpiredSessions: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
    getActiveSessions: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
  };
  presence: {
    heartbeat: FunctionReference<
      "mutation",
      "public",
      {
        as?: string;
        city?: string;
        coordinates?: Array<number>;
        country?: string;
        countryCode?: string;
        interval: number;
        ipAddress?: string;
        isp?: string;
        org?: string;
        region?: string;
        roomId: string;
        sessionId: string;
        timezone?: string;
        userId: string;
        zip?: string;
      },
      any
    >;
    list: FunctionReference<"query", "public", { roomToken: string }, any>;
    disconnect: FunctionReference<
      "mutation",
      "public",
      { sessionToken: string },
      any
    >;
    getActiveUserCount: FunctionReference<
      "query",
      "public",
      { roomId?: string },
      any
    >;
    getActiveUsersWithLocation: FunctionReference<
      "query",
      "public",
      { roomId?: string },
      any
    >;
    getPresenceDebugInfo: FunctionReference<
      "query",
      "public",
      { roomId?: string },
      any
    >;
  };
  vectorSearch: {
    searchDocumentsByVector: FunctionReference<
      "action",
      "public",
      {
        documentIds?: Array<Id<"rag_documents">>;
        limit?: number;
        queryText: string;
      },
      any
    >;
  };
  userLocation: {
    updateUserLocation: FunctionReference<
      "mutation",
      "public",
      {
        as?: string;
        city?: string;
        coordinates?: Array<number>;
        country: string;
        countryCode?: string;
        ipAddress: string;
        isp?: string;
        org?: string;
        region?: string;
        sessionId: string;
        timezone?: string;
        userId: string;
        zip?: string;
      },
      any
    >;
    getUserLocation: FunctionReference<
      "query",
      "public",
      { sessionId: string; userId: string },
      any
    >;
    getAllUserLocations: FunctionReference<"query", "public", any, any>;
    cleanupOldLocations: FunctionReference<"mutation", "public", any, any>;
  };
};
export type InternalApiType = {};
