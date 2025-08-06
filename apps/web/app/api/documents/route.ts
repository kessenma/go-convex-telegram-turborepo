import { type NextRequest, NextResponse } from "next/server";

// Cross-compatibility: Try Docker service name first, then localhost
const DOCKER_CONVEX_URL = "http://convex-backend:3211";
const LOCAL_CONVEX_URL = process.env.CONVEX_HTTP_URL || "http://localhost:3211";

// Helper function to try multiple endpoints for cross-compatibility
async function tryConvexEndpoints(path: string, options?: RequestInit): Promise<Response> {
  const endpoints = [DOCKER_CONVEX_URL, LOCAL_CONVEX_URL];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint}${path}`, options);
      if (response.ok || response.status < 500) {
        return response;
      }
    } catch (error) {
      console.warn(`Failed to connect to ${endpoint}:`, error);
      continue;
    }
  }
  
  throw new Error("All Convex endpoints failed");
}

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

    const response = await tryConvexEndpoints(`/api/documents?${params}`);
    
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

    const response = await tryConvexEndpoints(`/api/documents`, {
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
