import { NextRequest, NextResponse } from 'next/server';

// Define the LLM service URL
const LIGHTWEIGHT_LLM_URL = process.env.LIGHTWEIGHT_LLM_URL || 
                           process.env.LIGHTWEIGHT_LLM_INTERNAL_URL || 
                           "http://localhost:8082";

// Define message types
export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

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
    
    // Create a TransformStream to handle the streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Make the API call in the background
    (async () => {
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
          await writer.write(encoder.encode("Sorry, I encountered an error. Please try again later."));
          await writer.close();
          return;
        }

        const llmResult = await llmResponse.json();
        console.log("LLM Response generated successfully");

        // Get document sources if available
        let sources = [];
        if (documentIds.length > 0) {
          try {
            // Use the RAG search API to get sources
            const vectorSearchResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/RAG/search`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: lastUserMessage.content,
                limit: 3,
                documentIds
              })
            });
            
            if (vectorSearchResponse.ok) {
              const vectorResult = await vectorSearchResponse.json();
              
              if (vectorResult.success && vectorResult.results && vectorResult.results.length > 0) {
                sources = vectorResult.results.slice(0, 3).map((result: any) => ({
                  documentId: result._id,
                  title: result.title,
                  snippet: (result.content || result.snippet || '').substring(0, 200),
                  score: result._score
                }));
              }
            }
          } catch (error) {
            console.error("Error getting sources:", error);
          }
        }
        
        // Create a response object with the LLM response and sources
        const responseObject = {
          response: llmResult.response,
          sources: sources
        };
        
        // Stream the JSON response
        await writer.write(encoder.encode(JSON.stringify(responseObject)));
        await writer.close();
      } catch (error) {
        console.error("Error in streaming response:", error);
        await writer.write(encoder.encode("Sorry, I encountered an error. Please try again later."));
        await writer.close();
      }
    })();

    // Return the streaming response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
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
