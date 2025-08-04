// apps/docker-convex/convex/documents.ts
import { internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

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
    const now = Date.now();
    const wordCount = args.content.split(/\s+/).filter(word => word.length > 0).length;
    const fileSize = args.content.length; // Simple character count for file size

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
      hasEmbedding: false, // Will be set to true when embedding is generated
    });

    // Create notification for document upload
    await ctx.db.insert("notifications", {
      type: "document_upload",
      title: "Document Uploaded",
      message: `Document "${args.title}" has been uploaded successfully`,
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

    // Note: Embedding generation removed as RAG functionality is not being used

    return documentId;
  },
});



// Get all documents with pagination
export const getAllDocuments = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    const documents = await ctx.db
      .query("rag_documents")
      .withIndex("by_active_and_date", (q) => q.eq("isActive", true))
      .order("desc")
      .paginate({
        cursor: args.cursor ?? null,
        numItems: limit,
      });

    return documents;
  },
});

// Get a specific document by ID
export const getDocumentById = query({
  args: { documentId: v.id("rag_documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
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
export const deleteDocument = mutation({
  args: { documentId: v.id("rag_documents") },
  handler: async (ctx, args) => {
    // First, delete all associated embeddings
    const embeddings = await ctx.db
      .query("document_embeddings")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
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
  },
});

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
        errors.push({ index: i, title: args.documents[i].title, error: errorMessage });
      }
    }

    return {
      processed: args.documents.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
      message: `Batch upload completed: ${results.length} successful, ${errors.length} failed`,
    };
  },
});

// Get document statistics
export const getDocumentStats = query({
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
export const getEnhancedDocumentStats = query({
  args: {},
  handler: async (ctx) => {
    // Get all active documents
    const allDocs = await ctx.db
      .query("rag_documents")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Get all active embeddings
    const allEmbeddings = await ctx.db
      .query("document_embeddings")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Basic document stats
    const totalDocuments = allDocs.length;
    const totalWords = allDocs.reduce((sum, doc) => sum + doc.wordCount, 0);
    const totalSize = allDocs.reduce((sum, doc) => sum + doc.fileSize, 0);
    
    // Content type breakdown
    const contentTypes = allDocs.reduce((acc, doc) => {
      acc[doc.contentType] = (acc[doc.contentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // File type breakdown (inferred from content type and title)
    const fileTypes = allDocs.reduce((acc, doc) => {
      let fileType = 'other';
      const titleLower = doc.title.toLowerCase();
      
      // Check file extension first for more accurate detection
      if (titleLower.endsWith('.pdf')) {
        fileType = 'pdf';
      } else if (titleLower.endsWith('.docx') || titleLower.endsWith('.doc')) {
        fileType = 'word';
      } else if (titleLower.endsWith('.md') || doc.contentType === 'markdown') {
        fileType = 'markdown';
      } else if (titleLower.endsWith('.txt')) {
        fileType = 'text';
      } else if (doc.contentType === 'text') {
        // For text contentType without specific extension, try to infer from title
        if (titleLower.includes('pdf') || titleLower.includes('.pdf')) {
          fileType = 'pdf';
        } else if (titleLower.includes('docx') || titleLower.includes('doc') || titleLower.includes('word')) {
          fileType = 'word';
        } else {
          fileType = 'text';
        }
      }
      
      acc[fileType] = (acc[fileType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Embedding statistics
    const documentsWithEmbeddings = allDocs.filter(doc => doc.hasEmbedding).length;
    const documentsWithoutEmbeddings = totalDocuments - documentsWithEmbeddings;
    const totalEmbeddings = allEmbeddings.length;
    const totalChunks = allEmbeddings.filter(emb => emb.chunkIndex !== undefined).length;
    
    // Embedding model breakdown
    const embeddingModels = allEmbeddings.reduce((acc, emb) => {
      acc[emb.embeddingModel] = (acc[emb.embeddingModel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate estimated lines of text (rough estimate: ~10-15 words per line)
    const estimatedLines = Math.round(totalWords / 12);

    // Recent activity (last 24 hours)
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const recentUploads = allDocs.filter(doc => doc.uploadedAt >= oneDayAgo).length;
    const recentEmbeddings = allEmbeddings.filter(emb => emb.createdAt >= oneDayAgo).length;

    return {
      // Basic stats
      totalDocuments,
      totalWords,
      totalSize,
      estimatedLines,
      
      // File type breakdown
      fileTypes,
      contentTypes,
      
      // Embedding stats
      totalEmbeddings,
      totalChunks,
      documentsWithEmbeddings,
      documentsWithoutEmbeddings,
      embeddingModels,
      embeddingCoverage: totalDocuments > 0 ? Math.round((documentsWithEmbeddings / totalDocuments) * 100) : 0,
      
      // Averages
      averageWordsPerDocument: totalDocuments > 0 ? Math.round(totalWords / totalDocuments) : 0,
      averageSizePerDocument: totalDocuments > 0 ? Math.round(totalSize / totalDocuments) : 0,
      averageEmbeddingsPerDocument: documentsWithEmbeddings > 0 ? Math.round(totalEmbeddings / documentsWithEmbeddings) : 0,
      
      // Recent activity
      recentActivity: {
        uploadsLast24h: recentUploads,
        embeddingsLast24h: recentEmbeddings,
      },
    };
  },
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
export const getDocumentsByIds = query({
  args: {
    documentIds: v.array(v.id("rag_documents")),
  },
  handler: async (ctx, args) => {
    const documents = await Promise.all(
      args.documentIds.map(async (docId) => {
        const doc = await ctx.db.get(docId);
        return doc;
      })
    );
    
    // Filter out null documents (in case some IDs don't exist)
    return documents.filter(Boolean);
  },
});