import { type NextRequest, NextResponse } from "next/server";

const CONVEX_HTTP_URL = process.env.CONVEX_HTTP_URL || "http://localhost:3211";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "20";
    const cursor = searchParams.get("cursor") || undefined;

    // Build query parameters
    const params = new URLSearchParams({ limit });
    if (cursor) {
      params.append("cursor", cursor);
    }

    const response = await fetch(`${CONVEX_HTTP_URL}/api/documents?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const documents = await response.json();
    return NextResponse.json(documents);
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
    const { title, content, contentType, summary, tags } = body;

    const response = await fetch(`${CONVEX_HTTP_URL}/api/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        contentType,
        summary,
        tags,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const document = await response.json();
    return NextResponse.json(document);
  } catch (error) {
    console.error("Error saving document:", error);
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 }
    );
  }
}
