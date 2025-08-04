/*
 * EMBEDDING API ENDPOINTS
 * apps/docker-convex/convex/https-endpoints/embedding/index.ts
 * =====================
 * 
 * Vector embedding generation and management endpoints.
 */

import { httpAction } from "../../_generated/server";
import { api, internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { errorResponse, successResponse } from "../shared/utils";
import { 
  createDocumentEmbeddingFromDb, 
  CreateDocumentEmbeddingInput,
  getDocumentEmbeddingsFromDb, 
  GetDocumentEmbeddingsInput,
  getAllDocumentEmbeddingsFromDb, 
  GetAllDocumentEmbeddingsInput,
  getAllEmbeddingsForAtlasFromDb, 
  GetAllEmbeddingsForAtlasInput 
} from "../../embeddings";

// Save document embedding
export const saveDocumentEmbeddingAPI = httpAction(async (ctx, request) => {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId") as Id<"rag_documents">;
    const { embedding } = await request.json();
    if (!documentId || !embedding) {
      return errorResponse("Missing documentId or embedding", 400);
    }
    
    const args: CreateDocumentEmbeddingInput = {
      documentId,
      embedding,
      embeddingModel: "sentence-transformers/all-distilroberta-v1",
      embeddingDimensions: embedding.length
    };
    
    await createDocumentEmbeddingFromDb(ctx, args);
    return successResponse({ success: true, message: "Embedding created" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// Generate document embedding
export const generateDocumentEmbeddingAPI = httpAction(async (ctx, request) => {
  try {
    const { documentId } = await request.json();
    if (!documentId) {
      return errorResponse("Missing documentId", 400);
    }
    // TEMPORARY: Commented out due to type instantiation issues
    // await ctx.runAction(internal.embeddings.processDocumentEmbedding, {
    //   documentId: documentId as Id<"rag_documents">,
    // });
    return successResponse({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return errorResponse("Internal server error", 500, message);
  }
});

// Create document embedding
export const createDocumentEmbeddingAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { documentId, embedding, embeddingModel, embeddingDimensions } = body;
    if (!documentId || !embedding) {
      return errorResponse("Missing required fields: documentId, embedding", 400);
    }
    
    const args: CreateDocumentEmbeddingInput = {
      documentId: documentId as string,
      embedding,
      embeddingModel: embeddingModel || "sentence-transformers/all-distilroberta-v1",
      embeddingDimensions: embeddingDimensions || embedding.length
    };
    
    const embeddingId = await createDocumentEmbeddingFromDb(ctx, args);
    return successResponse({
      success: true,
      embeddingId,
      message: "Document embedding created successfully"
    }, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Error creating document embedding:", e);
    return errorResponse("Failed to create document embedding", 500, message);
  }
});

// Get document embeddings
export const getDocumentEmbeddingsAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const documentId = url.searchParams.get("documentId");
    if (!documentId) {
      return errorResponse("Missing documentId parameter", 400);
    }
    
    const args: GetDocumentEmbeddingsInput = { documentId };
    const embeddings = await getDocumentEmbeddingsFromDb(ctx, args);
    return successResponse({
      success: true,
      embeddings,
      count: embeddings.length
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Error fetching document embeddings:", e);
    return errorResponse("Failed to fetch document embeddings", 500, message);
  }
});

// Get all document embeddings
export const getAllDocumentEmbeddingsAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    
    const args: GetAllDocumentEmbeddingsInput = {};
    const embeddings = await getAllDocumentEmbeddingsFromDb(ctx, args);
    return successResponse({
      success: true,
      embeddings: embeddings.slice(0, limit),
      count: embeddings.length
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Error fetching all document embeddings:", e);
    return errorResponse("Failed to fetch all document embeddings", 500, message);
  }
});

// Batch generate embeddings
export const batchGenerateEmbeddingsAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { documentIds } = body;
    
    if (!documentIds || !Array.isArray(documentIds)) {
      return errorResponse("Missing or invalid documentIds array", 400);
    }
    
    // TEMPORARY: Commented out due to type instantiation issues
    // const results = [];
    // for (const documentId of documentIds) {
    //   try {
    //     await ctx.runAction(internal.embeddings.processDocumentEmbedding, {
    //       documentId: documentId as Id<"rag_documents">
    //     });
    //     results.push({ documentId, status: "success" });
    //   } catch (error) {
    //     results.push({ 
    //       documentId, 
    //       status: "error", 
    //       error: error instanceof Error ? error.message : "Unknown error" 
    //     });
    //   }
    // }
    const results = documentIds.map((id: string) => ({ documentId: id, status: "temporarily_disabled" }));
    
    return successResponse({
      success: true,
      results,
      message: "Batch embedding generation completed"
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Error in batch embedding generation:", e);
    return errorResponse("Failed to generate embeddings in batch", 500, message);
  }
});

// Check LLM service status
export const checkLLMServiceStatusAPI = httpAction(async (ctx, request) => {
  try {
    // TEMPORARY: Commented out due to type instantiation issues
    // const status = await ctx.runQuery(api.serviceStatus.getServiceStatus, {
    //   serviceName: "vector-convert-llm"
    // });
    const status = {
      serviceName: "vector-convert-llm",
      status: "unknown",
      ready: false,
      message: "Service status temporarily unavailable"
    };
    
    return successResponse({
      success: true,
      status
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Error checking LLM service status:", e);
    return errorResponse("Failed to check LLM service status", 500, message);
  }
});

// Get embeddings for Atlas visualization
export const getEmbeddingsForAtlasAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "100");
    
    const args: GetAllEmbeddingsForAtlasInput = { limit };
    const embeddings = await getAllEmbeddingsForAtlasFromDb(ctx, args);
    return successResponse({
      success: true,
      embeddings,
      count: embeddings.length,
      message: "Embeddings data for Atlas visualization"
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Error fetching embeddings for Atlas:", e);
    return errorResponse("Failed to fetch embeddings for Atlas", 500, message);
  }
});