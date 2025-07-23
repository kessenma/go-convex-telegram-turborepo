import { type NextRequest, NextResponse } from "next/server";

const CONVEX_API_BASE = process.env.CONVEX_HTTP_URL || process.env.CONVEX_URL || "http://localhost:3211";

// PUT /api/notifications/mark-all-read - Mark all notifications as read
export async function PUT(_request: NextRequest) {
  try {
    const response = await fetch(
      `${CONVEX_API_BASE}/api/notifications/mark-all-read`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error(`Convex API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      {
        error: "Failed to mark all notifications as read",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
