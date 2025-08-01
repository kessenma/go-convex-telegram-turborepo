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

export interface GeneralChatRequestBody {
  messages: Message[];
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as GeneralChatRequestBody;
    
    if (!messages || !messages.length) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    console.log("General Chat - Starting...");
    console.log("Messages:", messages.length);

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
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
            context: "", // No context for general chat
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

        // Create a response object with the LLM response
        const responseObject = {
          response: llmResult.response
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
    console.error("General Chat API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}