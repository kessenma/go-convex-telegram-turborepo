import { type NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  try {
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
    const convexResponse = await fetch(
      `${convexUrl}/api/documents/embeddings/batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const convexResult = await convexResponse.json();

    if (!convexResponse.ok) {
      console.error("Convex API error:", convexResult);
      return NextResponse.json(
        { error: convexResult.error || "Failed to generate embeddings" },
        { status: convexResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Batch embedding generation completed",
      ...convexResult,
    });
  } catch (error) {
    console.error("Batch embeddings API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
