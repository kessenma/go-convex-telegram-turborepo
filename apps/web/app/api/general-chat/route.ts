import { NextRequest, NextResponse } from "next/server";

// Types for flexibility between two payload shapes
interface BaseMessage {
  id?: string;
  role: "user" | "assistant" | "system" | "function";
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

interface MessagesPayload {
  messages: BaseMessage[];
  conversation_id?: string;
  is_new_conversation?: boolean;
}

interface SingleMessagePayload {
  message: string;
  conversation_id?: string;
  is_new_conversation?: boolean;
}

const LIGHTWEIGHT_LLM_URL =
  process.env.LIGHTWEIGHT_LLM_URL ||
  process.env.LIGHTWEIGHT_LLM_INTERNAL_URL ||
  "http://localhost:8082";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MessagesPayload | SingleMessagePayload;

    // Derive message and conversation history depending on provided payload shape
    let message = "";
    let conversation_history:
      | { role: string; content: string }[]
      | undefined = undefined;
    let is_new_conversation = false;
    let conversation_id: string | undefined = undefined;

    if ("messages" in body && Array.isArray(body.messages)) {
      // Determine the last user message and prior history
      const lastUserMessage = [...body.messages].filter(
        (m) => m.role === "user"
      ).pop();
      if (!lastUserMessage) {
        return NextResponse.json(
          { error: "No user message found" },
          { status: 400 }
        );
      }

      message = lastUserMessage.content;
      conversation_history = body.messages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      is_new_conversation = Boolean(
        (body as MessagesPayload).is_new_conversation
      );
      conversation_id = (body as MessagesPayload).conversation_id;
    } else if ("message" in body && typeof body.message === "string") {
      // Single message payload (used by title-generation call)
      message = body.message;
      conversation_history = [];
      is_new_conversation = Boolean(
        (body as SingleMessagePayload).is_new_conversation
      );
      conversation_id = (body as SingleMessagePayload).conversation_id;
    } else {
      return NextResponse.json(
        { error: "Invalid request body: missing message(s)" },
        { status: 400 }
      );
    }

    // Call the Python LLM service. For general chat, no RAG context.
    const llmResponse = await fetch(`${LIGHTWEIGHT_LLM_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        context: "",
        conversation_history,
        max_length: 200,
        temperature: 0.7,
        // Critical fields to enable title generation in Python
        conversation_id,
        is_new_conversation,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error("LLM service error:", errorText);
      return NextResponse.json(
        { error: "LLM service error", details: errorText },
        { status: 502 }
      );
    }

    const llmResult = await llmResponse.json();

    // Return JSON with both response and optional generated_title
    return NextResponse.json({
      response: llmResult.response,
      generated_title: llmResult.generated_title ?? null,
      usage: llmResult.usage ?? null,
      model_info: llmResult.model_info ?? null,
    });
  } catch (error: any) {
    console.error("General chat API error:", error?.message || error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
