import { action, internalAction, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Constants
const VECTOR_SEARCH_LIMIT = 10;

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
      // Get the document
      const document = await ctx.runQuery(api.documents.getDocumentById, {
        documentId: args.documentId,
      });

      if (!document) {
        throw new Error(`Document not found: ${args.documentId}`);
      }

      // Get the vector-convert-llm service URL from environment
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:7999";
      
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
  handler: async (ctx, args): Promise<{ success: boolean; documentId: Id<"rag_documents">; embeddingDimensions?: number }> => {
    try {
      // Get the document
      const document: any = await ctx.runQuery(internal.embeddings.getDocumentInternal, {
        documentId: args.documentId,
      });

      if (!document) {
        throw new Error(`Document not found: ${args.documentId}`);
      }

      // Get the vector-convert-llm service URL from environment
      const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || "http://vector-convert-llm:7999";
      const convexUrl = process.env.CONVEX_URL || "http://convex-backend:3211";
      
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
      
      // Create error notification
      try {
        await ctx.runMutation(api.notifications.createNotification, {
          type: "document_embedding_error",
          title: "Embedding Failed",
          message: `Failed to generate embeddings for document: ${error instanceof Error ? error.message : 'Unknown error'}`,
          documentId: args.documentId,
          metadata: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
          }),
          source: "system"
        });
      } catch (notificationError) {
        console.error("Failed to create error notification:", notificationError);
      }
      
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

// Search documents by vector similarity with enhanced chunk support
export const searchDocumentsByVector = action({
  args: {
    queryText: v.string(),
    limit: v.optional(v.number()),
    documentIds: v.optional(v.array(v.id("rag_documents"))),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`Starting vector search for query: "${args.queryText}"`);
      console.log(`Document filter: ${args.documentIds ? args.documentIds.length + ' documents' : 'all documents'}`);
      
      // Generate embedding for the query
      const queryEmbedding = await ctx.runAction(api.embeddings.generateEmbedding, {
        text: args.queryText,
      });
      
      console.log(`Generated query embedding with ${queryEmbedding.length} dimensions`);
      
      // Build filter for vector search - use simple filter only
      const filter = (q: any) => q.eq("isActive", true);
      
      console.log("Using simple isActive filter for vector search");
      
      // Perform vector search with higher limit to get more candidates
      const searchLimit = Math.min((args.limit || VECTOR_SEARCH_LIMIT) * 4, 100);
      const searchResults = await ctx.vectorSearch("document_embeddings", "by_embedding", {
        vector: queryEmbedding,
        limit: searchLimit,
        filter,
      });
      
      console.log(`Vector search found ${searchResults.length} embedding results`);
      
      // Get document details for each result and enhance with chunk information
      const results: (EmbeddingResult & { 
        isChunkResult: boolean; 
        chunkIndex?: number; 
        chunkText?: string;
        expandedContext?: string;
      })[] = await Promise.all(
        searchResults.map(async (result: any) => {
          // Check if result has documentId
          if (!result.documentId) {
            console.warn('Vector search result missing documentId:', result);
            return null;
          }
          
          const document = await ctx.runQuery(internal.embeddings.getDocumentInternal, {
            documentId: result.documentId,
          });
          
          // Get the embedding record to access chunk information
          const embeddingRecord = await ctx.runQuery(api.embeddings.getEmbeddingById, {
            embeddingId: result._id,
          });
          
          // Check if this is a chunk-based result
          const isChunkResult = embeddingRecord?.chunkIndex !== undefined && embeddingRecord?.chunkText;
          
          let expandedContext = "";
          if (isChunkResult && embeddingRecord?.chunkText) {
            // For chunk results, try to get surrounding context
            try {
              const allChunks = await ctx.runQuery(api.embeddings.getDocumentEmbeddings, {
                documentId: result.documentId,
              });
              
              // Sort chunks by index and get surrounding chunks (±1 chunk for context)
              const sortedChunks = allChunks
                .filter(chunk => chunk.chunkIndex !== undefined)
                .sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0));
              
              const currentIndex = embeddingRecord.chunkIndex;
              const contextChunks = sortedChunks.filter(chunk => {
                const chunkIdx = chunk.chunkIndex || 0;
                return currentIndex !== undefined && chunkIdx >= currentIndex - 1 && chunkIdx <= currentIndex + 1;
              });
              
              expandedContext = contextChunks
                .map(chunk => chunk.chunkText || "")
                .filter(text => text.trim().length > 0)
                .join("\n\n");
            } catch (contextError) {
              console.error("Error building expanded context:", contextError);
              expandedContext = embeddingRecord.chunkText || "";
            }
          }
          
          return {
            ...result,
            document,
            isChunkResult,
            chunkIndex: embeddingRecord?.chunkIndex,
            chunkText: embeddingRecord?.chunkText,
            expandedContext: expandedContext || embeddingRecord?.chunkText || "",
          };
        })
      );
      
      // Filter out invalid results and apply document ID filtering
      const validResults = results.filter(result => {
        // Filter out null results (from missing documentId)
        if (!result) {
          return false;
        }
        
        if (!result.document || !result.document.isActive) {
          console.log("Filtering out inactive or missing document");
          return false;
        }
        
        // Filter by document IDs if specified
        if (args.documentIds && args.documentIds.length > 0) {
          if (!args.documentIds.includes(result.documentId)) {
            console.log(`Filtering out document ${result.documentId} - not in requested list`);
            return false;
          }
        }
        
        return true;
      });
      
      console.log(`${validResults.length} valid results after filtering`);
      
      // Enhanced sorting: prioritize chunk results with higher scores
      const sortedResults = validResults.sort((a, b) => {
        // First, prioritize chunk results (they're more specific)
        if (a.isChunkResult && !b.isChunkResult) return -1;
        if (!a.isChunkResult && b.isChunkResult) return 1;
        
        // Then sort by relevance score
        const scoreDiff = b._score - a._score;
        if (Math.abs(scoreDiff) > 0.01) return scoreDiff; // Significant score difference
        
        // If scores are similar, prefer results with expanded context
        if (a.expandedContext && !b.expandedContext) return -1;
        if (!a.expandedContext && b.expandedContext) return 1;
        
        return 0;
      });
      
      const finalLimit = args.limit || VECTOR_SEARCH_LIMIT;
      const finalResults = sortedResults.slice(0, finalLimit);
      
      console.log(`Returning ${finalResults.length} results:`);
      finalResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.document.title} (score: ${result._score.toFixed(3)}, chunk: ${result.isChunkResult})`);
      });
      
      return finalResults;
    } catch (error) {
      console.error("Error searching documents by vector:", error);
      throw error;
    }
  },
});