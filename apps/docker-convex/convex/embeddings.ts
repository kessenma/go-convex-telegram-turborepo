import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper function types and implementations (plain TypeScript, not Convex mutations/queries)
export type CreateDocumentEmbeddingInput = {
  documentId: string;
  embedding: number[];
  embeddingModel: string;
  embeddingDimensions: number;
  chunkText?: string;
  chunkIndex?: number;
  processingTimeMs?: number;
};

export async function createDocumentEmbeddingFromDb(ctx: any, args: CreateDocumentEmbeddingInput) {
  const document = await ctx.db.get(args.documentId);
  if (!document) {
    throw new Error(`Document not found: ${args.documentId}`);
  }
  const embeddingId = await ctx.db.insert("document_embeddings", {
    documentId: args.documentId,
    embedding: args.embedding,
    embeddingModel: args.embeddingModel,
    embeddingDimensions: args.embeddingDimensions,
    chunkText: args.chunkText,
    chunkIndex: args.chunkIndex,
    processingTimeMs: args.processingTimeMs,
    isActive: true,
    createdAt: Date.now(),
  });
  await ctx.db.patch(args.documentId, {
    hasEmbedding: true,
    lastModified: Date.now(),
  });
  return embeddingId;
}

export type GetDocumentEmbeddingsInput = {
  documentId: string;
};

export async function getDocumentEmbeddingsFromDb(ctx: any, args: GetDocumentEmbeddingsInput) {
  return await ctx.db
    .query("document_embeddings")
    .withIndex("by_document", (q: any) => q.eq("documentId", args.documentId))
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .collect();
}

export type GetAllDocumentEmbeddingsInput = {};

export async function getAllDocumentEmbeddingsFromDb(ctx: any, args: GetAllDocumentEmbeddingsInput) {
  return await ctx.db
    .query("document_embeddings")
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .collect();
}

export type GetAllEmbeddingsForAtlasInput = {
  limit?: number;
  offset?: number;
};

export async function getAllEmbeddingsForAtlasFromDb(ctx: any, args: GetAllEmbeddingsForAtlasInput) {
  const limit = Math.min(args.limit || 100, 500);
  const offset = args.offset || 0;
  const allEmbeddings = await ctx.db
    .query("document_embeddings")
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .order("desc")
    .collect();
  const embeddings = allEmbeddings.slice(offset, offset + limit);
  // Enrich with document metadata
  const enrichedEmbeddings = await Promise.all(
    embeddings.map(async (embedding: any) => {
      const document = await ctx.db.get(embedding.documentId);
      return {
        ...embedding,
        documentTitle: document?.title || "Unknown Document",
        documentContentType: document?.contentType || "unknown",
        documentUploadedAt: document?.uploadedAt || 0,
      };
    })
  );

  return enrichedEmbeddings;
}

// Removed getDocumentInternal to avoid circular dependencies
// Use internal.shared.getDocumentByIdInternal instead

export const getEmbeddingByIdInternal = internalQuery({
  args: {
    embeddingId: v.id("document_embeddings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.embeddingId);
  },
});

export const getDocumentEmbeddingsInternal = internalQuery({
  args: {
    documentId: v.id("rag_documents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("document_embeddings")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
  },
});

export const createErrorNotification = internalMutation({
  args: {
    documentId: v.id("rag_documents"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      type: "document_embedding_error",
      title: "Embedding Failed",
      message: `Failed to generate embeddings for document: ${args.error}`,
      timestamp: Date.now(),
      isRead: false,
      documentId: args.documentId,
      metadata: JSON.stringify({
        error: args.error,
        timestamp: Date.now()
      }),
      source: "system"
    });
  },
});

export const generateEmbedding = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:7999";
      const response = await fetch(`${vectorServiceUrl}/embed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: args.text,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vector service error: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      return result.embeddings;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  },
});

export const generateEmbeddingInternal = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:7999";
      const response = await fetch(`${vectorServiceUrl}/embed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: args.text,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vector service error: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      return result.embeddings;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  },
});

export const createDocumentEmbedding = mutation({
  args: {
    documentId: v.id("rag_documents"),
    embedding: v.array(v.number()),
    embeddingModel: v.string(),
    embeddingDimensions: v.number(),
    chunkText: v.optional(v.string()),
    chunkIndex: v.optional(v.number()),
    processingTimeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return createDocumentEmbeddingFromDb(ctx, args);
  },
});

export const getDocumentEmbeddings = query({
  args: {
    documentId: v.id("rag_documents"),
  },
  handler: async (ctx, args) => {
    return getDocumentEmbeddingsFromDb(ctx, args);
  },
});

export const getEmbeddingById = query({
  args: {
    embeddingId: v.id("document_embeddings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.embeddingId);
  },
});

export const getAllDocumentEmbeddings = query({
  args: {},
  handler: async (ctx, _args) => {
    return getAllDocumentEmbeddingsFromDb(ctx, _args);
  },
});

export const getAllEmbeddingsForAtlas = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return getAllEmbeddingsForAtlasFromDb(ctx, args);
  },
});

// Get total count of active embeddings
export const getEmbeddingsCount = query({
  args: {},
  handler: async (ctx) => {
    const embeddings = await ctx.db
      .query("document_embeddings")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return embeddings.length;
  },
});

