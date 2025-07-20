// apps/docker-convex/convex/ragSearch.ts
import { action, query } from "./_generated/server";
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

// Enhanced vector search using your existing vector service
export const vectorSearch = action({
  args: {
    query: v.string(),
    documentIds: v.optional(v.array(v.id("rag_documents"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const limit = args.limit || VECTOR_SEARCH_LIMIT;
    
    try {
      // Generate embedding for the query using your vector service
      const queryEmbedding = await ctx.runAction(api.embeddings.generateEmbedding, { 
        text: args.query 
      });
      
      // Perform vector search
      const searchResults = await ctx.vectorSearch("document_embeddings", "by_embedding", {
        vector: queryEmbedding,
        limit: limit * 2, // Get more results to filter
        filter: (q) => q.eq("isActive", true),
      });

      // Filter by document IDs if specified
      let filteredResults = searchResults;
      if (args.documentIds && args.documentIds.length > 0) {
        filteredResults = searchResults.filter((result: any) => 
          args.documentIds!.includes(result.documentId)
        );
      }

      // Get document details and format results
      const results: any[] = await Promise.all(
        filteredResults.slice(0, limit).map(async (result: any) => {
          const document: any = await ctx.runQuery(internal.embeddings.getDocumentInternal, {
            documentId: result.documentId,
          });
          
          if (!document || !document.isActive) {
            return null;
          }

          return {
            documentId: result.documentId,
            title: document.title,
            content: document.content,
            snippet: result.chunkText || document.content.substring(0, 300),
            score: result._score,
            embedding: result,
          };
        })
      );

      return results.filter(Boolean);
    } catch (error) {
      console.error("Error in vector search:", error);
      // Fallback to existing search method
      return await ctx.runAction(api.embeddings.searchDocumentsByVector, {
        queryText: args.query,
        limit,
      });
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

      // If vector search returns good results, use them
      if (vectorResults.length >= limit) {
        return vectorResults.slice(0, limit).map((result: any) => ({
          documentId: result.documentId,
          title: result.title,
          snippet: result.snippet,
          score: result.score,
          searchType: "vector",
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
            relevanceScore = sentenceScore / queryTerms.length;
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