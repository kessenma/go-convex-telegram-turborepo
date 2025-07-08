import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { saveMessageAPI, getMessagesAPI, saveMessageToThreadAPI } from "./api";
import { saveDocumentAPI, getDocumentsAPI, getDocumentStatsAPI, getDocumentByIdAPI } from "./documentApi";
import { generateDocumentEmbeddingAPI, searchDocumentsVectorAPI, batchGenerateEmbeddingsAPI, checkLLMServiceStatusAPI, getEmbeddedDocumentsAPI } from "./embeddingApi";
import { createConversionJobAPI, updateConversionJobAPI, getConversionJobsAPI, getConversionJobStatsAPI, getConversionJobByIdAPI } from "./conversionJobApi";
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

// Embedded documents API endpoint
http.route({
  path: "/api/documents/embedded",
  method: "GET",
  handler: getEmbeddedDocumentsAPI,
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

// Conversion job API endpoints
http.route({
  path: "/api/conversion-jobs",
  method: "POST",
  handler: createConversionJobAPI,
});

http.route({
  path: "/api/conversion-jobs",
  method: "PUT",
  handler: updateConversionJobAPI,
});

http.route({
  path: "/api/conversion-jobs",
  method: "GET",
  handler: getConversionJobsAPI,
});

http.route({
  path: "/api/conversion-jobs/stats",
  method: "GET",
  handler: getConversionJobStatsAPI,
});

// Parameterized route for getting job by ID
http.route({
  pathPrefix: "/api/conversion-jobs/",
  method: "GET",
  handler: getConversionJobByIdAPI,
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
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
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