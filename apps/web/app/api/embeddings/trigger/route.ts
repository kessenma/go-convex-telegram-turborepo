import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 }
      );
    }

    // Get Convex URL from environment
    // If running in Docker, use internal network URL, otherwise use localhost
    const convexUrl =
      process.env.CONVEX_HTTP_URL ||
      process.env.CONVEX_URL ||
      (process.env.NODE_ENV === "production" ? "http://convex-backend:3211" : "http://localhost:3211");
    
    console.log("Environment variables:");
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log("- CONVEX_HTTP_URL:", process.env.CONVEX_HTTP_URL);
    console.log("- CONVEX_URL:", process.env.CONVEX_URL);
    console.log("- Using convexUrl:", convexUrl);
    
    if (!convexUrl) {
      console.error("CONVEX_URL not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Call the Convex action to trigger embedding
    console.log(`Calling Convex at: ${convexUrl}/api/embeddings/trigger`);
    console.log(`Document ID: ${documentId}`);
    
    const convexResponse = await fetch(`${convexUrl}/api/embeddings/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId,
      }),
    });

    console.log(`Convex response status: ${convexResponse.status}`);
    console.log(`Convex response headers:`, Object.fromEntries(convexResponse.headers.entries()));

    let convexResult;
    const responseText = await convexResponse.text();
    console.log(`Convex response text:`, responseText);

    try {
      convexResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Convex response as JSON:", parseError);
      console.error("Raw response:", responseText);
      return NextResponse.json(
        { 
          error: "Invalid response from Convex backend",
          details: `Response was not valid JSON: ${responseText.substring(0, 200)}...`,
          convexStatus: convexResponse.status
        },
        { status: 500 }
      );
    }

    if (!convexResponse.ok) {
      console.error("Convex API error:", convexResult);
      return NextResponse.json(
        { error: convexResult.error || "Failed to trigger embedding" },
        { status: convexResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Embedding triggered successfully",
      result: convexResult,
    });
  } catch (error) {
    console.error("Embedding trigger API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}