/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

const VECTOR_SEARCH_LIMIT = 10;
const DEFAULT_CONTEXT_WINDOW = 2;
const DEFAULT_MAX_CHUNKS_PER_DOC = 3;
const DEFAULT_OVERSAMPLE = 3;

interface EmbeddingResult {
  _id: Id<"document_embeddings">;
  documentId: Id<"rag_documents">;
  chunkText?: string;
  chunkIndex?: number;
  _score: number;
  document: any;
  expandedContext?: string;
  isChunkResult?: boolean;
  aggregatedScore?: number;
}

// Helper function to extract numeric values from text
function extractNumericValues(text: string): string[] {
  // Match currency amounts like $6,000 or 6,000 or 6000
  const currencyRegex = /\$?(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)/g;
  const matches = text.match(currencyRegex) || [];
  return matches;
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

      // Generate embedding for the query text
      const queryEmbedding = await ctx.runAction(api.embeddings.generateEmbedding, {
        text: args.queryText,
      });

      console.log(`Generated query embedding with ${queryEmbedding.length} dimensions`);

      // Tunables (read from args if provided via HTTP layer using any-cast to avoid deep TS instantiation)
      const opts = args as any;
      const contextWindow = Number.isFinite(opts?.contextWindow) ? Math.max(0, Math.min(5, opts.contextWindow)) : DEFAULT_CONTEXT_WINDOW;
      const maxChunksPerDoc = Number.isFinite(opts?.maxChunksPerDoc) ? Math.max(1, Math.min(10, opts.maxChunksPerDoc)) : DEFAULT_MAX_CHUNKS_PER_DOC;
      const oversample = Number.isFinite(opts?.oversample) ? Math.max(1, Math.min(10, opts.oversample)) : DEFAULT_OVERSAMPLE;

      const k = args.limit || VECTOR_SEARCH_LIMIT;
      const initialLimit = Math.min(k * oversample, 200);

      // Perform vector search
      const searchResults = await ctx.vectorSearch("document_embeddings", "by_embedding", {
        vector: queryEmbedding,
        limit: initialLimit,
        filter: (q) => q.eq("isActive", true),
      });

      console.log(`Vector search returned ${searchResults.length} results`);

      // Process results and add document information
      const results: EmbeddingResult[] = [];

      for (const result of searchResults) {
        try {
          // Get the embedding record to access chunk information and documentId
          const embeddingRecord = await ctx.runQuery(api.embeddings.getEmbeddingById, {
            embeddingId: result._id,
          });

          if (!embeddingRecord || !embeddingRecord.documentId) {
            console.warn('Vector search result missing embedding record or documentId:', result);
            continue;
          }

          // Apply document ID filter if specified
          if (args.documentIds && !args.documentIds.includes(embeddingRecord.documentId)) {
            continue;
          }

          // Get the full document
          const document = await ctx.runQuery(api.documents.getDocumentById, { 
            documentId: embeddingRecord.documentId 
          });

          if (!document) {
            console.warn('Document not found for embedding:', embeddingRecord.documentId);
            continue;
          }

          // Check if this is a chunk-based result
          const isChunkResult = Boolean(embeddingRecord.chunkIndex !== undefined && embeddingRecord.chunkText);

          let expandedContext = "";

          if (isChunkResult && embeddingRecord) {
            // For chunk results, try to get surrounding context
            try {
              const allChunks = await ctx.runQuery(api.embeddings.getDocumentEmbeddings, {
                documentId: embeddingRecord.documentId,
              });

              // Sort chunks by index with proper type casting
              const sortedChunks = allChunks
                .filter((chunk: any) => chunk.chunkIndex !== undefined && chunk.isActive)
                .sort((a: any, b: any) => (a.chunkIndex || 0) - (b.chunkIndex || 0));

              const currentChunkIndex = embeddingRecord.chunkIndex || 0;
              const neighborWindow = 1; // neighbor chunks for per-result context

              const startIndex = Math.max(0, currentChunkIndex - neighborWindow);
              const endIndex = Math.min(sortedChunks.length - 1, currentChunkIndex + neighborWindow);

              const contextChunks = sortedChunks
                .filter((chunk: any) => {
                  const chunkIdx = chunk.chunkIndex || 0;
                  return chunkIdx >= startIndex && chunkIdx <= endIndex;
                })
                .sort((a: any, b: any) => (a.chunkIndex || 0) - (b.chunkIndex || 0));

              expandedContext = contextChunks
                .map((chunk: any) => chunk.chunkText || '')
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
            chunkText: embeddingRecord?.chunkText,
            chunkIndex: embeddingRecord?.chunkIndex,
            _score: result._score,
            document: document,
            expandedContext: isChunkResult ? (expandedContext || embeddingRecord?.chunkText) : undefined,
            isChunkResult: isChunkResult,
          };

          results.push(processedResult);

        } catch (error) {
          console.error('Error processing search result:', error);
          // Continue with other results even if one fails
        }
      }

      console.log(`Processed ${results.length} search results successfully`);

      // Aggregate by document to prefer coherent multi-chunk answers
      const byDoc: Record<string, any[]> = {};
      for (const r of results as any[]) {
        const key = String((r as any).documentId);
        (byDoc[key] ||= []).push(r);
      }

      const aggregated: any[] = [];
      for (const [_docId, chunks] of Object.entries(byDoc)) {
        if ((chunks as any[]).length === 0) continue;

        // Sort chunks by vector score desc and keep top-N for scoring
        const arr = chunks as any[];
        const sorted = [...arr].sort((a: any, b: any) => b._score - a._score);
        const top = sorted.slice(0, maxChunksPerDoc);
        const best = top[0];

      // Enhanced keyword boost with special handling for numeric queries
      const docContent = (best.document?.content || "").toLowerCase();
      const queryText = args.queryText.toLowerCase();
      
      // Check if this is a numeric query (asking about amounts, values, etc.)
      const isNumericQuery = /\b(how much|amount|value|cost|price|fee|payment|salary|compensation|severance|benefit|dollar|figure|sum|total)\b/i.test(queryText);
      
      // Extract numeric values from query
      const numericValues = extractNumericValues(queryText);
      
      // Standard keyword matching
      const termTokens = queryText.split(/\W+/).filter(t => t.length > 2);
      let matchCount = 0;
      for (const t of termTokens) {
        if (docContent.includes(t)) matchCount++;
      }
      
      // Calculate base keyword boost
      let keywordBoost = Math.min(0.5, matchCount * 0.05);
      
      // Apply additional boost for numeric matches if this is a numeric query
      if (isNumericQuery || numericValues.length > 0) {
        // Check if document contains any of the numeric values from the query
        const numericMatches = numericValues.filter(value => docContent.includes(value)).length;
        
        // Check for any dollar amounts in the document
        const docHasDollarAmounts = /\$\d+/.test(docContent);
        
        // Apply stronger boost for numeric matches
        if (numericMatches > 0) {
          keywordBoost += 0.3 * numericMatches; // Significant boost for exact numeric matches
        } else if (docHasDollarAmounts && isNumericQuery) {
          keywordBoost += 0.2; // Moderate boost for documents with dollar amounts for numeric queries
        }
      }

        // Use the already declared numeric query variables from above
        // (isNumericQuery and numericValues are already defined)
        
        // Build an expanded window around the best chunk
        let expandedContext = best.expandedContext || best.chunkText || "";
        try {
          const allChunks = await ctx.runQuery(api.embeddings.getDocumentEmbeddings, {
            documentId: best.documentId,
          });
          const sortedChunks = allChunks
            .filter((c: any) => c.chunkIndex !== undefined && c.isActive)
            .sort((a: any, b: any) => (a.chunkIndex || 0) - (b.chunkIndex || 0));

          // For numeric queries, use a larger context window
          const adjustedContextWindow = isNumericQuery || numericValues.length > 0 
            ? Math.max(contextWindow + 1, 3) // Larger window for numeric queries
            : contextWindow;
            
          const currentIdx = best.chunkIndex || 0;
          const startIndex = Math.max(0, currentIdx - adjustedContextWindow);
          const endIndex = Math.min(sortedChunks.length - 1, currentIdx + adjustedContextWindow);

          // For numeric queries, prioritize chunks containing numeric values
          let contextChunks = sortedChunks.filter((c: any) => {
            const idx = c.chunkIndex || 0;
            return idx >= startIndex && idx <= endIndex;
          });
          
          // If this is a numeric query, try to prioritize chunks with numeric values
          if ((isNumericQuery || numericValues.length > 0) && numericValues.length > 0) {
            // Check each chunk for numeric values
            const chunksWithNumericValues = contextChunks.filter((c: any) => {
              const chunkText = c.chunkText || "";
              return numericValues.some(value => chunkText.includes(value)) || /\$\d+/.test(chunkText);
            });
            
            // If we found chunks with numeric values, prioritize them
            if (chunksWithNumericValues.length > 0) {
              // Add the chunks with numeric values first, then the rest
              const otherChunks = contextChunks.filter(c => !chunksWithNumericValues.includes(c));
              contextChunks = [...chunksWithNumericValues, ...otherChunks];
            }
          }
          
          expandedContext = contextChunks
            .map((c: any) => c.chunkText || "")
            .join(" ");
        } catch {
          // ignore context build error, keep existing expandedContext
        }

        // Aggregate score across top chunks and apply small keyword boost
        const aggregatedScore = top.reduce((sum, r) => sum + r._score, 0);
        const finalScore = aggregatedScore * (1 + keywordBoost);

        aggregated.push({
          ...best,
          expandedContext,
          isChunkResult: true,
          aggregatedScore: finalScore,
          _score: finalScore,
        });
      }

      aggregated.sort((a, b) => b._score - a._score);
      const finalK = args.limit || VECTOR_SEARCH_LIMIT;
      const finalResults = aggregated.slice(0, finalK);

      console.log(`Aggregated to ${finalResults.length} document-level results from ${results.length} chunk results`);

      return {
        results: finalResults,
        query: args.queryText,
        totalResults: finalResults.length,
      };

    } catch (error) {
      console.error('Vector search failed:', error);
      throw new Error(`Vector search failed: ${error}`);
    }
  },
});
