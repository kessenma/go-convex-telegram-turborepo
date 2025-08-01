import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Update a conversation's type from general to RAG or vice versa
 * This is used when adding documents to an existing general conversation
 * or when removing all documents from a RAG conversation
 */
export const updateConversationType = mutation({
  args: {
    conversationId: v.id("unified_conversations"),
    newType: v.union(v.literal("general"), v.literal("rag")),
    documentIds: v.optional(v.array(v.id("rag_documents"))),
    documentTitles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { conversationId, newType, documentIds, documentTitles } = args;

    // Get the current conversation
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }

    // If changing from general to RAG, we need document IDs and titles
    if (newType === "rag" && (!documentIds || !documentTitles)) {
      throw new Error("Document IDs and titles are required when changing to RAG mode");
    }

    // Update the conversation type and documents if needed
    const updateData: any = {
      type: newType,
      chatMode: newType, // Update chatMode to match type
    };

    // Add documents if changing to RAG mode
    if (newType === "rag" && documentIds && documentTitles) {
      updateData.documentIds = documentIds;
      updateData.documentTitles = documentTitles;
    }

    // Clear documents if changing to general mode
    if (newType === "general") {
      updateData.documentIds = [];
      updateData.documentTitles = [];
    }

    // Update the conversation
    const updatedConversationId = await ctx.db.patch(conversationId, updateData);
    return updatedConversationId;
  },
});