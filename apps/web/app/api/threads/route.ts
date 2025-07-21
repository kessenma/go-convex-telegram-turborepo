import { type NextRequest, NextResponse } from "next/server";

const CONVEX_URL =
  process.env.CONVEX_URL ||
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "http://localhost:3211";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const limit = searchParams.get("limit") || "20";
    const threadDocId = searchParams.get("threadDocId");

    // Handle specific thread by ID
    if (threadDocId) {
      const params = new URLSearchParams();
      params.append("threadDocId", threadDocId);

      const response = await fetch(
        `${CONVEX_URL}/api/threads/by-id?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Convex API error: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Build query parameters for Convex API
    const params = new URLSearchParams();
    if (chatId) params.append("chatId", chatId);
    params.append("limit", limit);

    const response = await fetch(`${CONVEX_URL}/api/threads?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Convex API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}