// Get basic embeddings data for Atlas (avoiding type issues)
export const getBasicEmbeddingsForAtlas = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 100, 500);
    const offset = args.offset || 0;
    
    // Get all active embeddings
    const allEmbeddings = await ctx.db
      .query("document_embeddings")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
    
    // Apply pagination and return basic data
    const paginatedEmbeddings = allEmbeddings.slice(offset, offset + limit);
    
    // Return basic embedding data without complex enrichment to avoid type issues
    return paginatedEmbeddings.map((embedding) => ({
      _id: embedding._id,
      documentId: embedding.documentId,
      embedding: embedding.embedding,
      embeddingModel: embedding.embeddingModel,
      embeddingDimensions: embedding.embeddingDimensions,
      chunkText: embedding.chunkText,
      chunkIndex: embedding.chunkIndex,
      createdAt: embedding.createdAt,
      isActive: embedding.isActive,
      // Add placeholder document info that can be enriched on the frontend
      documentTitle: "Loading...",
      documentContentType: "unknown",
      documentUploadedAt: 0,
    }));
  },
});

// Delete all embeddings for a document
export const deleteDocumentEmbeddings = mutation({
  args: {
    documentId: v.id("rag_documents"),
  },
  handler: async (ctx, args) => {
    // Get all embeddings for this document
    const embeddings = await ctx.db
      .query("document_embeddings")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Soft delete all embeddings by setting isActive to false
    const deletePromises = embeddings.map(embedding => 
      ctx.db.patch(embedding._id, {
        isActive: false,
      })
    );

    await Promise.all(deletePromises);

    console.log(`Deleted ${embeddings.length} embeddings for document ${args.documentId}`);
    return { deletedCount: embeddings.length };
  },
});

// Process document with chunking
export const processDocumentWithChunking = action({
  args: {
    documentId: v.id("rag_documents"),
    maxChunkSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Get the vector-convert-llm service URL from environment
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:7999";
      
      // Call the document processing endpoint
      // The vector service will fetch the document data itself via Convex API
      const response = await fetch(`${vectorServiceUrl}/process-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: args.documentId,
          convex_url: process.env.CONVEX_URL || "http://convex-backend:3211",
          use_chunking: true,
          chunk_size: args.maxChunkSize || 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vector service error: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error processing document:", error);
      throw error;
    }
  },
});

// Process document embedding (internal)
export const processDocumentEmbedding = internalAction({
  args: {
    documentId: v.id("rag_documents"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; documentId: Id<"rag_documents">; embeddingDimensions?: number }> => {
    console.log(`🚀 Starting embedding processing for document: ${args.documentId}`);
    
    try {
      // Get the vector-convert-llm service URL from environment
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:7999";
      const convexUrl = process.env.CONVEX_URL || "http://convex-backend:3211";
      
      console.log(`📡 Calling vector service at: ${vectorServiceUrl}/process-document`);
      console.log(`🔗 Convex URL: ${convexUrl}`);
      
      // Call the document processing endpoint with chunking
      // The vector service will fetch the document data itself via Convex API
      const response = await fetch(`${vectorServiceUrl}/process-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: args.documentId,
          convex_url: convexUrl,
          use_chunking: true,
          chunk_size: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Vector service error: ${response.status} ${errorText}`);
        throw new Error(`Vector service error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Embedding processing completed successfully for document: ${args.documentId}`);
      console.log(`📊 Result:`, result);
      
      return {
        success: true,
        documentId: args.documentId,
        embeddingDimensions: result.embedding_dimension,
      };
    } catch (error) {
      console.error(`❌ Error processing document embedding for ${args.documentId}:`, error);
      
      // Create error notification (disabled - RAG functionality not in use)
      // try {
      //   await ctx.runMutation(internal.embeddings.createErrorNotification, {
      //     documentId: args.documentId,
      //     error: error instanceof Error ? error.message : 'Unknown error'
      //   });
      // } catch (notificationError) {
      //   console.error("Failed to create error notification:", notificationError);
      // }
      
      return {
        success: false,
        documentId: args.documentId,
      };
    }
  },
});

// Check LLM service status
export const checkLLMServiceStatus = action({
  args: {},
  handler: async (_ctx) => {
    try {
      // Get the vector-convert-llm service URL from environment
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:7999";
      
      // Call the health check endpoint
      const response = await fetch(`${vectorServiceUrl}/health`);
      
      if (!response.ok) {
        return {
          status: "error",
          message: `Service returned status ${response.status}`,
          ready: false,
        };
      }
      
      const healthData = await response.json();
      return {
        status: healthData.status || "unknown",
        message: healthData.message || "Service status unknown",
        ready: healthData.ready || false,
        model: healthData.model,
        memory_usage: healthData.memory_usage,
      };
    } catch (error) {
      console.error("Error checking LLM service status:", error);
      return {
        status: "error",
        message: `Failed to connect to service: ${error}`,
        ready: false,
      };
    }
  },
});

// Trigger embedding for a document (public action)
export const triggerDocumentEmbedding = action({
  args: {
    documentId: v.id("rag_documents"),
  },
  handler: async (ctx, args) => {
    console.log(`🚀 Triggering embedding for document: ${args.documentId}`);
    
    try {
      // Get the vector-convert-llm service URL from environment
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:7999";
      const convexUrl = process.env.CONVEX_URL || "http://convex-backend:3211";
      
      console.log(`📡 Calling vector service at: ${vectorServiceUrl}/process-document`);
      console.log(`🔗 Convex URL: ${convexUrl}`);
      
      // Call the document processing endpoint with chunking
      const response = await fetch(`${vectorServiceUrl}/process-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: args.documentId,
          convex_url: convexUrl,
          use_chunking: true,
          chunk_size: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Vector service error: ${response.status} ${errorText}`);
        throw new Error(`Vector service error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Embedding processing completed successfully for document: ${args.documentId}`);
      console.log(`📊 Result:`, result);
      
      return {
        success: true,
        documentId: args.documentId,
        embeddingDimensions: result.embedding_dimension,
      };
    } catch (error) {
      console.error(`❌ Error processing document embedding for ${args.documentId}:`, error);
      
      return {
        success: false,
        documentId: args.documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});