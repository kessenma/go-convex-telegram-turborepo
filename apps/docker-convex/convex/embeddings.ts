// apps/docker-convex/convex/embeddings.ts
import { action, internalAction, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

// Internal function to generate embeddings using vector-convert-llm service
const generateEmbeddingInternal = async (text: string): Promise<number[]> => {
  try {
    const response = await fetch("http://vector-convert-llm:8081/embed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vector LLM service error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
};

// Generate embeddings for a document using OpenAI
export const generateEmbedding = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    return await generateEmbeddingInternal(args.text);
  },
});

// Create document embedding in separate table
export const createDocumentEmbedding = mutation({
  args: {
    documentId: v.id("rag_documents"),
    embedding: v.array(v.number()),
    embeddingModel: v.string(),
    embeddingDimensions: v.number(),
    chunkIndex: v.optional(v.number()),
    chunkText: v.optional(v.string()),
    processingTimeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Create the embedding record
    const embeddingId = await ctx.db.insert("document_embeddings", {
      documentId: args.documentId,
      embedding: args.embedding,
      embeddingModel: args.embeddingModel,
      embeddingDimensions: args.embeddingDimensions,
      chunkIndex: args.chunkIndex,
      chunkText: args.chunkText,
      createdAt: Date.now(),
      processingTimeMs: args.processingTimeMs,
      isActive: true,
    });

    // Update document to mark it as having an embedding
    await ctx.db.patch(args.documentId, {
      hasEmbedding: true,
      lastModified: Date.now(),
    });

    return embeddingId;
  },
});

// Get embeddings for a document
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

// Internal query to get document
export const getDocumentInternal = internalQuery({
  args: { documentId: v.id("rag_documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

// Generate and save embedding for a document
export const processDocumentEmbedding = internalAction({
  args: {
    documentId: v.id("rag_documents"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string; embeddingId?: any }> => {
    // Get the document
    const document = await ctx.runQuery(internal.embeddings.getDocumentInternal, {
      documentId: args.documentId,
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // Check if embedding already exists
    const existingEmbeddings = await ctx.runQuery(api.embeddings.getDocumentEmbeddings, {
      documentId: args.documentId,
    });

    if (existingEmbeddings.length > 0) {
      return { success: true, message: "Embedding already exists" };
    }

    try {
      const startTime = Date.now();
      
      // Generate embedding for the document content
      const embedding = await generateEmbeddingInternal(document.content);
      
      const processingTime = Date.now() - startTime;

      // Create the embedding record
      const embeddingId: any = await ctx.runMutation(api.embeddings.createDocumentEmbedding, {
        documentId: args.documentId,
        embedding,
        embeddingModel: "sentence-transformers/all-distilroberta-v1",
        embeddingDimensions: embedding.length,
        processingTimeMs: processingTime,
      });

      // Create notification for embedding completion
      await ctx.runMutation(api.notifications.createNotification, {
        type: "document_embedded",
        title: "Document Embedding Complete",
        message: `Embedding generated for document "${document.title}"`,
        documentId: args.documentId,
        metadata: JSON.stringify({
          embeddingId: embeddingId,
          embeddingLength: embedding.length,
          contentType: document.contentType,
          processingTimeMs: processingTime
        }),
        source: "system"
      });

      return { success: true, message: "Embedding generated successfully", embeddingId };
    } catch (error) {
      console.error("Error processing document embedding:", error);
      throw error;
    }
  },
});

// Chunk text for better embedding quality
export const chunkText = (text: string, maxChunkSize: number = 1000): string[] => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + ".");
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + ".");
  }

  return chunks.length > 0 ? chunks : [text];
};

// Process document with chunking for large documents
export const processDocumentWithChunking = action({
  args: {
    documentId: v.id("rag_documents"),
    maxChunkSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string; embeddingId?: any }> => {
    const maxChunkSize = args.maxChunkSize ?? 1000;
    
    // Get the document
    const document = await ctx.runQuery(internal.embeddings.getDocumentInternal, {
      documentId: args.documentId,
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // Check if embedding already exists
    const existingEmbeddings = await ctx.runQuery(api.embeddings.getDocumentEmbeddings, {
      documentId: args.documentId,
    });

    if (existingEmbeddings.length > 0) {
      return { success: true, message: "Embedding already exists" };
    }

    try {
      const startTime = Date.now();
      
      // For large documents, we'll use the full content but could implement chunking
      // For now, we'll process the entire document as one embedding
      const embedding = await generateEmbeddingInternal(document.content);
      
      const processingTime = Date.now() - startTime;

      // Create the embedding record
      const embeddingId: any = await ctx.runMutation(api.embeddings.createDocumentEmbedding, {
        documentId: args.documentId,
        embedding,
        embeddingModel: "sentence-transformers/all-distilroberta-v1",
        embeddingDimensions: embedding.length,
        processingTimeMs: processingTime,
      });

      // Create notification for embedding completion
      await ctx.runMutation(api.notifications.createNotification, {
        type: "document_embedded",
        title: "Document Embedding Complete",
        message: `Embedding generated for document "${document.title}"`,
        documentId: args.documentId,
        metadata: JSON.stringify({
          embeddingId: embeddingId,
          embeddingLength: embedding.length,
          contentType: document.contentType,
          processingTimeMs: processingTime
        }),
        source: "system"
      });

      return { success: true, message: "Embedding generated successfully", embeddingId };
    } catch (error) {
      console.error("Error processing document with chunking:", error);
      throw error;
    }
  },
});

// Check LLM service status and readiness
export const checkLLMServiceStatus = action({
  args: {},
  handler: async (ctx, args) => {
    try {
      const response = await fetch("http://vector-convert-llm:8081/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return {
          status: "error",
          ready: false,
          message: `Service unavailable: ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        status: "healthy",
        ready: data.model_loaded || true,
        message: data.message || "Service is running",
        model: data.model || "sentence-transformers/all-distilroberta-v1",
      };
    } catch (error) {
      console.error("Error checking LLM service status:", error);
      return {
        status: "error",
        ready: false,
        message: "Cannot connect to LLM service",
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
  handler: async (ctx, args): Promise<any[]> => {
    const limit = args.limit ?? 10;

    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbeddingInternal(args.queryText);

      // Search for similar embeddings using vector index
      const embeddingResults = await ctx.vectorSearch("document_embeddings", "by_embedding", {
        vector: queryEmbedding,
        limit,
        filter: (q) => q.eq("isActive", true),
      });

      // Get the corresponding documents
      const results = [];
      for (const embeddingResult of embeddingResults) {
        // embeddingResult contains the embedding record with documentId field
        const embeddingRecord = embeddingResult as any;
        const document: any = await ctx.runQuery(internal.embeddings.getDocumentInternal, {
          documentId: embeddingRecord.documentId,
        });
        if (document && document.isActive) {
          results.push({
            ...embeddingResult,
            document,
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error searching documents by vector:", error);
      throw error;
    }
  },
});