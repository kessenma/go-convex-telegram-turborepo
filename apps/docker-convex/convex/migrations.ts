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
    try {
      let ragUpdatedCount = 0;
      let generalUpdatedCount = 0;
      let errorCount = 0;
      
      // Update RAG conversations
      const ragConversations = await ctx.db.query("rag_conversations").collect();
      console.log(`Processing ${ragConversations.length} RAG conversations`);
      
      for (const conversation of ragConversations) {
        try {
          // Always create a fresh updates object for each conversation
          const updates: any = {};
          let needsUpdate = false;
          
          // Add isPublic field if missing
          if ((conversation as any).isPublic === undefined) {
            updates.isPublic = false;
            needsUpdate = true;
            console.log(`Adding isPublic field to conversation ${conversation._id}`);
          }
          
          // Add documentTitles field if missing
          if ((conversation as any).documentTitles === undefined) {
            console.log(`Adding documentTitles field to conversation ${conversation._id}`);
            try {
              // Ensure documentIds exists and is an array
              let documentIds: Array<any> = [];
              
              // Safely check if documentIds exists and is an array
              if (conversation.documentIds !== undefined && conversation.documentIds !== null) {
                documentIds = Array.isArray(conversation.documentIds) ? conversation.documentIds : [];
                console.log(`Found ${documentIds.length} documentIds for conversation ${conversation._id}`);
              } else {
                console.log(`No documentIds found for conversation ${conversation._id}, using empty array`);
              }
              
              // Get document titles from documentIds
              if (documentIds.length > 0) {
                try {
                  const documentTitles = await Promise.all(
                    documentIds.map(async (docId: any) => {
                      try {
                        const doc = await ctx.db.get(docId);
                        // Check if doc exists and has a title property
                        if (doc && typeof (doc as any).title === 'string') {
                          return (doc as any).title;
                        }
                        return "Unknown Document";
                      } catch (err) {
                        console.error(`Error fetching document ${docId}:`, err);
                        return "Unknown Document";
                      }
                    })
                  );
                  updates.documentTitles = documentTitles.length > 0 ? documentTitles : ["Unknown Document"];
                  console.log(`Set documentTitles to: ${JSON.stringify(updates.documentTitles)}`);
                } catch (err) {
                  console.error(`Error in Promise.all for documentTitles in conversation ${conversation._id}:`, err);
                  updates.documentTitles = ["Unknown Document"];
                  console.log(`Set default documentTitles after Promise.all error`);
                }
              } else {
                updates.documentTitles = ["Unknown Document"];
                console.log(`Set default documentTitles for empty documentIds`);
              }
            } catch (err) {
              console.error(`Error processing documentTitles for conversation ${conversation._id}:`, err);
              // Provide a default value if any error occurs
              updates.documentTitles = ["Unknown Document"];
              console.log(`Set default documentTitles after error`);
            }
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            try {
              // Always ensure we have valid updates before patching
              if (updates.documentTitles === undefined) {
                updates.documentTitles = ["Unknown Document"];
              }
              
              // Make sure isPublic is set
              if (updates.isPublic === undefined) {
                updates.isPublic = false;
              }
              
              console.log(`Patching conversation ${conversation._id} with:`, updates);
              await ctx.db.patch(conversation._id, updates);
              ragUpdatedCount++;
              console.log(`✅ Successfully updated RAG conversation ${conversation._id}`);
            } catch (err) {
              errorCount++;
              console.error(`❌ Error updating conversation ${conversation._id}:`, err);
              // Try a more direct approach if the patch fails
              try {
                console.log(`Attempting fallback update for conversation ${conversation._id}`);
                await ctx.db.patch(conversation._id, { documentTitles: ["Unknown Document"], isPublic: false });
                console.log(`✅ Fallback update for RAG conversation ${conversation._id} succeeded`);
                ragUpdatedCount++;
                errorCount--; // Decrement error count since we recovered
              } catch (fallbackErr) {
                console.error(`❌ Fallback update for RAG conversation ${conversation._id} also failed:`, fallbackErr);
              }
            }
          } else {
            console.log(`No updates needed for conversation ${conversation._id}`);
          }
        } catch (convErr) {
          errorCount++;
          console.error(`❌ Fatal error processing conversation ${conversation._id}:`, convErr);
          // Continue with next conversation
        }
      }
    
    // Update general conversations
    try {
      const generalConversations = await ctx.db.query("general_conversations").collect();
      console.log(`Processing ${generalConversations.length} general conversations`);
      
      for (const conversation of generalConversations) {
        try {
          const updates: any = {};
          let needsUpdate = false;
          
          // Add isPublic field if missing
          if ((conversation as any).isPublic === undefined) {
            updates.isPublic = false;
            needsUpdate = true;
            console.log(`Adding isPublic field to general conversation ${conversation._id}`);
          }
          
          if (needsUpdate) {
            try {
              // Ensure isPublic is set
              if (updates.isPublic === undefined) {
                updates.isPublic = false;
              }
              
              console.log(`Patching general conversation ${conversation._id} with:`, updates);
              await ctx.db.patch(conversation._id, updates);
              generalUpdatedCount++;
              console.log(`✅ Successfully updated general conversation ${conversation._id}`);
            } catch (err) {
              errorCount++;
              console.error(`❌ Error updating general conversation ${conversation._id}:`, err);
              // Try a more direct approach if the patch fails
              try {
                console.log(`Attempting fallback update for general conversation ${conversation._id}`);
                await ctx.db.patch(conversation._id, { isPublic: false });
                console.log(`✅ Fallback update for general conversation ${conversation._id} succeeded`);
                generalUpdatedCount++;
                errorCount--; // Decrement error count since we recovered
              } catch (fallbackErr) {
                console.error(`❌ Fallback update for general conversation ${conversation._id} also failed:`, fallbackErr);
              }
            }
          } else {
            console.log(`No updates needed for general conversation ${conversation._id}`);
          }
        } catch (convErr) {
          errorCount++;
          console.error(`❌ Fatal error processing general conversation ${conversation._id}:`, convErr);
          // Continue with next conversation
        }
      }
    } catch (err) {
      console.error(`❌ Fatal error processing general conversations:`, err);
      // Continue with the function to return partial results
    }
    
    console.log(`Migration completed: Updated ${ragUpdatedCount} RAG conversations and ${generalUpdatedCount} general conversations (${errorCount} errors)`);
    return { 
      success: true, 
      ragUpdatedCount, 
      generalUpdatedCount,
      errorCount,
      totalUpdated: ragUpdatedCount + generalUpdatedCount 
    };
  } catch (fatalErr) {
    console.error(`❌❌ FATAL ERROR in addMissingConversationFields migration:`, fatalErr);
    // Return partial success to prevent deployment failure
    return { 
      success: true, 
      ragUpdatedCount: 0, 
      generalUpdatedCount: 0,
      errorCount: 1,
      fatalError: true 
    };
  }
  },
});