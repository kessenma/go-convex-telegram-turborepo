import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";



// Removed getDocumentInternal to avoid circular dependencies
// Use internal.shared.getDocumentByIdInternal instead

// Internal helper to get embedding by ID
export const getEmbeddingByIdInternal = internalQuery({
  args: {
    embeddingId: v.id("document_embeddings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.embeddingId);
  },
});

// Internal helper to get document embeddings
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

// Internal helper to create error notifications
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

// Generate embedding using the vector-convert-llm service
export const generateEmbedding = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get the vector-convert-llm service URL from environment
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:7999";
      
      // Call the embedding service
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

// Internal embedding generation to avoid circular dependencies
export const generateEmbeddingInternal = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get the vector-convert-llm service URL from environment
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:7999";
      
      // Call the embedding service
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

// Create document embedding
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
    // Check if document exists
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error(`Document not found: ${args.documentId}`);
    }

    // Create embedding
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

    // Update document to indicate it has an embedding
    await ctx.db.patch(args.documentId, {
      hasEmbedding: true,
      lastModified: Date.now(),
    });

    return embeddingId;
  },
});

// Get document embeddings
export const getDocumentEmbeddings = query({
  args: {
    documentId: v.id("rag_documents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("document_embeddings")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get embedding by ID
export const getEmbeddingById = query({
  args: {
    embeddingId: v.id("document_embeddings"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.embeddingId);
  },
});

// Get all document embeddings
export const getAllDocumentEmbeddings = query({
  args: {},
  handler: async (ctx, _args) => {
    return await ctx.db
      .query("document_embeddings")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get embeddings with document metadata for Embedding Atlas
export const getAllEmbeddingsForAtlas = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 100, 500); // Cap at 500 for performance
    const offset = args.offset || 0;
    
    // Get embeddings with document data using pagination
    const allEmbeddings = await ctx.db
      .query("document_embeddings")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
    
    // Apply pagination manually since Convex doesn't have native offset support
    const embeddings = allEmbeddings.slice(offset, offset + limit);

    // Enrich with document metadata
    const enrichedEmbeddings = await Promise.all(
      embeddings.map(async (embedding) => {
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
    try {
      // Get the vector-convert-llm service URL from environment
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:7999";
      const convexUrl = process.env.CONVEX_URL || "http://convex-backend:3211";
      
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
        throw new Error(`Vector service error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        documentId: args.documentId,
        embeddingDimensions: result.embedding_dimension,
      };
    } catch (error) {
      console.error("Error processing document embedding:", error);
      
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