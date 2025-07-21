import { type NextRequest, NextResponse } from "next/server";

const CONVEX_URL =
  process.env.CONVEX_URL ||
  process.env.CONVEX_HTTP_URL ||
  "http://localhost:3211";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const limit = searchParams.get("limit") || "50";

    // Build query parameters for Convex API
    const params = new URLSearchParams();
    if (chatId) params.append("chatId", chatId);
    params.append("limit", limit);

    const response = await fetch(
      `${CONVEX_URL}/api/telegram/messages?${params}`,
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

    const response = await fetch(`${CONVEX_URL}/api/telegram/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Convex API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
