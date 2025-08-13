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
    console.log(`Fetching document context for ${documentIds.length} documents:`, documentIds);
    
    if (!documentIds || documentIds.length === 0) {
      console.warn("No document IDs provided for context");
      return "";
    }
    
    // Use direct HTTP API call to fetch documents
    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        try {
          // Try multiple endpoints for document retrieval with better error handling
          const convexUrl = process.env.CONVEX_HTTP_URL || "http://localhost:3211";
          let doc = null;
          let errorMessages: string[] = [];
          
          // First try the by-id endpoint with query parameter
          try {
            console.log(`Trying to fetch document with query param: ${docId}`);
            const response = await fetch(
              `${convexUrl}/api/documents/by-id?documentId=${docId}`
            );
            
            if (response.ok) {
              const result = await response.json();
              if (result && result.content) {
                console.log(`Successfully fetched document via query param: ${result.title}`);
                return result;
              } else {
                errorMessages.push(`Query param endpoint returned invalid document: ${JSON.stringify(result)}`);
              }
            } else {
              errorMessages.push(`Query param endpoint failed: ${response.status}`);
            }
          } catch (e: any) {
            errorMessages.push(`Query param endpoint error: ${e.message}`);
          }
          
          // Try the direct path endpoint
          try {
            console.log(`Trying to fetch document with direct path: ${docId}`);
            const response = await fetch(`${convexUrl}/api/documents/${docId}`);
            
            if (response.ok) {
              const result = await response.json();
              if (result && result.content) {
                console.log(`Successfully fetched document via direct path: ${result.title}`);
                return result;
              } else {
                errorMessages.push(`Direct path endpoint returned invalid document: ${JSON.stringify(result)}`);
              }
            } else {
              errorMessages.push(`Direct path endpoint failed: ${response.status}`);
            }
          } catch (e: any) {
            errorMessages.push(`Direct path endpoint error: ${e.message}`);
          }
          
          // Try the documents/by-ids endpoint as a last resort
          try {
            console.log(`Trying to fetch document with by-ids endpoint: ${docId}`);
            const response = await fetch(`${convexUrl}/api/documents/by-ids`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ documentIds: [docId] }),
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result && result.documents && result.documents.length > 0) {
                console.log(`Successfully fetched document via by-ids endpoint: ${result.documents[0].title}`);
                return result.documents[0];
              } else {
                errorMessages.push(`by-ids endpoint returned invalid document: ${JSON.stringify(result)}`);
              }
            } else {
              errorMessages.push(`by-ids endpoint failed: ${response.status}`);
            }
          } catch (e: any) {
            errorMessages.push(`by-ids endpoint error: ${e.message}`);
          }
          
          // If all attempts failed, log the errors and return null
          console.error(`All attempts to fetch document ${docId} failed:`, errorMessages);
          return null;
        } catch (error) {
          console.error(`Error fetching document ${docId}:`, error);
          return null;
        }
      })
    );

    const validDocuments = documents.filter(Boolean);
    console.log("Valid documents found:", validDocuments.length);

    if (validDocuments.length === 0) {
      console.warn("No valid documents found for context");
      return "";
    }

    // Combine document content (truncate if too long)
    const context = validDocuments
      .map((doc) => (doc ? `Document: ${doc.title}\n${doc.content}` : ""))
      .filter(Boolean)
      .join("\n\n")
      .substring(0, 8000); // Limit context size

    console.log(`Generated context of ${context.length} characters`);
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
