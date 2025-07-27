// apps/docker-convex/convex/ragSearch.ts
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

const VECTOR_SEARCH_LIMIT = 10;

// Generate embedding using your existing vector service
export const generateEmbedding = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args): Promise<number[]> => {
    // Use your existing vector service
    return await ctx.runAction(api.embeddings.generateEmbedding, { text: args.text });
  },
});

// Enhanced vector search using your existing vector service with chunk support
export const vectorSearch = action({
  args: {
    query: v.string(),
    documentIds: v.optional(v.array(v.id("rag_documents"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const limit = args.limit || VECTOR_SEARCH_LIMIT;
    
    try {
      // Use the enhanced vector search with chunk support
      const searchResults = await ctx.runAction(api.embeddings.searchDocumentsByVector, {
        queryText: args.query,
        limit: limit * 2, // Get more candidates
        documentIds: args.documentIds,
      });
      
      console.log(`Vector search returned ${searchResults.length} results`);
      
      // Format results with enhanced chunk information
      const results: any[] = searchResults.slice(0, limit).map((result: any) => {
        const snippet = result.expandedContext || result.chunkText || 
                       (result.document?.content?.substring(0, 300) || "");
        
        return {
          documentId: result.documentId,
          title: result.document?.title || "Unknown Document",
          content: result.document?.content || "",
          snippet: snippet,
          score: result._score,
          isChunkResult: result.isChunkResult || false,
          chunkIndex: result.chunkIndex,
          chunkText: result.chunkText,
          expandedContext: result.expandedContext,
          embedding: result,
        };
      });

      return results.filter(r => r.title !== "Unknown Document");
    } catch (error) {
      console.error("Error in enhanced vector search:", error);
      // Fallback to basic search if enhanced search fails
      try {
        const fallbackResults = await ctx.runAction(api.embeddings.searchDocumentsByVector, {
          queryText: args.query,
          limit,
        });
        
        return fallbackResults.map((result: any) => ({
          documentId: result.documentId,
          title: result.document?.title || "Unknown Document",
          content: result.document?.content || "",
          snippet: result.document?.content?.substring(0, 300) || "",
          score: result._score,
          isChunkResult: false,
          embedding: result,
        })).filter(r => r.title !== "Unknown Document");
      } catch (fallbackError) {
        console.error("Fallback search also failed:", fallbackError);
        return [];
      }
    }
  },
});

// Enhanced RAG search that combines vector search with keyword matching
export const ragSearch = action({
  args: {
    query: v.string(),
    documentIds: v.array(v.id("rag_documents")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const limit = args.limit || 5;
    
    try {
      // Perform vector search
      const vectorResults: any[] = await ctx.runAction(api.ragSearch.vectorSearch, {
        query: args.query,
        documentIds: args.documentIds,
        limit: limit * 2,
      });

      // Prioritize chunk-based results from vector search
      const chunkResults = vectorResults.filter((r: any) => r.isChunkResult);
      const documentResults = vectorResults.filter((r: any) => !r.isChunkResult);
      
      console.log(`Vector search: ${chunkResults.length} chunk results, ${documentResults.length} document results`);
      
      // If we have good chunk results, prioritize them
      if (chunkResults.length > 0) {
        const prioritizedResults = [
          ...chunkResults.slice(0, Math.min(limit, chunkResults.length)),
          ...documentResults.slice(0, Math.max(0, limit - chunkResults.length))
        ];
        
        return prioritizedResults.map((result: any) => ({
          documentId: result.documentId,
          title: result.title,
          snippet: result.expandedContext || result.snippet,
          score: result.score,
          searchType: result.isChunkResult ? "vector-chunk" : "vector-document",
          isChunkResult: result.isChunkResult,
          chunkIndex: result.chunkIndex,
        }));
      }
      
      // If vector search returns good document results, use them
      if (vectorResults.length >= limit) {
        return vectorResults.slice(0, limit).map((result: any) => ({
          documentId: result.documentId,
          title: result.title,
          snippet: result.snippet,
          score: result.score,
          searchType: "vector",
          isChunkResult: result.isChunkResult || false,
        }));
      }

      // Fallback to keyword search if vector search doesn't return enough results
      const documents = await Promise.all(
        args.documentIds.map(async (docId) => {
          const doc: any = await ctx.runQuery(internal.embeddings.getDocumentInternal, {
            documentId: docId,
          });
          return doc;
        })
      );

      const validDocuments = documents.filter(Boolean);
      const queryTerms = args.query.toLowerCase().split(' ').filter(term => term.length > 2);
      
      const keywordResults: any[] = [];
      
      for (const doc of validDocuments) {
        if (!doc) continue;
        
        const content = doc.content.toLowerCase();
        let relevanceScore = 0;
        let bestSnippet = '';
        
        // Calculate overall relevance score using content
        for (const term of queryTerms) {
          if (content.includes(term)) {
            relevanceScore += 1;
          }
        }
        relevanceScore = relevanceScore / queryTerms.length;
        
        // Find the best matching snippet
        const sentences = doc.content.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
        let bestSentenceScore = 0;
        
        for (const sentence of sentences) {
          const sentenceLower = sentence.toLowerCase();
          let sentenceScore = 0;
          
          for (const term of queryTerms) {
            if (sentenceLower.includes(term)) {
              sentenceScore += 1;
            }
          }
          
          if (sentenceScore > bestSentenceScore) {
            bestSentenceScore = sentenceScore;
            bestSnippet = sentence.trim();
          }
        }
        
        // If we found relevant content, add it to results
        if (relevanceScore > 0) {
          keywordResults.push({
            documentId: doc._id,
            title: doc.title,
            snippet: bestSnippet || doc.content.substring(0, 200),
            score: relevanceScore,
            searchType: "keyword",
          });
        }
      }
      
      // Combine vector and keyword results, prioritizing vector results
      const combinedResults = [
        ...vectorResults.map((r: any) => ({ ...r, searchType: "vector" })),
        ...keywordResults.filter((kr: any) => 
          !vectorResults.some((vr: any) => vr.documentId === kr.documentId)
        ),
      ];
      
      // Sort by relevance score and return top results
      return combinedResults
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error("Error in RAG search:", error);
      throw error;
    }
  },
});

// Get context for RAG chat from search results
export const getRagContext = action({
  args: {
    query: v.string(),
    documentIds: v.array(v.id("rag_documents")),
    maxContextLength: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ context: string; sources: any[] }> => {
    const maxContextLength = args.maxContextLength || 4000;
    
    // Perform RAG search
    const searchResults = await ctx.runAction(api.ragSearch.ragSearch, {
      query: args.query,
      documentIds: args.documentIds,
      limit: 5,
    });

    if (searchResults.length === 0) {
      return {
        context: "",
        sources: [],
      };
    }

    // Build context from search results
    let context = "Based on the following documents:\n\n";
    const sources: any[] = [];
    let currentLength = context.length;

    for (const result of searchResults) {
      const snippet = `Document: ${result.title}\nContent: ${result.snippet}\n\n`;
      
      if (currentLength + snippet.length > maxContextLength) {
        break;
      }
      
      context += snippet;
      currentLength += snippet.length;
      
      sources.push({
        documentId: result.documentId,
        title: result.title,
        snippet: result.snippet,
        score: result.score,
      });
    }

    return {
      context: context.trim(),
      sources,
    };
  },
});