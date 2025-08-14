import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Shared internal queries to avoid circular dependencies
// between documents.ts and embeddings.ts

// Get document by ID - shared internal query
export const getDocumentByIdInternal = internalQuery({
  args: { documentId: v.id("rag_documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

// Get multiple documents by IDs - shared internal query
export const getDocumentsByIdsInternal = internalQuery({
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