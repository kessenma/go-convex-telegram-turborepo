import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "../../../../generated-convex";
import {
  SessionManager,
  sessionManager,
} from "../../../../lib/session-manager";

const convex = new ConvexHttpClient(
  process.env.CONVEX_URL || "http://localhost:3211"
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
}

// Generate a session ID if not provided
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Perform vector search using your existing embedding system
async function performVectorSearch(
  query: string,
  documentIds: string[],
  limit: number = 5
): Promise<VectorSearchResult[]> {
  console.log("Starting vector search with query:", query);
  console.log("Document IDs:", documentIds);

  try {
    // First, try to use your existing vector search from Convex
    console.log("Trying Convex vector search...");
    const vectorResults = await convex.action(
      api.embeddings.searchDocumentsByVector,
      {
        queryText: query,
        limit: limit * 2, // Get more results to filter by document IDs
      }
    );

    console.log("Vector search results:", vectorResults ? vectorResults.length : 0);
    console.log("First result structure:", vectorResults && vectorResults.length > 0 ? JSON.stringify(vectorResults[0]).substring(0, 200) : "No results");

    if (vectorResults && vectorResults.length > 0) {
      // Filter results by document IDs if specified
      const filteredResults = vectorResults.filter((result: any) => {
        // Check if document exists and has the expected structure
        if (!result.document || !result.document._id) {
          console.log("Skipping result with invalid document structure:", result);
          return false;
        }
        return documentIds.includes(result.document._id);
      });

      console.log("Filtered vector results:", filteredResults.length);

      if (filteredResults.length > 0) {
        return filteredResults.slice(0, limit).map((result: any) => ({
          documentId: result.document._id,
          title: result.document.title,
          snippet: result.chunkText || result.document.content.substring(0, 300),
          score: result._score || 0.8,
        }));
      }
    }
  } catch (vectorError) {
    console.error("Vector search failed:", vectorError);
  }

  // Fallback to keyword matching if vector search fails
  console.log("Falling back to keyword search...");
  try {
    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        try {
          const doc = await convex.query(api.documents.getDocumentById, {
            documentId: docId as any,
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
          const response = await fetch(`http://localhost:3211/api/documents/${docId}`);
          if (!response.ok) {
            console.error(`Failed to fetch document ${docId}: ${response.status}`);
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

    // Step 2: Build context from search results
    let context = "";
    if (vectorResults.length > 0) {
      // Use enhanced search results as context with better formatting
      context = `Based on the following relevant information from your documents:\n\n${vectorResults
        .map(
          (result, index) =>
            `${index + 1}. From "${result.title}":\n${result.snippet}`
        )
        .join(
          "\n\n"
        )}\n\nPlease answer the question based on this information. If the information doesn't contain the answer, say you don't know.`;
    } else {
      // Fallback to full document content if no vector results
      console.log("No vector results, using full document context...");
      context = await getDocumentContext(documentIds);
      
      // Add better instructions for the fallback case
      context = `I couldn't find specific information related to your question, but here is the content of the documents you selected:\n\n${context}\n\nPlease answer the question based on this information if possible. If the information doesn't contain the answer, say you don't know.`;
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
        max_length: 150,  // Reduced for faster responses
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
        api.ragChat.getConversationBySessionId,
        {
          sessionId: currentSessionId,
        }
      );

      let conversationId;
      if (!conversation) {
        // Create new conversation
        conversationId = await convex.mutation(api.ragChat.createConversation, {
          sessionId: currentSessionId,
          documentIds: documentIds as any[],
          title: `Chat about ${documentIds.length} document${documentIds.length > 1 ? "s" : ""}`,
          llmModel: llmResult.model_info?.model_name || "lightweight-llm",
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
      await convex.mutation(api.ragChat.addMessage, {
        conversationId: conversationId as any,
        messageId: `msg_${Date.now()}_user`,
        role: "user",
        content: message,
        tokenCount: llmResult.usage?.input_tokens || 0,
      });

      // Save assistant message
      await convex.mutation(api.ragChat.addMessage, {
        conversationId: conversationId as any,
        messageId: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: llmResult.response,
        tokenCount: llmResult.usage?.output_tokens || 0,
        processingTimeMs: processingTime,
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
