import { type NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../generated-convex";
import type { GenericId as Id } from "convex/values";

const convex = new ConvexHttpClient(
  process.env.CONVEX_HTTP_URL || "http://localhost:3211"
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const threadDocId = searchParams.get("threadDocId");

    // Handle messages by thread document ID
    if (threadDocId) {
      const messages = await convex.query(api.messages.getMessagesByThreadDoc, {
        threadDocId: threadDocId as Id<"telegram_threads">,
        limit,
      });
      return NextResponse.json(messages);
    }

    // Handle messages by chat ID or get all messages
    if (chatId) {
      const messages = await convex.query(api.messages.getMessagesByChatId, {
        chatId: parseInt(chatId),
        limit,
      });
      return NextResponse.json(messages);
    } else {
      const messages = await convex.query(api.messages.getAllMessages, {
        limit,
      });
      return NextResponse.json(messages);
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, messageId, messageThreadId, messageType, text, threadDocId, timestamp } = body;

    // Save message to specific thread if threadDocId is provided
    if (threadDocId) {
      const message = await convex.mutation(api.messages.saveMessageToThread, {
        chatId,
        messageId,
        messageThreadId,
        messageType,
        text,
        threadDocId: threadDocId as Id<"telegram_threads">,
        timestamp,
      });
      return NextResponse.json(message);
    } else {
      // Save general message
      const message = await convex.mutation(api.messages.saveMessage, {
        chatId,
        messageId,
        messageThreadId,
        messageType,
        text,
        timestamp,
      });
      return NextResponse.json(message);
    }
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
