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
    const limit = parseInt(searchParams.get("limit") || "20");
    const threadDocId = searchParams.get("threadDocId");

    // Handle specific thread by ID
    if (threadDocId) {
      const thread = await convex.query(api.threads.getThreadById, {
        threadDocId: threadDocId as Id<"telegram_threads">,
      });
      return NextResponse.json(thread);
    }

    // Handle threads by chat ID or get all active threads
    if (chatId) {
      const threads = await convex.query(api.threads.getThreadsInChat, {
        chatId: parseInt(chatId),
        limit,
      });
      return NextResponse.json(threads);
    } else {
      const threads = await convex.query(api.threads.getAllActiveThreads, {
        limit,
      });
      return NextResponse.json(threads);
    }
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}
