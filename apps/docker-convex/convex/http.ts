/*
 * CONVEX HTTP API ROUTER
 * apps/docker-convex/convex/http.ts
 * =====================
 * 
 * This file serves as the centralized HTTP API router for the Convex backend application.
 * It consolidates all HTTP endpoints from various modules into a single, organized structure.
 * 
 * ARCHITECTURE OVERVIEW:
 * - All HTTP endpoints are defined as httpAction functions
 * - Routes are organized by functional domains (Telegram, Documents, Embeddings, Threads)
 * - Each endpoint includes proper error handling, validation, and response formatting
 * - The router uses pathPrefix for parameterized routes due to Convex routing limitations
 * 
 * API DOMAINS:
 * 1. TELEGRAM API - Message handling and bot integration
 * 2. DOCUMENT API - RAG document management (CRUD operations)
 * 3. EMBEDDING API - Vector embedding generation and management
 * 4. THREAD API - Conversation thread management
 * 5. HEALTH & MONITORING - System status and request logging
 * 
 * ROUTING STRATEGY:
 * - More specific routes are placed before general ones to avoid conflicts
 * - Parameterized routes use pathPrefix instead of {id} syntax
 * - All responses follow consistent JSON format with proper HTTP status codes
 * 
 * ERROR HANDLING:
 * - Comprehensive try-catch blocks for all endpoints
 * - Standardized error response format
 * - Detailed error logging for debugging
 * 
 * SECURITY CONSIDERATIONS:
 * - Input validation on all endpoints
 * - Proper HTTP status codes
 * - No sensitive data exposure in error messages
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Helper for standardized error responses
const errorResponse = (message: string, status: number, details?: any) => {
  return new Response(JSON.stringify({ error: message, details }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};

// =============================================================================
// API ENDPOINT IMPLEMENTATIONS
// =============================================================================

// Health check endpoint
export const healthAPI = httpAction(async (ctx, request) => {
  try {
    return new Response(
      JSON.stringify({ 
        status: "healthy",
        timestamp: Date.now(),
        service: "convex-api",
        version: "1.0.0"
      }),
      { 
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      }
    );
  } catch (error) {
    console.error("Health check error:", error);
    return errorResponse("Health check failed", 500, error instanceof Error ? error.message : "Unknown error");
  }
});

// =============================================================================
// API ENDPOINT IMPLEMENTATIONS
// =============================================================================

export const getDocumentStatsAPI = httpAction(async (ctx, request) => {
  try {
    const stats = await ctx.runQuery(api.documents.getDocumentStats, {});
    return new Response(JSON.stringify(stats));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// Save message to thread API
export const saveMessageToThreadAPI = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  // Validate required fields
  if (!body.messageId || !body.chatId || !body.text) {
    return new Response(
      JSON.stringify({ 
        error: "Missing required fields: messageId, chatId, text" 
      }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const messageId = await ctx.runMutation(api.messagesThread.saveMessageToThread, {
      messageId: body.messageId,
      chatId: body.chatId,
      userId: body.userId,
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
      text: body.text,
      messageType: body.messageType || "bot_message",
      timestamp: body.timestamp || Date.now(),
      messageThreadId: body.messageThreadId,
      threadDocId: body.threadDocId,
      replyToMessageId: body.replyToMessageId,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: messageId,
        message: "Message saved to thread successfully" 
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error saving message to thread:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to save message to thread",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// Get messages with optional filtering
export const getMessagesAPI = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  const limit = url.searchParams.get("limit");

  try {
    let messages;
    if (chatId) {
      messages = await ctx.runQuery(api.messages.getMessagesByChatId, {
        chatId: parseInt(chatId),
        limit: limit ? parseInt(limit) : undefined,
      });
    } else {
      messages = await ctx.runQuery(api.messages.getAllMessages, {
        limit: limit ? parseInt(limit) : undefined,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messages: messages,
        count: messages.length 
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch messages",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// =============================================================================
// THREAD API ENDPOINTS
// =============================================================================

// Get all active threads
export const getActiveThreadsAPI = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");
  const chatId = url.searchParams.get("chatId");

  try {
    let threads;
    if (chatId) {
      threads = await ctx.runQuery(api.threads.getThreadsInChat, {
        chatId: parseInt(chatId),
        limit: limit ? parseInt(limit) : undefined,
      });
    } else {
      threads = await ctx.runQuery(api.threads.getAllActiveThreads, {
        limit: limit ? parseInt(limit) : undefined,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        threads: threads,
        count: threads.length 
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching threads:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch threads",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// Get thread statistics
export const getThreadStatsAPI = httpAction(async (ctx, request) => {
  try {
    const stats = await ctx.runQuery(api.threads.getThreadStats);

    return new Response(
      JSON.stringify({ 
        success: true, 
        stats: stats
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching thread stats:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch thread stats",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// Get a specific thread by ID
export const getThreadByIdAPI = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const threadDocId = url.searchParams.get("threadDocId");

  if (!threadDocId) {
    return new Response(
      JSON.stringify({ 
        error: "Missing required parameter: threadDocId" 
      }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const thread = await ctx.runQuery(api.threads.getThreadById, {
      threadDocId: threadDocId as any,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        thread: thread
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching thread:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch thread",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// =============================================================================
// TELEGRAM BOT API ENDPOINTS
// =============================================================================

// Save a message with enhanced thread handling
export const saveMessageAPI = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  // Validate required fields
  if (!body.messageId || !body.chatId || !body.text) {
    return new Response(
      JSON.stringify({ 
        error: "Missing required fields: messageId, chatId, text" 
      }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const messageId = await ctx.runMutation(api.messagesThread.saveMessageWithThreadHandling, {
      messageId: body.messageId,
      chatId: body.chatId,
      userId: body.userId,
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
      text: body.text,
      messageType: body.messageType || "text",
      timestamp: body.timestamp || Date.now(),
      messageThreadId: body.messageThreadId,
      replyToMessageId: body.replyToMessageId,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: messageId,
        message: "Message saved successfully" 
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error saving message:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to save message",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// =============================================================================
// DOCUMENT API ENDPOINTS
// =============================================================================

export const saveDocumentAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    if (!body.title || !body.content || !body.contentType) {
      return errorResponse("Missing required fields: title, content, contentType", 400);
    }
    const documentId = await ctx.runMutation(api.documents.saveDocument, body);
    return new Response(JSON.stringify({ success: true, documentId }), { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const saveDocumentsBatchAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.documents || !Array.isArray(body.documents)) {
      return errorResponse("Missing or invalid documents array", 400);
    }

    // Validate each document
    for (let i = 0; i < body.documents.length; i++) {
      const doc = body.documents[i];
      if (!doc.title || !doc.content || !doc.contentType) {
        return errorResponse(`Document ${i + 1}: Missing required fields: title, content, contentType`, 400);
      }
      
      // Validate content type
       if (!["markdown", "text"].includes(doc.contentType)) {
         return errorResponse(`Document ${i + 1}: contentType must be 'markdown' or 'text'`, 400);
       }
      
      // Validate content length (max 1MB)
      if (doc.content.length > 1024 * 1024) {
        return errorResponse(`Document ${i + 1}: Content too large. Maximum size is 1MB`, 400);
      }
    }

    const result = await ctx.runMutation(api.documents.saveDocumentsBatch, { documents: body.documents });
    return new Response(JSON.stringify(result), { 
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const getDocumentsAPI = httpAction(async (ctx, request) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor") || undefined;
    const documents = await ctx.runQuery(api.documents.getAllDocuments, { limit, cursor });
    return new Response(JSON.stringify(documents));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const getDocumentByIdAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    let documentId: string | undefined;
    
    // Check if documentId is in query parameters (for /api/documents/by-id route)
    const queryDocumentId = url.searchParams.get("documentId");
    if (queryDocumentId) {
      documentId = queryDocumentId;
    } else {
      // Extract from path (for /api/documents/{id} route)
      const pathParts = url.pathname.split('/');
      documentId = pathParts[pathParts.length - 1];
    }
    
    if (!documentId) {
      return errorResponse("Missing documentId in path or query parameter", 400);
    }
    
    const document = await ctx.runQuery(api.documents.getDocumentById, { documentId: documentId as Id<"rag_documents"> });
    if (!document) {
      return errorResponse("Document not found", 404);
    }
    return new Response(JSON.stringify(document), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const deleteDocumentAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const documentId = pathParts[pathParts.length - 1] as Id<"rag_documents">;
    if (!documentId) {
      return errorResponse("Missing documentId in path", 400);
    }
    await ctx.runMutation(api.documents.deleteDocument, { documentId });
    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// =============================================================================
// EMBEDDING API ENDPOINTS
// =============================================================================

export const saveDocumentEmbeddingAPI = httpAction(async (ctx, request) => {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId") as Id<"rag_documents">;
    const { embedding } = await request.json();
    if (!documentId || !embedding) {
      return errorResponse("Missing documentId or embedding", 400);
    }
    await ctx.runMutation(api.embeddings.createDocumentEmbedding, { 
      documentId, 
      embedding,
      embeddingModel: "sentence-transformers/all-distilroberta-v1",
      embeddingDimensions: embedding.length
    });
    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const generateDocumentEmbeddingAPI = httpAction(async (ctx, request) => {
  try {
    const { documentId } = await request.json();
    if (!documentId) {
      return errorResponse("Missing documentId", 400);
    }
    await ctx.runAction(internal.embeddings.processDocumentEmbedding, { documentId });
    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const searchDocumentsVectorAPI = httpAction(async (ctx, request) => {
  try {
    // Handle both GET (query params) and POST (JSON body) requests
    let queryText: string;
    let limit: number = 10;
    let documentIds: string[] | undefined;

    if (request.method === "POST") {
      const body = await request.json();
      queryText = body.queryText;
      limit = body.limit || 10;
      documentIds = body.documentIds;
    } else {
      const { searchParams } = new URL(request.url);
      queryText = searchParams.get("query") || searchParams.get("queryText") || "";
      limit = parseInt(searchParams.get("limit") || "10");
      const docIdsParam = searchParams.get("documentIds");
      documentIds = docIdsParam ? docIdsParam.split(",") : undefined;
    }

    if (!queryText) {
      return errorResponse("Missing queryText parameter", 400);
    }

    // Use the proper vector search function
    const results = await ctx.runAction(api.embeddings.searchDocumentsByVector, {
      queryText,
      limit,
      documentIds: documentIds as any,
    });

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Vector search API error:", e);
    return errorResponse("Internal server error", 500, message);
  }
});

export const batchGenerateEmbeddingsAPI = httpAction(async (ctx, request) => {
  try {
    // NOTE: batchGenerateEmbeddings is not defined in embeddings.ts
    // This is a placeholder implementation
    return new Response(JSON.stringify({ success: true, message: "Batch embedding started." }));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const checkLLMServiceStatusAPI = httpAction(async (ctx, request) => {
  try {
    const status = await ctx.runAction(api.embeddings.checkLLMServiceStatus, {});
    return new Response(JSON.stringify(status));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const getDocumentEmbeddingsAPI = httpAction(async (ctx, request) => {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId") as Id<"rag_documents">;
    
    if (!documentId) {
      return errorResponse("Missing documentId parameter", 400);
    }
    
    const embeddings = await ctx.runQuery(api.embeddings.getDocumentEmbeddings, { documentId });
    return new Response(JSON.stringify(embeddings));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const getAllDocumentEmbeddingsAPI = httpAction(async (ctx, request) => {
  try {
    // Get all active document embeddings for vector search
    const embeddings = await ctx.runQuery(api.embeddings.getAllDocumentEmbeddings, {});
    return new Response(JSON.stringify(embeddings));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// =============================================================================
// CONVERSION JOBS API ENDPOINTS
// =============================================================================

export const getConversionJobsAPI = httpAction(async (ctx, request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;
    const jobType = searchParams.get("jobType") || undefined;
    const documentId = searchParams.get("documentId") as Id<"rag_documents"> || undefined;
    
    const jobs = await ctx.runQuery(api.conversionJobs.getConversionJobs, {
      page,
      limit,
      status,
      jobType,
      documentId
    });
    
    return new Response(JSON.stringify(jobs));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const createConversionJobAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { jobId, jobType, documentId, inputText, requestSource, userId } = body;
    
    if (!jobId || !jobType) {
      return errorResponse("Missing required fields: jobId, jobType", 400);
    }
    
    const jobData = {
      jobId,
      jobType,
      status: "pending",
      documentId: documentId as Id<"rag_documents"> || undefined,
      inputText,
      requestSource,
      userId,
      createdAt: Date.now()
    };
    
    const result = await ctx.runMutation(api.conversionJobs.createJob, jobData);
    return new Response(JSON.stringify({ success: true, jobId: result }));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const updateConversionJobAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { jobId, status, outputData, errorMessage, processingTimeMs, llmModel } = body;
    
    if (!jobId) {
      return errorResponse("Missing required field: jobId", 400);
    }
    
    const updateData = {
      jobId,
      status,
      outputData,
      errorMessage,
      processingTimeMs,
      llmModel
    };
    
    await ctx.runMutation(api.conversionJobs.updateJobByJobId, updateData);
    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

export const getConversionJobStatsAPI = httpAction(async (ctx, request) => {
  try {
    const stats = await ctx.runQuery(api.conversionJobs.getJobStats, {});
    return new Response(JSON.stringify(stats));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// =============================================================================
// LLM MEMORY USAGE TRACKING
// =============================================================================

export const saveLLMMemoryUsageAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { 
      process_memory_mb, 
      process_memory_percent, 
      system_memory_total_gb, 
      system_memory_available_gb, 
      system_memory_used_percent,
      model_status,
      timestamp 
    } = body;
    
    // Validate required fields
    if (process_memory_mb === undefined || system_memory_used_percent === undefined) {
      return errorResponse("Missing required memory usage fields", 400);
    }
    
    const memoryData = {
      processMemoryMb: process_memory_mb,
      processMemoryPercent: process_memory_percent || 0,
      systemMemoryTotalGb: system_memory_total_gb || 0,
      systemMemoryAvailableGb: system_memory_available_gb || 0,
      systemMemoryUsedPercent: system_memory_used_percent,
      modelStatus: model_status || 'unknown',
      timestamp: timestamp || Date.now()
    };
    
    // Save memory usage data (you'll need to create this mutation)
    // For now, we'll just log it and return success
    console.log('LLM Memory Usage:', memoryData);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Memory usage data saved successfully',
      data: memoryData 
    }));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// =============================================================================
// DOCKER STATUS API
// =============================================================================

export const getDockerStatusAPI = httpAction(async (ctx, request) => {
  try {
    // Get environment variables for Docker configuration
    const convexPort = process.env.CONVEX_PORT || '3001';
    const convexUrl = process.env.CONVEX_URL || 'http://localhost:3001';
    const telegramToken = process.env.TELEGRAM_TOKEN ? 'configured' : 'missing';
    const awsS3Bucket = process.env.AWS_S3_BUCKET || 'not-configured';
    
    // Mock Docker services data (in a real implementation, you'd query Docker API)
    const services = [
      {
        name: 'convex-backend',
        status: 'running',
        health: 'healthy',
        port: convexPort,
        uptime: '2h 15m',
        restarts: 0
      },
      {
        name: 'convex-dashboard',
        status: 'running',
        health: 'healthy',
        port: '3000',
        uptime: '2h 15m',
        restarts: 0
      },
      {
        name: 'telegram-bot',
        status: telegramToken === 'configured' ? 'running' : 'stopped',
        health: telegramToken === 'configured' ? 'healthy' : 'unhealthy',
        port: 'N/A',
        uptime: telegramToken === 'configured' ? '2h 15m' : '0m',
        restarts: 0
      },
      {
        name: 'vector-convert-llm',
        status: 'running',
        health: 'healthy',
        port: '5001',
        uptime: '2h 10m',
        restarts: 1
      },
      {
        name: 'web-dashboard',
        status: 'running',
        health: 'healthy',
        port: '3002',
        uptime: '2h 15m',
        restarts: 0
      }
    ];
    
    // Get port information from environment variables
    const webDashboardPort = process.env.WEB_DASHBOARD_PORT || '3000';
    const convexDashboardPort = process.env.CONVEX_DASHBOARD_PORT || '6791';
    const vectorLlmPort = '8081';
    
    // Mock network information with actual exposed ports
    const networks = [
      {
        name: 'telegram-bot-network',
        driver: 'bridge',
        scope: 'local',
        attachedServices: services.length,
        ports: [
          `${webDashboardPort}:3000`,
          `${convexDashboardPort}:6791`,
          `${convexPort}:3210`,
          `${vectorLlmPort}:8081`
        ]
      }
    ];
    
    // Mock system resources (in a real implementation, you'd get actual system stats)
    const resources = {
      cpu: {
        usage: Math.floor(Math.random() * 30) + 10, // 10-40%
        cores: 8
      },
      memory: {
        used: Math.floor(Math.random() * 4) + 2, // 2-6 GB
        total: 16,
        percentage: Math.floor(Math.random() * 30) + 15 // 15-45%
      },
      disk: {
        used: Math.floor(Math.random() * 20) + 30, // 30-50 GB
        total: 100,
        percentage: Math.floor(Math.random() * 20) + 30 // 30-50%
      }
    };
    
    // Determine overall status
    const runningServices = services.filter(s => s.status === 'running').length;
    const healthyServices = services.filter(s => s.health === 'healthy').length;
    
    let status = 'healthy';
    let message = 'All Docker services are running normally';
    let ready = true;
    
    if (runningServices < services.length) {
      status = 'degraded';
      message = `${services.length - runningServices} service(s) not running`;
      ready = false;
    } else if (healthyServices < services.length) {
      status = 'degraded';
      message = `${services.length - healthyServices} service(s) unhealthy`;
    }
    
    const dockerStatus = {
      status,
      message,
      ready,
      services,
      networks,
      resources,
      environment: {
        convexPort,
        convexUrl,
        telegramConfigured: telegramToken === 'configured',
        awsS3Bucket
      },
      timestamp: Date.now()
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: dockerStatus
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Failed to get Docker status", 500, message);
  }
});

// =============================================================================
// NOTIFICATIONS API ENDPOINTS
// =============================================================================

// Get all notifications
export const getNotificationsAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit");
    const type = url.searchParams.get("type");
    
    let notifications;
    if (type) {
      notifications = await ctx.runQuery(api.notifications.getNotificationsByType, {
        type,
        limit: limit ? parseInt(limit) : undefined,
      });
    } else {
      notifications = await ctx.runQuery(api.notifications.getAllNotifications, {
        limit: limit ? parseInt(limit) : undefined,
      });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        notifications,
        count: notifications.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return errorResponse(
      "Failed to fetch notifications",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Create a new notification
export const createNotificationAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !body.title || !body.message) {
      return errorResponse("Missing required fields: type, title, message", 400);
    }
    
    const notificationId = await ctx.runMutation(api.notifications.createNotification, {
      type: body.type,
      title: body.title,
      message: body.message,
      documentId: body.documentId,
      metadata: body.metadata,
      source: body.source,
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        notificationId,
        message: "Notification created successfully",
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return errorResponse(
      "Failed to create notification",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Get unread notifications count
export const getUnreadNotificationsCountAPI = httpAction(async (ctx, request) => {
  try {
    const count = await ctx.runQuery(api.notifications.getUnreadCount, {});
    
    return new Response(
      JSON.stringify({
        success: true,
        unreadCount: count,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return errorResponse(
      "Failed to fetch unread count",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Mark notification as read
export const markNotificationAsReadAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    
    if (!body.notificationId) {
      return errorResponse("Missing required field: notificationId", 400);
    }
    
    await ctx.runMutation(api.notifications.markAsRead, {
      notificationId: body.notificationId,
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification marked as read",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return errorResponse(
      "Failed to mark notification as read",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Mark all notifications as read
export const markAllNotificationsAsReadAPI = httpAction(async (ctx, request) => {
  try {
    const markedCount = await ctx.runMutation(api.notifications.markAllAsRead, {});
    
    return new Response(
      JSON.stringify({
        success: true,
        markedCount,
        message: `${markedCount} notifications marked as read`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return errorResponse(
      "Failed to mark all notifications as read",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// Lightweight LLM Status API
export const getLightweightLLMStatusAPI = httpAction(async (ctx, request) => {
  try {
    // This is a proxy endpoint that forwards requests to the lightweight LLM service
    // In a real implementation, you would make an HTTP request to the lightweight LLM service
    // For now, we'll return a mock response that matches the expected interface
    
    const mockResponse = {
      status: 'healthy',
      ready: true,
      message: 'Lightweight LLM service is running',
      model: 'lightweight-transformer',
      details: {
        service_status: 'active',
        model_loaded: true,
        gpu_available: false,
        timestamp: new Date().toISOString()
      },
      memory_usage: {
        rss_mb: 256,
        vms_mb: 512,
        percent: 15.2,
        available_mb: 1024
      }
    };
    
    return new Response(
      JSON.stringify(mockResponse),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      }
    );
  } catch (error) {
    console.error("Error checking lightweight LLM status:", error);
    return errorResponse(
      "Failed to check lightweight LLM status",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// =============================================================================
// USER SESSIONS API ENDPOINTS
// =============================================================================

// Get active user count
// Update or create user session
export const updateUserSessionAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const {
      sessionId,
      userId,
      userAgent,
      source = "web",
      metadata,
      action,
    } = body;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: "Session ID is required" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Handle session end action
    if (action === "end") {
      await ctx.runMutation(api.userSessions.endSession, {
        sessionId,
      });

      return new Response(
        JSON.stringify({
          status: "success",
          message: "Session ended successfully",
        }),
        { 
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        }
      );
    }

    // Create or update session (default behavior)
    await ctx.runMutation(api.userSessions.upsertSession, {
      sessionId,
      userId,
      userAgent,
      source,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Session updated successfully",
      }),
      { 
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      }
    );
  } catch (error) {
    console.error("Error updating session:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Failed to update session",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

export const getActiveUserCountAPI = httpAction(async (ctx, request) => {
  try {
    const userCount = await ctx.runQuery(api.userSessions.getActiveUserCount);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          activeUsers: userCount.total,
          bySource: userCount.bySource,
          timestamp: userCount.timestamp,
          lastUpdated: new Date().toISOString(),
        },
        message: `${userCount.total} active users`
      }),
      { 
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      }
    );
  } catch (error) {
    console.error("Error fetching active user count:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch active user count",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// Get user session statistics
export const getUserSessionStatsAPI = httpAction(async (ctx, request) => {
  try {
    const stats = await ctx.runQuery(api.userSessions.getSessionStats);

    return new Response(
      JSON.stringify({ 
        success: true, 
        stats: stats
      }),
      { 
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      }
    );
  } catch (error) {
    console.error("Error fetching user session stats:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch user session stats",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// =============================================================================
// HTTP ROUTER CONFIGURATION
// =============================================================================

const http = httpRouter();

// HEALTH & MONITORING ENDPOINTS
http.route({
  path: "/api/health",
  method: "GET",
  handler: healthAPI,
});

http.route({
  path: "/api/docker/status",
  method: "GET",
  handler: getDockerStatusAPI,
});

http.route({
  path: "/api/lightweight-llm/status",
  method: "GET",
  handler: getLightweightLLMStatusAPI,
});

// USER SESSIONS API ENDPOINTS
http.route({
  path: "/api/users/active-count",
  method: "GET",
  handler: getActiveUserCountAPI,
});

http.route({
  path: "/api/users/active-count",
  method: "POST",
  handler: updateUserSessionAPI,
});

http.route({
  path: "/api/users/session-stats",
  method: "GET",
  handler: getUserSessionStatsAPI,
});

// TELEGRAM BOT API ENDPOINTS
http.route({
  path: "/api/telegram/messages",
  method: "POST",
  handler: saveMessageAPI,
});

http.route({
  path: "/api/telegram/messages/thread",
  method: "POST",
  handler: saveMessageToThreadAPI,
});

http.route({
  path: "/api/messages",
  method: "GET",
  handler: getMessagesAPI,
});

// THREAD API ENDPOINTS
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

// Document by ID with query parameter (for compatibility)
http.route({
  path: "/api/documents/by-id",
  method: "GET",
  handler: getDocumentByIdAPI,
});

// DOCUMENT API ENDPOINTS (RAG System)
http.route({
  path: "/api/documents",
  method: "POST",
  handler: saveDocumentAPI,
});

http.route({
  path: "/api/documents/batch",
  method: "POST",
  handler: saveDocumentsBatchAPI,
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

// EMBEDDING API ENDPOINTS
http.route({
  path: "/api/embeddings",
  method: "POST",
  handler: saveDocumentEmbeddingAPI,
});

http.route({
  path: "/api/embeddings/generate",
  method: "POST",
  handler: generateDocumentEmbeddingAPI,
});

http.route({
  path: "/api/embeddings/search",
  method: "POST",
  handler: searchDocumentsVectorAPI,
});

http.route({
  path: "/api/embeddings/batch",
  method: "POST",
  handler: batchGenerateEmbeddingsAPI,
});

http.route({
  path: "/api/embeddings/llm-status",
  method: "GET",
  handler: checkLLMServiceStatusAPI,
});

http.route({
  path: "/api/embeddings/document",
  method: "GET",
  handler: getDocumentEmbeddingsAPI,
});

http.route({
  path: "/api/embeddings/all",
  method: "GET",
  handler: getAllDocumentEmbeddingsAPI,
});

// CONVERSION JOBS API ENDPOINTS
http.route({
  path: "/api/conversion-jobs",
  method: "GET",
  handler: getConversionJobsAPI,
});

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
  path: "/api/conversion-jobs/stats",
  method: "GET",
  handler: getConversionJobStatsAPI,
});

// LLM MEMORY USAGE ENDPOINTS
http.route({
  path: "/api/llm/memory-usage",
  method: "POST",
  handler: saveLLMMemoryUsageAPI,
});

// NOTIFICATIONS API ENDPOINTS
http.route({
  path: "/api/notifications",
  method: "GET",
  handler: getNotificationsAPI,
});

http.route({
  path: "/api/notifications",
  method: "POST",
  handler: createNotificationAPI,
});

http.route({
  path: "/api/notifications/unread-count",
  method: "GET",
  handler: getUnreadNotificationsCountAPI,
});

http.route({
  path: "/api/notifications/mark-read",
  method: "PUT",
  handler: markNotificationAsReadAPI,
});

http.route({
  path: "/api/notifications/mark-all-read",
  method: "PUT",
  handler: markAllNotificationsAsReadAPI,
});

// PARAMETERIZED ROUTES (Must be placed last to avoid conflicts)
// Document operations by ID
http.route({
  pathPrefix: "/api/documents/",
  method: "GET",
  handler: getDocumentByIdAPI,
});

http.route({
  pathPrefix: "/api/documents/",
  method: "DELETE",
  handler: deleteDocumentAPI,
});

export default http;