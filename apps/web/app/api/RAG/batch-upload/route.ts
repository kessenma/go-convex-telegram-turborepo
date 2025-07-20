import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.documents || !Array.isArray(body.documents)) {
      return NextResponse.json(
        { error: "Missing or invalid documents array" },
        { status: 400 }
      );
    }

    // Validate each document
    for (let i = 0; i < body.documents.length; i++) {
      const doc = body.documents[i];
      if (!doc.title || !doc.content || !doc.contentType) {
        return NextResponse.json(
          {
            error: `Document ${i + 1}: Missing required fields: title, content, contentType`,
          },
          { status: 400 }
        );
      }

      // Validate content type
      if (!["markdown", "text"].includes(doc.contentType)) {
        return NextResponse.json(
          {
            error: `Document ${i + 1}: contentType must be 'markdown' or 'text'`,
          },
          { status: 400 }
        );
      }

      // Validate content length (max 1MB)
      if (doc.content.length > 1024 * 1024) {
        return NextResponse.json(
          {
            error: `Document ${i + 1}: Content too large. Maximum size is 1MB`,
          },
          { status: 400 }
        );
      }
    }

    // Get Convex URL from environment
    const convexUrl =
      process.env.CONVEX_URL ||
      process.env.NEXT_PUBLIC_CONVEX_URL ||
      "http://localhost:3211";
    if (!convexUrl) {
      console.error("CONVEX_URL not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Forward request to Convex HTTP API
    const convexResponse = await fetch(`${convexUrl}/api/documents/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documents: body.documents,
      }),
    });

    const convexResult = await convexResponse.json();

    if (!convexResponse.ok) {
      console.error("Convex API error:", convexResult);
      return NextResponse.json(
        { error: convexResult.error || "Failed to save documents" },
        { status: convexResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      processed: convexResult.processed,
      successful: convexResult.successful,
      failed: convexResult.failed,
      results: convexResult.results,
      errors: convexResult.errors,
      message: convexResult.message,
    });
  } catch (error) {
    console.error("Batch upload API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
