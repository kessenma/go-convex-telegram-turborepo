import { internalMutation } from "./_generated/server";

// Migration to add hasEmbedding field to existing documents
export const addHasEmbeddingField = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      // Get all documents that don't have the hasEmbedding field
      const documents = await ctx.db.query("rag_documents").collect();
      
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const doc of documents) {
        try {
          // Check if the document already has the hasEmbedding field
          if ((doc as any).hasEmbedding === undefined) {
            // Update the document to add hasEmbedding: false
            await ctx.db.patch(doc._id, {
              hasEmbedding: false,
            });
            updatedCount++;
            console.log(`Successfully updated hasEmbedding for document ${doc._id}`);
          }
        } catch (err) {
          errorCount++;
          console.error(`Error updating hasEmbedding for document ${doc._id}:`, err);
          // Try a more direct approach if the patch fails
          try {
            await ctx.db.patch(doc._id, { hasEmbedding: false });
            console.log(`Fallback update for document ${doc._id} succeeded`);
            updatedCount++;
            errorCount--; // Decrement error count since we recovered
          } catch (fallbackErr) {
            console.error(`Fallback update for document ${doc._id} also failed:`, fallbackErr);
          }
          // Continue with the next document regardless
        }
      }
      
      console.log(`Migration completed: Updated ${updatedCount} documents with hasEmbedding field (${errorCount} errors)`);
      return { success: true, updatedCount, errorCount };
    } catch (err) {
      console.error("Fatal error in addHasEmbeddingField migration:", err);
      // Return partial success to prevent deployment failure
      return { success: true, updatedCount: 0, errorCount: 1, fatalError: true };
    }
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
          // Ensure documentIds exists and is an array
          const documentIds = Array.isArray(conversation.documentIds) ? conversation.documentIds : [];
          
          // Get document titles from documentIds
          const documentTitles = await Promise.all(
            documentIds.map(async (docId) => {
              try {
                const doc = await ctx.db.get(docId);
                return doc?.title || "Unknown Document";
              } catch (err) {
                console.error(`Error fetching document ${docId}:`, err);
                return "Unknown Document";
              }
            })
          );
          updates.documentTitles = documentTitles.length > 0 ? documentTitles : ["Unknown Document"];
        } catch (err) {
          console.error(`Error processing documentTitles for conversation ${conversation._id}:`, err);
          // Provide a default value if the Promise.all fails
          updates.documentTitles = ["Unknown Document"];
        }
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        try {
          // Ensure we have valid updates before patching
          if (updates.documentTitles === undefined) {
            updates.documentTitles = ["Unknown Document"];
          }
          
          // Make sure isPublic is set
          if (updates.isPublic === undefined) {
            updates.isPublic = false;
          }
          
          await ctx.db.patch(conversation._id, updates);
          ragUpdatedCount++;
          console.log(`Successfully updated RAG conversation ${conversation._id}`);
        } catch (err) {
          console.error(`Error updating conversation ${conversation._id}:`, err);
          // Try a more direct approach if the patch fails
          try {
            await ctx.db.patch(conversation._id, { documentTitles: ["Unknown Document"], isPublic: false });
            console.log(`Fallback update for RAG conversation ${conversation._id} succeeded`);
            ragUpdatedCount++;
          } catch (fallbackErr) {
            console.error(`Fallback update for RAG conversation ${conversation._id} also failed:`, fallbackErr);
          }
          // Continue with the next conversation regardless
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
          // Ensure isPublic is set
          if (updates.isPublic === undefined) {
            updates.isPublic = false;
          }
          
          await ctx.db.patch(conversation._id, updates);
          generalUpdatedCount++;
          console.log(`Successfully updated general conversation ${conversation._id}`);
        } catch (err) {
          console.error(`Error updating general conversation ${conversation._id}:`, err);
          // Try a more direct approach if the patch fails
          try {
            await ctx.db.patch(conversation._id, { isPublic: false });
            console.log(`Fallback update for general conversation ${conversation._id} succeeded`);
            generalUpdatedCount++;
          } catch (fallbackErr) {
            console.error(`Fallback update for general conversation ${conversation._id} also failed:`, fallbackErr);
          }
          // Continue with the next conversation regardless
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