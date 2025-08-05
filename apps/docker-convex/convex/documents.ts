// apps/docker-convex/convex/documents.ts
import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to save a document to the database (plain TypeScript, not Convex mutation)
export type SaveDocumentInput = {
  title: string;
  content: string;
  contentType: string;
  tags?: string[];
  summary?: string;
};

export async function saveDocumentToDb(ctx: any, args: SaveDocumentInput) {
  const now = Date.now();
  const wordCount = args.content.split(/\s+/).filter(word => word.length > 0).length;
  const fileSize = args.content.length;

  const documentId = await ctx.db.insert("rag_documents", {
    title: args.title,
    content: args.content,
    contentType: args.contentType,
    fileSize,
    uploadedAt: now,
    lastModified: now,
    isActive: true,
    tags: args.tags,
    summary: args.summary,
    wordCount,
    hasEmbedding: false,
  });

  await ctx.db.insert("notifications", {
    type: "document_upload",
    title: "Document Uploaded",
    message: `Document \"${args.title}\" has been uploaded successfully`,
    timestamp: now,
    isRead: false,
    documentId: documentId,
    metadata: JSON.stringify({
      contentType: args.contentType,
      fileSize: fileSize,
      wordCount: wordCount
    }),
    source: "system"
  });

  return documentId;
}

// Save a new document to the RAG system
export const saveDocument = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    contentType: v.string(), // "markdown" or "text"
    tags: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const documentId = await saveDocumentToDb(ctx, args);

    // Automatically trigger embedding generation after document is saved
    // Note: Embedding trigger temporarily disabled due to type issues
    // Will be re-enabled after deployment
    console.log(`Document saved: ${documentId} - embedding will be triggered manually for now`);

    return documentId;
  },
});



// Get all documents with pagination
export type GetAllDocumentsInput = {
  limit?: number;
  cursor?: string;
};

export async function getAllDocumentsFromDb(ctx: any, args: GetAllDocumentsInput) {
  const limit = args.limit ?? 20;
  return await ctx.db
    .query("rag_documents")
    .withIndex("by_active_and_date", (q: any) => q.eq("isActive", true))
    .order("desc")
    .paginate({
      cursor: args.cursor ?? null,
      numItems: limit,
    });
}

export const getAllDocuments = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return getAllDocumentsFromDb(ctx, args);
  },
});

// Get a specific document by ID
export type GetDocumentByIdInput = {
  documentId: string;
};

export async function getDocumentByIdFromDb(ctx: any, args: GetDocumentByIdInput) {
  return await ctx.db.get(args.documentId);
}

export const getDocumentById = query({
  args: { documentId: v.id("rag_documents") },
  handler: async (ctx, args) => {
    return getDocumentByIdFromDb(ctx, args);
  },
});

// Update document content
export const updateDocument = mutation({
  args: {
    documentId: v.id("rag_documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { documentId, ...updates } = args;
    const now = Date.now();

    const updateData: any = {
      ...updates,
      lastModified: now,
    };

    // Recalculate word count and file size if content is updated
    if (updates.content) {
      updateData.wordCount = updates.content.split(/\s+/).filter(word => word.length > 0).length;
      updateData.fileSize = updates.content.length; // Simple character count for file size
      updateData.hasEmbedding = false; // Reset embedding flag when content changes
    }

    await ctx.db.patch(documentId, updateData);
    return documentId;
  },
});

// Delete a document (soft delete by setting isActive to false)
export type DeleteDocumentInput = {
  documentId: string;
};

export async function deleteDocumentFromDb(ctx: any, args: DeleteDocumentInput) {
  // First, delete all associated embeddings
  const embeddings = await ctx.db
    .query("document_embeddings")
    .withIndex("by_document", (q: any) => q.eq("documentId", args.documentId))
    .collect();

  for (const embedding of embeddings) {
    await ctx.db.delete(embedding._id);
  }

  // Then soft delete the document
  await ctx.db.patch(args.documentId, {
    isActive: false,
    lastModified: Date.now(),
  });

  return args.documentId;
}

// Search documents by content
export const searchDocuments = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const results = await ctx.db
      .query("rag_documents")
      .withSearchIndex("search_content", (q) =>
        q.search("content", args.searchTerm).eq("isActive", true)
      )
      .take(limit);

    return results;
  },
});

// Save multiple documents in batch
export type SaveDocumentsBatchInput = {
  documents: SaveDocumentInput[];
};

export async function saveDocumentsBatchToDb(ctx: any, args: SaveDocumentsBatchInput) {
  const now = Date.now();
  const results = [];
  const errors = [];

  for (let i = 0; i < args.documents.length; i++) {
    try {
      const doc = args.documents[i];
      const wordCount = doc.content.split(/\s+/).filter(word => word.length > 0).length;
      const fileSize = doc.content.length;

      const documentId = await ctx.db.insert("rag_documents", {
        title: doc.title,
        content: doc.content,
        contentType: doc.contentType as "markdown" | "text",
        tags: doc.tags || [],
        summary: doc.summary,
        wordCount,
        fileSize,
        isActive: true,
        hasEmbedding: false,
        uploadedAt: now,
        lastModified: now,
      });

      results.push({ index: i, documentId, title: doc.title });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push({ index: i, error: errorMessage });
    }
  }

  return { results, errors };
}

