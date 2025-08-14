/*
 * CONVEX HTTP API ROUTER
 * apps/docker-convex/convex/http.ts
 * =====================
 * 
 * This file serves as the centralized HTTP API router for the Convex backend application.
 * It imports modular route handlers from the https-endpoints directory for better organization.
 * 
 * ARCHITECTURE OVERVIEW:
 * - Routes are organized by functional domains in separate modules
 * - Each module handles its own endpoints with proper error handling and validation
 * - The router uses pathPrefix for parameterized routes due to Convex routing limitations
 * 
 * API DOMAINS:
 * 1. TELEGRAM API - Message handling and bot integration (./https_endpoints/telegram)
 * 2. DOCUMENT API - RAG document management (./https_endpoints/documents)
 * 3. EMBEDDING API - Vector embedding generation (./https_endpoints/embedding)
 * 4. AI CHAT API - Chat and conversation management (./https_endpoints/ai_chat)
 * 5. HEALTH & MONITORING - System status and service monitoring (./https_endpoints/health)
 * 6. PRESENCE API - User activity and location tracking (./https_endpoints/presence)
 * 7. NOTIFICATIONS API - System notifications and alerts (./https_endpoints/notifications)
 * 
 * ROUTING STRATEGY:
 * - More specific routes are placed before general ones to avoid conflicts
 * - Parameterized routes use pathPrefix instead of {id} syntax
 * - All responses follow consistent JSON format with proper HTTP status codes
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// Import modular route handlers
import * as telegramRoutes from "./https_endpoints/telegram";
import * as documentRoutes from "./https_endpoints/documents";
import * as embeddingRoutes from "./https_endpoints/embedding";
import * as aiChatRoutes from "./https_endpoints/ai_chat";
import * as monitoringRoutes from "./https_endpoints/monitoring";
import * as notificationRoutes from "./https_endpoints/notifications";
import * as healthRoutes from "./https_endpoints/health";
import * as presenceRoutes from "./https_endpoints/presence";



// =============================================================================
// HEALTH & MONITORING ENDPOINTS (moved to ./https-endpoints/monitoring)
// =============================================================================





















// =============================================================================
// HTTP ROUTER CONFIGURATION
// =============================================================================

const http = httpRouter();

// HEALTH & MONITORING ENDPOINTS
http.route({
  path: "/api/health",
  method: "GET",
  handler: healthRoutes.healthAPI,
});

http.route({
  path: "/api/docker/status",
  method: "GET",
  handler: monitoringRoutes.getDockerStatusAPI,
});

http.route({
  path: "/api/lightweight-llm/status",
  method: "GET",
  handler: monitoringRoutes.getLightweightLLMStatusAPI,
});

http.route({
  path: "/updateServiceStatus",
  method: "POST",
  handler: healthRoutes.updateServiceStatusAPI,
});

http.route({
  path: "/api/status/consolidated",
  method: "GET",
  handler: healthRoutes.getConsolidatedStatusAPI,
});

// USER ACTIVITY MONITORING (using Convex Presence API)
http.route({
  path: "/api/users/active-count",
  method: "GET",
  handler: monitoringRoutes.getActiveUserCountAPI,
});

http.route({
  path: "/api/users/with-location",
  method: "GET",
  handler: monitoringRoutes.getUsersWithLocationAPI,
});

// TELEGRAM BOT API ENDPOINTS
http.route({
  path: "/api/telegram/messages",
  method: "POST",
  handler: telegramRoutes.saveMessageAPI,
});

http.route({
  path: "/api/telegram/messages/thread",
  method: "POST",
  handler: telegramRoutes.saveMessageToThreadAPI,
});

http.route({
  path: "/api/messages",
  method: "GET",
  handler: telegramRoutes.getMessagesAPI,
});

// THREAD API ENDPOINTS
http.route({
  path: "/api/threads",
  method: "GET",
  handler: aiChatRoutes.getActiveThreadsAPI,
});

http.route({
  path: "/api/threads/stats",
  method: "GET",
  handler: aiChatRoutes.getThreadStatsAPI,
});

http.route({
  path: "/api/threads/by-id",
  method: "GET",
  handler: aiChatRoutes.getThreadByIdAPI,
});

// Document by ID with query parameter (for compatibility)
http.route({
  path: "/api/documents/by-id",
  method: "GET",
  handler: documentRoutes.getDocumentByIdAPI,
});

// DOCUMENT API ENDPOINTS (RAG System)
http.route({
  path: "/api/documents",
  method: "POST",
  handler: documentRoutes.saveDocumentAPI,
});

http.route({
  path: "/api/documents/batch",
  method: "POST",
  handler: documentRoutes.saveDocumentsBatchAPI,
});

http.route({
  path: "/api/documents",
  method: "GET",
  handler: documentRoutes.getDocumentsAPI,
});

http.route({
  path: "/api/documents/by-ids",
  method: "POST",
  handler: documentRoutes.getDocumentsByIdsAPI,
});

http.route({
  path: "/api/documents/stats",
  method: "GET",
  handler: documentRoutes.getDocumentStatsAPI,
});

http.route({
  path: "/api/documents/enhanced-stats",
  method: "GET",
  handler: documentRoutes.getEnhancedDocumentStatsAPI,
});

// EMBEDDING API ENDPOINTS
http.route({
  path: "/api/embeddings",
  method: "POST",
  handler: embeddingRoutes.saveDocumentEmbeddingAPI,
});

http.route({
  path: "/api/embeddings/generate",
  method: "POST",
  handler: embeddingRoutes.generateDocumentEmbeddingAPI,
});

http.route({
  path: "/api/embeddings/batch",
  method: "POST",
  handler: embeddingRoutes.batchGenerateEmbeddingsAPI,
});

http.route({
  path: "/api/embeddings/llm-status",
  method: "GET",
  handler: embeddingRoutes.checkLLMServiceStatusAPI,
});

http.route({
  path: "/api/embeddings/document",
  method: "GET",
  handler: embeddingRoutes.getDocumentEmbeddingsAPI,
});

http.route({
  path: "/api/embeddings/all",
  method: "GET",
  handler: embeddingRoutes.getAllDocumentEmbeddingsAPI,
});

http.route({
  path: "/api/embeddings/createDocumentEmbedding",
  method: "POST",
  handler: embeddingRoutes.createDocumentEmbeddingAPI,
});

http.route({
  path: "/api/embeddings/atlas-data",
  method: "GET",
  handler: embeddingRoutes.getEmbeddingsForAtlasAPI,
});

http.route({
  path: "/api/embeddings/trigger",
  method: "POST",
  handler: embeddingRoutes.triggerDocumentEmbeddingAPI,
});

// Additional embedding routes
http.route({
  path: "/api/embeddings/search",
  method: "GET",
  handler: embeddingRoutes.searchDocumentsByVectorAPI,
});

http.route({
  path: "/api/embeddings/search",
  method: "POST",
  handler: embeddingRoutes.searchDocumentsByVectorAPI,
});

// LLM MEMORY USAGE ENDPOINTS (Legacy - now handled by consolidated metrics)
http.route({
  path: "/api/llm/memory-usage",
  method: "POST",
  handler: notificationRoutes.saveLLMMemoryUsageAPI,
});

// NOTIFICATIONS API ENDPOINTS
http.route({
  path: "/api/notifications",
  method: "GET",
  handler: notificationRoutes.getNotificationsAPI,
});

http.route({
  path: "/api/notifications",
  method: "POST",
  handler: notificationRoutes.createNotificationAPI,
});

http.route({
  path: "/api/notifications/unread-count",
  method: "GET",
  handler: notificationRoutes.getUnreadNotificationsCountAPI,
});

http.route({
  path: "/api/notifications/mark-read",
  method: "PUT",
  handler: notificationRoutes.markNotificationAsReadAPI,
});

http.route({
  path: "/api/notifications/mark-all-read",
  method: "PUT",
  handler: notificationRoutes.markAllNotificationsAsReadAPI,
});

// GENERAL CHAT API ENDPOINTS
http.route({
  path: "/api/general-chat",
  method: "POST",
  handler: aiChatRoutes.generalChatAPI,
});

http.route({
  path: "/api/general-chat/conversations/search",
  method: "GET",
  handler: aiChatRoutes.searchConversationsAPI,
});

http.route({
  path: "/api/general-chat/history",
  method: "GET",
  handler: aiChatRoutes.getChatHistoryAPI,
});

// RAG CHAT API ENDPOINTS
http.route({
  path: "/api/rag-chat",
  method: "POST",
  handler: aiChatRoutes.ragChatAPI,
});

http.route({
  path: "/api/rag-chat/conversations/search",
  method: "GET",
  handler: aiChatRoutes.searchConversationsAPI,
});

http.route({
  path: "/api/rag-chat/threads/create",
  method: "POST",
  handler: aiChatRoutes.createThreadAPI,
});

http.route({
  path: "/api/rag-chat/threads/update",
  method: "PUT",
  handler: aiChatRoutes.updateThreadAPI,
});

http.route({
  path: "/api/rag-chat/threads/delete",
  method: "DELETE",
  handler: aiChatRoutes.deleteThreadAPI,
});

// PRESENCE API ENDPOINTS
http.route({
  path: "/api/presence/heartbeat",
  method: "POST",
  handler: presenceRoutes.presenceHeartbeatAPI,
});

http.route({
  path: "/api/presence/heartbeat",
  method: "OPTIONS",
  handler: presenceRoutes.presenceOptionsAPI,
});

// PARAMETERIZED ROUTES (Must be placed last to avoid conflicts)
// Document operations by ID
http.route({
  pathPrefix: "/api/documents/",
  method: "GET",
  handler: documentRoutes.getDocumentByIdAPI,
});

http.route({
  pathPrefix: "/api/documents/",
  method: "DELETE",
  handler: documentRoutes.deleteDocumentAPI,
});

export default http;