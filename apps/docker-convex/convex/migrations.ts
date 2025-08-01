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

// Migration to add missing fields to existing conversations
export const addMissingConversationFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    let ragUpdatedCount = 0;
    let generalUpdatedCount = 0;
    
    // Update RAG conversations
    const ragConversations = await ctx.db.query("rag_conversations").collect();
    
    for (const conversation of ragConversations) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Add isPublic field if missing
      if ((conversation as any).isPublic === undefined) {
        updates.isPublic = false;
        needsUpdate = true;
      }
      
      // Add documentTitles field if missing
      if ((conversation as any).documentTitles === undefined) {
        // Get document titles from documentIds
        const documentTitles = await Promise.all(
          conversation.documentIds.map(async (docId) => {
            const doc = await ctx.db.get(docId);
            return doc?.title || "Unknown Document";
          })
        );
        updates.documentTitles = documentTitles;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await ctx.db.patch(conversation._id, updates);
        ragUpdatedCount++;
      }
    }
    
    // Update general conversations
    const generalConversations = await ctx.db.query("general_conversations").collect();
    
    for (const conversation of generalConversations) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Add isPublic field if missing
      if ((conversation as any).isPublic === undefined) {
        updates.isPublic = false;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await ctx.db.patch(conversation._id, updates);
        generalUpdatedCount++;
      }
    }
    
    console.log(`Migration completed: Updated ${ragUpdatedCount} RAG conversations and ${generalUpdatedCount} general conversations`);
    return { 
      success: true, 
      ragUpdatedCount, 
      generalUpdatedCount,
      totalUpdated: ragUpdatedCount + generalUpdatedCount 
    };
  },
});