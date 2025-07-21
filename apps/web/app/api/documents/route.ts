import { type NextRequest, NextResponse } from "next/server";

const CONVEX_URL =
  process.env.CONVEX_HTTP_URL ||
  process.env.CONVEX_URL ||
  process.env.CONVEX_HTTP_URL ||
  "http://localhost:3211";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "20";
    const cursor = searchParams.get("cursor");

    // Build query parameters for Convex API
    const params = new URLSearchParams();
    params.append("limit", limit);
    if (cursor) params.append("cursor", cursor);

    const response = await fetch(`${CONVEX_URL}/http/api/documents?${params}`, {
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
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${CONVEX_URL}/http/api/documents`, {
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
    console.error("Error saving document:", error);
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 }
    );
  }
}
