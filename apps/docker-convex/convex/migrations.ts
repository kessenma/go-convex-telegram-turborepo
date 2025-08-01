import { internalMutation } from "./_generated/server";

// Migration to add hasEmbedding field to existing documents
export const addHasEmbeddingField = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all documents that don't have the hasEmbedding field
    const documents = await ctx.db.query("rag_documents").collect();
    
    let updatedCount = 0;
    
    for (const doc of documents) {
      try {
        // Check if the document already has the hasEmbedding field
        if ((doc as any).hasEmbedding === undefined) {
          // Update the document to add hasEmbedding: false
          await ctx.db.patch(doc._id, {
            hasEmbedding: false,
          });
          updatedCount++;
        }
      } catch (err) {
        console.error(`Error updating hasEmbedding for document ${doc._id}:`, err);
        // Continue with the next document
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
        try {
          // Get document titles from documentIds
          const documentTitles = await Promise.all(
            conversation.documentIds.map(async (docId) => {
              try {
                const doc = await ctx.db.get(docId);
                return doc?.title || "Unknown Document";
              } catch (err) {
                console.error(`Error fetching document ${docId}:`, err);
                return "Unknown Document";
              }
            })
          );
          updates.documentTitles = documentTitles;
        } catch (err) {
          console.error(`Error processing documentTitles for conversation ${conversation._id}:`, err);
          // Provide a default value if the Promise.all fails
          updates.documentTitles = conversation.documentIds.map(() => "Unknown Document");
        }
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        try {
          await ctx.db.patch(conversation._id, updates);
          ragUpdatedCount++;
        } catch (err) {
          console.error(`Error updating conversation ${conversation._id}:`, err);
          // Continue with the next conversation
        }
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
        try {
          await ctx.db.patch(conversation._id, updates);
          generalUpdatedCount++;
        } catch (err) {
          console.error(`Error updating general conversation ${conversation._id}:`, err);
          // Continue with the next conversation
        }
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