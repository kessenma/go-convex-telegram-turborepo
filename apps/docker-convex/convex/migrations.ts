import { internalMutation } from "./_generated/server";

// Migration to add hasEmbedding field to existing documents
export const addHasEmbeddingField = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all documents that don't have the hasEmbedding field
    const documents = await ctx.db.query("rag_documents").collect();
    
    let updatedCount = 0;
    
    for (const doc of documents) {
      // Check if the document already has the hasEmbedding field
      if ((doc as any).hasEmbedding === undefined) {
        // Update the document to add hasEmbedding: false
        await ctx.db.patch(doc._id, {
          hasEmbedding: false,
        });
        updatedCount++;
      }
    }
    
    console.log(`Migration completed: Updated ${updatedCount} documents with hasEmbedding field`);
    return { success: true, updatedCount };
  },
});