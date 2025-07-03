// apps/docker-convex/convex/embeddings.ts
import { action, mutation, internalQuery } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Internal function to generate embeddings
const generateEmbeddingInternal = async (text: string): Promise<number[]> => {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
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
const getDocumentInternal = internalQuery({
  args: { documentId: v.id("rag_documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

// Generate and save embedding for a document
export const processDocumentEmbedding = action({
  args: {
    documentId: v.id("rag_documents"),
  },
  handler: async (ctx, args) => {
    // Get the document
    const document = await ctx.runQuery(api.documents.getDocument, {
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
    const document = await ctx.runQuery(api.documents.getDocument, {
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