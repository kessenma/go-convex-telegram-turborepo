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

// Update document with embedding
export const updateDocumentEmbedding = mutation({
  args: {
    documentId: v.id("rag_documents"),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      embedding: args.embedding,
      lastModified: Date.now(),
    });
    return args.documentId;
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
  handler: async (ctx, args) => {
    // Get the document
    const document = await ctx.runQuery(internal.embeddings.getDocumentInternal, {
      documentId: args.documentId,
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // Skip if embedding already exists
    if (document.embedding && document.embedding.length > 0) {
      return { success: true, message: "Embedding already exists" };
    }

    try {
      // Generate embedding for the document content
      const embedding = await generateEmbeddingInternal(document.content);

      // Update the document with the embedding
      await ctx.runMutation(api.embeddings.updateDocumentEmbedding, {
        documentId: args.documentId,
        embedding,
      });

      return { success: true, message: "Embedding generated successfully" };
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
  handler: async (ctx, args) => {
    const maxChunkSize = args.maxChunkSize ?? 1000;
    
    // Get the document
    const document = await ctx.runQuery(internal.embeddings.getDocumentInternal, {
      documentId: args.documentId,
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // Skip if embedding already exists
    if (document.embedding && document.embedding.length > 0) {
      return { success: true, message: "Embedding already exists" };
    }

    try {
      // For large documents, we'll use the full content but could implement chunking
      // For now, we'll process the entire document as one embedding
      const embedding = await generateEmbeddingInternal(document.content);

      // Update the document with the embedding
      await ctx.runMutation(api.embeddings.updateDocumentEmbedding, {
        documentId: args.documentId,
        embedding,
      });

      return { success: true, message: "Embedding generated successfully" };
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
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbeddingInternal(args.queryText);

      // Search for similar documents using vector index
      const results = await ctx.vectorSearch("rag_documents", "by_embedding", {
        vector: queryEmbedding,
        limit,
        filter: (q) => q.eq("isActive", true),
      });

      return results;
    } catch (error) {
      console.error("Error searching documents by vector:", error);
      throw error;
    }
  },
});