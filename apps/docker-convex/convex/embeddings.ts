import { action, internalAction, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getDocumentById } from "./documents";

// Constants
const VECTOR_SEARCH_LIMIT = 10;
const VECTOR_DIMENSIONS = 384; // all-MiniLM-L6-v2 model

// Types
interface EmbeddingResult {
  _id: Id<"document_embeddings">;
  documentId: Id<"rag_documents">;
  chunkText?: string;
  chunkIndex?: number;
  _score: number;
  document: any;
}

// Internal helper to get document by ID
export const getDocumentInternal = internalQuery({
  args: {
    documentId: v.id("rag_documents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
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
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:8081";
      
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

// Process document with chunking
export const processDocumentWithChunking = action({
  args: {
    documentId: v.id("rag_documents"),
    maxChunkSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Get the document
      const document = await ctx.runQuery(api.documents.getDocumentById, {
        documentId: args.documentId,
      });

      if (!document) {
        throw new Error(`Document not found: ${args.documentId}`);
      }

      // Get the vector-convert-llm service URL from environment
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:8081";
      
      // Call the document processing endpoint
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
  handler: async (ctx, args): Promise<{ success: boolean; documentId: Id<"rag_documents">; embeddingDimensions: number }> => {
    try {
      // Get the document
      const document: any = await ctx.runQuery(internal.embeddings.getDocumentInternal, {
        documentId: args.documentId,
      });

      if (!document) {
        throw new Error(`Document not found: ${args.documentId}`);
      }

      // Generate embedding
      const embedding: number[] = await ctx.runAction(api.embeddings.generateEmbedding, {
        text: document.content,
      });

      // Save embedding
      await ctx.runMutation(api.embeddings.createDocumentEmbedding, {
        documentId: args.documentId,
        embedding,
        embeddingModel: "all-MiniLM-L6-v2",
        embeddingDimensions: embedding.length,
      });

      return {
        success: true,
        documentId: args.documentId,
        embeddingDimensions: embedding.length,
      };
    } catch (error) {
      console.error("Error processing document embedding:", error);
      throw error;
    }
  },
});

// Check LLM service status
export const checkLLMServiceStatus = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Get the vector-convert-llm service URL from environment
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:8081";
      
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

// Search documents by vector similarity
export const searchDocumentsByVector = action({
  args: {
    queryText: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Generate embedding for the query
      const queryEmbedding = await ctx.runAction(api.embeddings.generateEmbedding, {
        text: args.queryText,
      });
      
      // Perform vector search
      const searchResults = await ctx.vectorSearch("document_embeddings", "by_embedding", {
        vector: queryEmbedding,
        limit: args.limit || VECTOR_SEARCH_LIMIT,
        filter: (q) => q.eq("isActive", true),
      });
      
      // Get document details for each result
      const results: EmbeddingResult[] = await Promise.all(
        searchResults.map(async (result: any) => {
          const document = await ctx.runQuery(internal.embeddings.getDocumentInternal, {
            documentId: result.documentId,
          });
          
          return {
            ...result,
            document,
          };
        })
      );
      
      return results.filter(result => result.document && result.document.isActive);
    } catch (error) {
      console.error("Error searching documents by vector:", error);
      throw error;
    }
  },
});