export const saveDocumentsBatch = mutation({
  args: {
    documents: v.array(v.object({
      title: v.string(),
      content: v.string(),
      contentType: v.string(),
      tags: v.optional(v.array(v.string())),
      summary: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const batchResult = await saveDocumentsBatchToDb(ctx, { documents: args.documents });

    // Automatically trigger embedding generation for each successfully saved document
    // Note: Embedding trigger temporarily disabled due to type issues
    // Will be re-enabled after deployment
    for (const result of batchResult.results) {
      console.log(`Document saved: ${result.documentId} - embedding will be triggered manually for now`);
    }

    return batchResult;
  },
});

// Get document statistics
export type GetDocumentStatsInput = {};

export async function getDocumentStatsFromDb(ctx: any, args: GetDocumentStatsInput) {
  // Example: count all documents in rag_documents
  const count = await ctx.db.query("rag_documents").collect().then((docs: any[]) => docs.length);
  return { count };
}

export const getDocumentStats = query({
  args: {},
  handler: async (ctx, args) => {
    return getDocumentStatsFromDb(ctx, args);
  },
});

// Internal helper to get document stats
export const getDocumentStatsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allDocs = await ctx.db
      .query("rag_documents")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const totalDocuments = allDocs.length;
    const totalWords = allDocs.reduce((sum, doc) => sum + doc.wordCount, 0);
    const totalSize = allDocs.reduce((sum, doc) => sum + doc.fileSize, 0);

    const contentTypes = allDocs.reduce((acc, doc) => {
      acc[doc.contentType] = (acc[doc.contentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDocuments,
      totalWords,
      totalSize,
      contentTypes,
      averageWordsPerDocument: totalDocuments > 0 ? Math.round(totalWords / totalDocuments) : 0,
      averageSizePerDocument: totalDocuments > 0 ? Math.round(totalSize / totalDocuments) : 0,
    };
  },
});



// Get enhanced document statistics with embeddings and file types
export type GetEnhancedDocumentStatsInput = {};

export async function getEnhancedDocumentStatsFromDb(ctx: any, args: GetEnhancedDocumentStatsInput) {
  const allDocs = await ctx.db
    .query("rag_documents")
    .withIndex("by_active", (q: any) => q.eq("isActive", true))
    .collect();

  // Example: If you need embeddings or other collections, query them here
  // const allEmbeddings = await ctx.db.query("document_embeddings").collect();

  const totalDocuments = allDocs.length;
  const totalWords = allDocs.reduce((sum: number, doc: any) => sum + doc.wordCount, 0);
  const totalSize = allDocs.reduce((sum: number, doc: any) => sum + doc.fileSize, 0);

  const contentTypes = allDocs.reduce((acc: Record<string, number>, doc: any) => {
    acc[doc.contentType] = (acc[doc.contentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalDocuments,
    totalWords,
    totalSize,
    contentTypes,
    averageWordsPerDocument: totalDocuments > 0 ? Math.round(totalWords / totalDocuments) : 0,
    averageSizePerDocument: totalDocuments > 0 ? Math.round(totalSize / totalDocuments) : 0,
  };
}

export const getEnhancedDocumentStats = query({
  args: {},
  handler: async (ctx, args) => {
    return getEnhancedDocumentStatsFromDb(ctx, args);
  }
});

// Get document upload statistics based on timestamps
export const getDocumentUploadStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Get all active documents
    const allDocs = await ctx.db
      .query("rag_documents")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Calculate upload statistics
    const totalDocuments = allDocs.length;
    const uploadsLastHour = allDocs.filter(doc => doc.uploadedAt >= oneHourAgo).length;
    const uploadsLastDay = allDocs.filter(doc => doc.uploadedAt >= oneDayAgo).length;

    return {
      totalDocuments,
      uploadsLastHour,
      uploadsLastDay,
    };
  },
});
// Get documents by their IDs
export type GetDocumentsByIdsInput = {
  documentIds: string[];
};

export async function getDocumentsByIdsFromDb(ctx: any, args: GetDocumentsByIdsInput) {
  // Use .get for each ID (could be optimized if needed)
  const docs = await Promise.all(args.documentIds.map((id) => ctx.db.get(id)));
  // Filter out nulls (not found)
  return docs.filter(Boolean);
}

export const getDocumentsByIds = query({
  args: { documentIds: v.array(v.id("rag_documents")) },
  handler: async (ctx, args) => {
    return getDocumentsByIdsFromDb(ctx, args);
  },
});