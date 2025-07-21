import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "../../../../generated-convex";

const convex = new ConvexHttpClient(
  process.env.CONVEX_URL || "http://localhost:3211"
);
const LIGHTWEIGHT_LLM_URL =
  process.env.LIGHTWEIGHT_LLM_INTERNAL_URL || "http://localhost:8082";
const CONVEX_HTTP_URL = process.env.CONVEX_HTTP_URL || "http://localhost:3211";

interface ChatRequest {
  message: string;
  documentIds: string[];
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  sessionId?: string;
}

// Get document content for context
async function getDocumentContext(documentIds: string[]): Promise<string> {
  try {
    // Use direct HTTP API call instead of ConvexHttpClient for debugging
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
  try {
    const body: ChatRequest = await request.json();
    const { message, documentIds, conversationHistory } = body;

    if (!message || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { error: "Message and document IDs are required" },
        { status: 400 }
      );
    }

    console.log("Test RAG Chat - Message:", message);
    console.log("Test RAG Chat - Document IDs:", documentIds);

    const startTime = Date.now();

    // Step 1: Get document context (skip vector search for now)
    console.log("Getting document context...");
    const context = await getDocumentContext(documentIds);
    console.log("Context length:", context.length);

    if (!context) {
      return NextResponse.json(
        { error: "No document content found" },
        { status: 404 }
      );
    }

    // Step 2: Call the lightweight LLM service directly
    console.log("Calling lightweight LLM service...");
    const llmResponse = await fetch(`${LIGHTWEIGHT_LLM_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        context: `Based on the following document content, please answer the question:\n\n${context}\n\nQuestion: ${message}`,
        conversation_history: conversationHistory,
        max_length: 150, // Reduced for faster responses
        temperature: 0.7,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error("LLM service error:", errorText);
      return NextResponse.json(
        {
          error: "Failed to generate response from LLM service",
          details: errorText,
        },
        { status: 500 }
      );
    }

    const llmResult = await llmResponse.json();
    const processingTime = Date.now() - startTime;

    console.log("LLM Response generated successfully");

    // Step 3: Return response
    return NextResponse.json({
      response: llmResult.response,
      sessionId: "test-session",
      sources: [
        {
          documentId: documentIds[0],
          title: "Test Document",
          snippet: context.substring(0, 300),
          score: 1.0,
        },
      ],
      usage: llmResult.usage,
      processingTimeMs: processingTime,
      model: llmResult.model_info,
    });
  } catch (error) {
    console.error("Test Chat API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test RAG Chat API is running",
    endpoints: {
      POST: "/api/RAG/test-chat - Send a test chat message with document context",
    },
  });
}
