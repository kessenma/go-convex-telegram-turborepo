import { type NextRequest, NextResponse } from "next/server";

const _CONVEX_URL =
  process.env.CONVEX_HTTP_URL ||
  process.env.CONVEX_URL ||
  process.env.CONVEX_HTTP_URL ||
  "http://localhost:3211";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get Convex URL from environment
    const convexUrl =
      process.env.CONVEX_HTTP_URL ||
      process.env.CONVEX_URL ||
      process.env.CONVEX_HTTP_URL ||
      "http://localhost:3211";
    if (!convexUrl) {
      console.error("CONVEX_URL not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Forward request to Convex HTTP API to get specific document
    const convexResponse = await fetch(
      `${convexUrl}/http/api/documents/${documentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!convexResponse.ok) {
      const errorText = await convexResponse.text();
      console.error("Convex API error:", errorText);
      return NextResponse.json(
        { error: errorText || "Failed to fetch document" },
        { status: convexResponse.status }
      );
    }

    const convexResult = await convexResponse.json();

    return NextResponse.json(convexResult);
  } catch (error) {
    console.error("Document API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
