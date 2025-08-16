import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "../../../../generated-convex";
import type { GenericId as Id } from "convex/values";
import {
  SessionManager,
  sessionManager,
} from "../../../../lib/session-manager";

const convex = new ConvexHttpClient(
  process.env.CONVEX_HTTP_URL || "http://localhost:3211"
);
const LIGHTWEIGHT_LLM_URL =
  process.env.LIGHTWEIGHT_LLM_INTERNAL_URL || "http://localhost:8082";

interface ChatRequest {
  message: string;
  documentIds: string[];
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  sessionId?: string;
}

interface VectorSearchResult {
  documentId: string;
  title: string;
  snippet: string;
  score: number;
  chunkIndex?: number;
  isChunkResult?: boolean;
}

// Expand chunk context by including surrounding content
function expandChunkContext(
  chunkText: string,
  fullContent: string,
  _chunkIndex: number
): string {
  try {
    // Find the chunk in the full content
    const chunkStart = fullContent.indexOf(chunkText);
    if (chunkStart === -1) {
      return chunkText; // Fallback to original chunk
    }

    // Expand context by including some surrounding text
    const contextBefore = 200; // characters before
    const contextAfter = 200; // characters after

    const expandedStart = Math.max(0, chunkStart - contextBefore);
    const expandedEnd = Math.min(
      fullContent.length,
      chunkStart + chunkText.length + contextAfter
    );

    let expandedText = fullContent.substring(expandedStart, expandedEnd);

    // Add ellipsis if we truncated
    if (expandedStart > 0) {
      expandedText = "..." + expandedText;
    }
    if (expandedEnd < fullContent.length) {
      expandedText = expandedText + "...";
    }

    return expandedText;
  } catch (error) {
    console.error("Error expanding chunk context:", error);
    return chunkText;
  }
}

// Generate a session ID if not provided
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Perform enhanced vector search using your existing embedding system
async function performVectorSearch(
  query: string,
  documentIds: string[],
  limit: number = 5
): Promise<VectorSearchResult[]> {
  console.log("Starting enhanced vector search with query:", query);
  console.log("Document IDs:", documentIds);

  try {
    // First, try to use your existing vector search from Convex with document filtering
    console.log("Trying Convex vector search with document filtering...");
    // TODO: Fix this endpoint - searchDocumentsByVector doesn't exist
    // const vectorResults = await convex.action(
    //   api.embeddings.searchDocumentsByVector,
    //   {
    //     queryText: query,
    //     limit: limit * 4, // Get more results to filter and rank
    //     documentIds: documentIds as any[], // Pass document IDs for filtering
    //   }
    // );
    const vectorResults = [];

    console.log(
      "Vector search results:",
      vectorResults ? vectorResults.length : 0
    );
    
    if (vectorResults && vectorResults.length > 0) {
      console.log("Sample result structure:", {
        // TODO: Uncomment when searchDocumentsByVector is fixed
        // hasDocument: !!vectorResults[0]?.document,
        // hasChunkText: !!vectorResults[0]?.chunkText,
        // hasScore: !!vectorResults[0]?._score,
        // isChunkResult: !!vectorResults[0]?.isChunkResult,
        // expandedContext: !!vectorResults[0]?.expandedContext
      });

      // Process and enhance results
      const processedResults = vectorResults
        .filter((result: any) => {
          // Ensure we have valid document structure
          if (!result.document || !result.document._id) {
            console.log("Skipping result with invalid document structure");
            return false;
          }
          return true;
        })
        .map((result: any) => {
          // Use the best available text content
          let snippet = "";
          
          if (result.expandedContext) {
            // Use expanded context if available (includes surrounding chunks)
            snippet = result.expandedContext;
          } else if (result.chunkText) {
            // Use chunk text if available
            snippet = result.chunkText;
            
            // Try to expand context around the chunk
            if (result.chunkIndex !== undefined) {
              snippet = expandChunkContext(
                result.chunkText,
                result.document.content,
                result.chunkIndex
              );
            }
          } else {
            // Fallback to document content
            snippet = result.document.content.substring(0, 400);
          }

          return {
            documentId: result.document._id,
            title: result.document.title,
            snippet: snippet.trim(),
            score: result._score || 0.8,
            chunkIndex: result.chunkIndex,
            isChunkResult: !!result.chunkText,
          };
        })
        .sort((a: any, b: any) => {
          // Prioritize chunk results with higher scores
          if (a.isChunkResult && !b.isChunkResult) return -1;
          if (!a.isChunkResult && b.isChunkResult) return 1;
          return b.score - a.score;
        })
        .slice(0, limit);

      console.log(`Returning ${processedResults.length} processed vector results`);
      console.log("Result scores:", processedResults.map(r => r.score));
      
      return processedResults;
    }
  } catch (vectorError) {
    console.error("Vector search failed:", vectorError);
    console.error("Error details:", vectorError);
  }

  // Fallback to keyword matching if vector search fails
  console.log("Falling back to keyword search...");
  try {
    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        try {
          const doc = await convex.query(api.documents.getDocumentById, {
            documentId: docId as Id<"rag_documents">,
          });
          return doc;
        } catch (error) {
          console.error(`Error fetching document ${docId}:`, error);
          return null;
        }
      })
    );

    const validDocuments = documents.filter(Boolean);
    console.log("Valid documents for keyword search:", validDocuments.length);

    if (validDocuments.length === 0) {
      console.log("No valid documents found");
      return [];
    }

    const queryTerms = query
      .toLowerCase()
      .split(" ")
      .filter((term) => term.length > 2);
    console.log("Query terms:", queryTerms);

    const results: VectorSearchResult[] = [];

    for (const doc of validDocuments) {
      if (!doc) continue;

      const content = doc.content.toLowerCase();
      let relevanceScore = 0;
      let bestSnippet = "";

      // Find the best matching snippet
      const sentences = doc.content
        .split(/[.!?]+/)
        .filter((s: string) => s.trim().length > 20);
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

      // Always include the document with some content, even if no exact matches
      if (relevanceScore > 0) {
        results.push({
          documentId: doc._id,
          title: doc.title,
          snippet: bestSnippet,
          score: relevanceScore,
        });
      } else {
        // Include document with first few sentences as fallback
        const firstSentences = sentences.slice(0, 3).join(". ");
        results.push({
          documentId: doc._id,
          title: doc.title,
          snippet: firstSentences || doc.content.substring(0, 300),
          score: 0.1, // Low score but still included
        });
      }
    }

    console.log("Keyword search results:", results.length);
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
}

