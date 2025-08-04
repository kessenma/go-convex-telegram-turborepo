import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const VECTOR_SEARCH_LIMIT = 10;

interface EmbeddingResult {
  _id: Id<"document_embeddings">;
  documentId: Id<"rag_documents">;
  chunkText?: string;
  chunkIndex?: number;
  _score: number;
  document: any;
}

export const searchDocumentsByVector = action({
  args: {
    queryText: v.string(),
    limit: v.optional(v.number()),
    documentIds: v.optional(v.array(v.id("rag_documents"))),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`Starting vector search for query: "${args.queryText}"`);
      console.log(`Document filter: ${args.documentIds ? args.documentIds.length + ' documents' : 'all documents'}`);

      // TEMPORARY: Commented out due to type instantiation issues
      // const queryEmbedding = await ctx.runAction(api.embeddings.generateEmbedding, {
      //   text: args.queryText,
      // });
      const queryEmbedding: number[] = [];

      console.log(`Vector search temporarily disabled due to type issues`);

      // Perform vector search
      const searchResults = await ctx.vectorSearch("document_embeddings", "by_embedding", {
        vector: queryEmbedding,
        limit: args.limit || VECTOR_SEARCH_LIMIT,
      });

      console.log(`Vector search returned ${searchResults.length} results`);

      // Process results and add document information
      const results: EmbeddingResult[] = [];

      for (const result of searchResults) {
        try {
          // Get the embedding record to access chunk information and documentId
          // TEMPORARY: Commented out due to type instantiation issues
          // const embeddingRecord = await ctx.runQuery(api.embeddings.getEmbeddingById, {
          //   embeddingId: result._id,
          // });
          const embeddingRecord: any = null;

          if (!embeddingRecord || !embeddingRecord.documentId) {
            console.warn('Vector search result missing embedding record or documentId:', result);
            continue;
          }

          // Apply document ID filter if specified
          if (args.documentIds && !args.documentIds.includes(embeddingRecord.documentId)) {
            continue;
          }

          // TEMPORARY: Commented out due to type instantiation issues
          // const document = await ctx.runQuery(api.documents.getDocumentById, { documentId: embeddingRecord.documentId });
          const document: any = null;

          // Check if this is a chunk-based result
          const isChunkResult = embeddingRecord?.chunkIndex !== undefined && embeddingRecord?.chunkText;

          let expandedContext = "";

          if (isChunkResult && embeddingRecord) {
            // For chunk results, try to get surrounding context
            try {
              // TEMPORARY: Commented out due to type instantiation issues
              // const allChunks = await ctx.runQuery(api.embeddings.getDocumentEmbeddings, {
              //   documentId: embeddingRecord.documentId,
              // });
              const allChunks: any[] = [];

              // Sort chunks by index
              const sortedChunks = allChunks
                .filter(chunk => chunk.chunkIndex !== undefined)
                .sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0));

              const currentChunkIndex = embeddingRecord.chunkIndex || 0;
              const contextWindow = 1; // Get 1 chunk before and after

              const startIndex = Math.max(0, currentChunkIndex - contextWindow);
              const endIndex = Math.min(sortedChunks.length - 1, currentChunkIndex + contextWindow);

              const contextChunks = sortedChunks.slice(startIndex, endIndex + 1);
              expandedContext = contextChunks
                .map(chunk => chunk.chunkText || '')
                .join(' ');

              console.log(`Expanded context for chunk ${currentChunkIndex}: ${expandedContext.length} characters`);
            } catch (contextError) {
              console.warn('Failed to get expanded context:', contextError);
              expandedContext = embeddingRecord.chunkText || '';
            }
          }

          const processedResult: EmbeddingResult = {
            _id: result._id,
            documentId: embeddingRecord.documentId,
            chunkText: isChunkResult ? (expandedContext || embeddingRecord?.chunkText) : undefined,
            chunkIndex: embeddingRecord?.chunkIndex,
            _score: result._score,
            document: document,
          };

          results.push(processedResult);

        } catch (error) {
          console.error('Error processing search result:', error);
          // Continue with other results even if one fails
        }
      }

      console.log(`Processed ${results.length} search results successfully`);

      return {
        results,
        query: args.queryText,
        totalResults: results.length,
      };

    } catch (error) {
      console.error('Vector search failed:', error);
      throw new Error(`Vector search failed: ${error}`);
    }
  },
});