import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
export const getDocument = query({
  args: { documentId: v.id("rag_documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

// Delete a document (soft delete by setting isActive to false)
export const deleteDocument = mutation({
  args: { documentId: v.id("rag_documents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      isActive: false,
      lastModified: Date.now(),
    });
    return args.documentId;
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