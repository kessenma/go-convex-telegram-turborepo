import { NextRequest, NextResponse } from 'next/server';

// Define the Message type since we can't import it from the AI SDK
interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

const LIGHTWEIGHT_LLM_URL = process.env.LIGHTWEIGHT_LLM_URL || 
                           process.env.LIGHTWEIGHT_LLM_INTERNAL_URL || 
                           "http://localhost:8082";

export interface ChatRequestBody {
  messages: Message[];
  documentIds?: string[];
}

// Get document content for context
async function getDocumentContext(documentIds: string[]): Promise<string> {
  try {
    // Use direct HTTP API call to fetch documents
    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        try {
          const response = await fetch(
            `${process.env.CONVEX_HTTP_URL || "http://localhost:3211"}/api/documents/by-id?documentId=${docId}`
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

export async function POST(req: NextRequest) {
  try {
    const { messages, documentIds = [] } = await req.json() as ChatRequestBody;
    
    if (!messages || !messages.length) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    console.log("AI SDK Chat - Starting...");
    console.log("Messages:", messages.length);
    console.log("Document IDs:", documentIds);

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    // Get document context if documentIds are provided
    let context = "";
    if (documentIds.length > 0) {
      console.log("Getting document context...");
      context = await getDocumentContext(documentIds);
      console.log("Context length:", context.length);
    }

    // Convert messages to the format expected by the LLM service
    const conversationHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Create a text encoder for the streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call the LLM service
          const llmResponse = await fetch(`${LIGHTWEIGHT_LLM_URL}/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: lastUserMessage.content,
              context: context ? `Based on the following document content, please answer the question:\n\n${context}` : "",
              conversation_history: conversationHistory,
              max_length: 200,
              temperature: 0.7,
            }),
          });

          if (!llmResponse.ok) {
            const errorText = await llmResponse.text();
            console.error("LLM service error:", errorText);
            controller.enqueue(encoder.encode("Sorry, I encountered an error. Please try again later."));
            controller.close();
            return;
          }

          const llmResult = await llmResponse.json();
          console.log("LLM Response generated successfully");

          // Stream the response
          controller.enqueue(encoder.encode(llmResult.response));
          controller.close();
        } catch (error) {
          console.error("Error in streaming response:", error);
          controller.enqueue(encoder.encode("Sorry, I encountered an error. Please try again later."));
          controller.close();
        }
      }
    });

    // Return the streaming response
    return new Response(stream);
  } catch (error) {
    console.error("AI SDK Chat API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
