import { mutation, query } from "./_generated/server";
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
    const fileSize = new TextEncoder().encode(args.content).length;

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
      embedding: undefined, // Will be populated later by embedding service
    });

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
        cursor: args.cursor || null,
        numItems: limit,
      });

    return documents;
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
    };
  },
});