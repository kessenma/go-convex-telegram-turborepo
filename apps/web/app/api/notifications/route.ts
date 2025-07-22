import { type NextRequest, NextResponse } from "next/server";

const CONVEX_API_BASE = process.env.CONVEX_URL || "http://localhost:3211";

// GET /api/notifications - Get all notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const type = searchParams.get("type");

    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (type) params.append("type", type);

    const response = await fetch(
      `${CONVEX_API_BASE}/api/notifications?${params}`,
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
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.title || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, message" },
        { status: 400 }
      );
    }

    const response = await fetch(`${CONVEX_API_BASE}/api/notifications`, {
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
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      {
        error: "Failed to create notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