// Get document content for context
async function getDocumentContext(documentIds: string[]): Promise<string> {
  try {
    // Use direct HTTP API call for more reliable document fetching
    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        try {
          const response = await fetch(
            `http://localhost:3211/api/documents/${docId}`
          );
          if (!response.ok) {
            console.error(
              `Failed to fetch document ${docId}: ${response.status}`
            );
            return null;
          }
          const doc = await response.json();
          return doc;
        } catch (error) {
          console.error(`Error fetching document ${docId}:`, error);
          return null;
        }
      })
    );

    const validDocuments = documents.filter(Boolean);
    console.log("Valid documents found:", validDocuments.length);

    // Combine document content (truncate if too long)
    const context = validDocuments
      .map((doc) => (doc ? `Document: ${doc.title}\n${doc.content}` : ""))
      .filter(Boolean)
      .join("\n\n")
      .substring(0, 8000); // Limit context size

    return context;
  } catch (error) {
    console.error("Error getting document context:", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  let llmSessionId: string | undefined;

  try {
    const body: ChatRequest = await request.json();
    const { message, documentIds, conversationHistory, sessionId } = body;

    if (!message || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { error: "Message and document IDs are required" },
        { status: 400 }
      );
    }

    // Try to acquire the lightweight LLM service
    const acquisition = sessionManager.acquireService(
      SessionManager.LIGHTWEIGHT_LLM
    );
    if (!acquisition.success) {
      return NextResponse.json(
        {
          error: acquisition.message,
          serviceUnavailable: true,
        },
        { status: 503 }
      );
    }

    llmSessionId = acquisition.sessionId;
    const currentSessionId = sessionId || generateSessionId();
    const startTime = Date.now();

    // Step 1: Check if documents have embeddings and perform search
    console.log("Performing enhanced RAG search...");
    console.log("Message:", message);
    console.log("Document IDs:", documentIds);

    const vectorResults = await performVectorSearch(message, documentIds, 5);

    // Step 2: Build enhanced context from search results
    let context = "";
    if (vectorResults.length > 0) {
      console.log(
        `Building enhanced context from ${vectorResults.length} search results`
      );

      // Separate chunk-based and document-based results
      const chunkResults = vectorResults.filter((r) => r.isChunkResult);
      const documentResults = vectorResults.filter((r) => !r.isChunkResult);

      console.log(
        `Found ${chunkResults.length} chunk results and ${documentResults.length} document results`
      );

      // Build structured context for better LLM understanding
      const contextParts: string[] = [];
      
      // Add system instruction
      contextParts.push("You are answering questions based on specific document content. Use the information below to provide accurate, detailed answers.");
      
      if (chunkResults.length > 0) {
        contextParts.push("\n\nRELEVANT DOCUMENT SECTIONS:");
        chunkResults.forEach((result, index) => {
          const relevancePercent = (result.score * 100).toFixed(1);
          contextParts.push(
            `\n--- Section ${index + 1} from "${result.title}" (${relevancePercent}% relevant) ---`
          );
          contextParts.push(result.snippet);
          contextParts.push("--- End Section ---");
        });
      }

      if (documentResults.length > 0 && chunkResults.length < 3) {
        contextParts.push("\n\nADDITIONAL CONTEXT:");
        documentResults.slice(0, 2).forEach((result, index) => {
          contextParts.push(
            `\n--- From "${result.title}" ---`
          );
          contextParts.push(result.snippet);
          contextParts.push("--- End Context ---");
        });
      }

      // Add specific instructions for the LLM
      contextParts.push("\n\nINSTRUCTIONS:");
      contextParts.push("- Answer based ONLY on the information provided above");
      contextParts.push("- Be specific and reference document sections when possible");
      contextParts.push("- If asked about steps, list them clearly and in order");
      contextParts.push("- If the information doesn't contain the answer, clearly state that you don't know");
      contextParts.push("- Keep your response concise but complete");

      context = contextParts.join("\n");
    } else {
      // Enhanced fallback to full document content
      console.log("No vector results, using enhanced full document context...");
      const fullContext = await getDocumentContext(documentIds);

      if (fullContext.trim()) {
        context = `You are answering questions based on the following document content:

DOCUMENT CONTENT:
${fullContext}

INSTRUCTIONS:
- Answer the user's question based on the document content above
- Be specific and reference relevant sections
- If asked about steps, list them clearly and in order
- If the information doesn't contain the answer, clearly state that you don't know
- Keep your response concise but complete`;
      } else {
        context = "I don't have access to the document content to answer your question.";
      }
    }

    // Step 3: Call the lightweight LLM service
    console.log("Calling lightweight LLM service...");
    const llmResponse = await fetch(`${LIGHTWEIGHT_LLM_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        context,
        conversation_history: conversationHistory,
        max_length: 150, // Reduced for faster responses
        temperature: 0.7,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error("LLM service error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate response from LLM service" },
        { status: 500 }
      );
    }

    const llmResult = await llmResponse.json();
    const processingTime = Date.now() - startTime;

    // Step 4: Save conversation to Convex
    try {
      // Check if conversation exists, if not create it
      const conversation = await convex.query(
        api.unifiedChat.getConversationBySessionId,
        {
          sessionId: currentSessionId,
        }
      );

      let conversationId;
      if (!conversation) {
        // Fetch document titles from Convex
      const documentTitles = await Promise.all(
        documentIds.map(async (docId) => {
          try {
            const doc = await convex.query(api.documents.getDocumentById, {
              documentId: docId as any,
            });
            return doc?.title || "Untitled Document";
          } catch (error) {
            console.error(`Error fetching document ${docId}:`, error);
            return "Untitled Document";
          }
        })
      );

      // Create new conversation
      conversationId = await convex.mutation(api.unifiedChat.createConversation, {
        sessionId: currentSessionId,
        documentIds: documentIds as any[],
        documentTitles: documentTitles,
        title: `Chat about ${documentIds.length} document${documentIds.length > 1 ? "s" : ""}`,
        llmModel: llmResult.model_info?.model_name || "lightweight-llm",
        chatMode: "rag",
        type: "rag",
        userId: request.headers.get("x-user-id") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          undefined,
      });
      } else {
        conversationId = conversation._id;
      }

      // Save user message
      await convex.mutation(api.unifiedChat.addMessage, {
        conversationId: conversationId as any,
        messageId: `msg_${Date.now()}_user`,
        role: "user",
        content: message,
        tokenCount: llmResult.usage?.input_tokens || 0,
        chatMode: "rag",
      });

      // Save assistant message
      await convex.mutation(api.unifiedChat.addMessage, {
        conversationId: conversationId as any,
        messageId: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: llmResult.response,
        tokenCount: llmResult.usage?.output_tokens || 0,
        processingTimeMs: processingTime,
        chatMode: "rag",
        sources: vectorResults.map((result) => ({
          documentId: result.documentId as any,
          title: result.title,
          snippet: result.snippet,
          score: result.score,
        })),
      });

      console.log("Successfully saved conversation to Convex");
    } catch (convexError) {
      console.error("Error saving to Convex:", convexError);
      // Continue even if saving fails - don't break the chat experience
    }

    // Step 5: Return response
    return NextResponse.json({
      response: llmResult.response,
      sessionId: currentSessionId,
      sources: vectorResults,
      usage: llmResult.usage,
      processingTimeMs: processingTime,
      model: llmResult.model_info,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // Always release the service when done
    if (llmSessionId) {
      sessionManager.releaseService(
        SessionManager.LIGHTWEIGHT_LLM,
        llmSessionId
      );
    }
  }
}

export async function GET() {
  return NextResponse.json({
    message: "RAG Chat API is running",
    endpoints: {
      POST: "/api/RAG/chat - Send a chat message with document context",
    },
  });
}
