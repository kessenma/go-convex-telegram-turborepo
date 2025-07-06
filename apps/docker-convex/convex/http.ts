import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { saveMessageAPI, getMessagesAPI, saveMessageToThreadAPI } from "./api";
import { saveDocumentAPI, getDocumentsAPI, getDocumentStatsAPI, getDocumentByIdAPI } from "./documentApi";
import { generateDocumentEmbeddingAPI, searchDocumentsVectorAPI, batchGenerateEmbeddingsAPI, checkLLMServiceStatusAPI } from "./embeddingApi";
import { getActiveThreadsAPI, getThreadStatsAPI, getThreadByIdAPI } from "./threadApi";

const http = httpRouter();

// Telegram bot API endpoints
http.route({
  path: "/api/telegram/messages",
  method: "POST",
  handler: saveMessageAPI,
});

http.route({
  path: "/api/telegram/messages",
  method: "GET",
  handler: getMessagesAPI,
});

// New endpoint for saving messages to specific threads
http.route({
  path: "/api/telegram/messages/thread",
  method: "POST",
  handler: saveMessageToThreadAPI,
});

// Thread API endpoints
http.route({
  path: "/api/threads",
  method: "GET",
  handler: getActiveThreadsAPI,
});

http.route({
  path: "/api/threads/stats",
  method: "GET",
  handler: getThreadStatsAPI,
});

http.route({
  path: "/api/threads/by-id",
  method: "GET",
  handler: getThreadByIdAPI,
});

// RAG document API endpoints
http.route({
  path: "/api/documents",
  method: "POST",
  handler: saveDocumentAPI,
});

http.route({
  path: "/api/documents",
  method: "GET",
  handler: getDocumentsAPI,
});

http.route({
  path: "/api/documents/stats",
  method: "GET",
  handler: getDocumentStatsAPI,
});

// Embedding API endpoints
http.route({
  path: "/api/documents/embedding",
  method: "POST",
  handler: generateDocumentEmbeddingAPI,
});

http.route({
  path: "/api/documents/search",
  method: "GET",
  handler: searchDocumentsVectorAPI,
});

http.route({
  path: "/api/documents/embeddings/batch",
  method: "POST",
  handler: batchGenerateEmbeddingsAPI,
});

// Parameterized route should come last - using pathPrefix for dynamic routing
http.route({
  pathPrefix: "/api/documents/",
  method: "GET",
  handler: getDocumentByIdAPI,
});

http.route({
  path: "/api/llm/status",
  method: "GET",
  handler: checkLLMServiceStatusAPI,
});

// Health check endpoint
const healthCheck = httpAction(async () => {
  return new Response(
    JSON.stringify({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "convex-telegram-backend"
    }),
    { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
});

http.route({
  path: "/api/health",
  method: "GET",
  handler: healthCheck,
});

// Note: Message sending is now handled directly by Next.js app using node-telegram-bot-api
// The Next.js app will send messages to Telegram and then save them to the database

export default http;