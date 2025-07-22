import { type NextRequest, NextResponse } from "next/server";

const CONVEX_API_BASE = process.env.CONVEX_URL || "http://localhost:3211";

// GET /api/notifications/unread-count - Get unread notifications count
export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(
      `${CONVEX_API_BASE}/api/notifications/unread-count`,
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
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch unread count",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
