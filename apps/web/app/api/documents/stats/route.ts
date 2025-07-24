import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../generated-convex";

const convex = new ConvexHttpClient(
  process.env.CONVEX_HTTP_URL || "http://localhost:3211"
);

export async function GET() {
  try {
    // Use the HTTP API endpoint instead of direct Convex query until types are regenerated
    const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/documents/enhanced-stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const stats = await response.json();
    return Response.json(stats);
  } catch (error) {
    console.error('Failed to fetch document stats:', error);
    return Response.json(
      { error: 'Failed to fetch document stats' },
      { status: 500 }
    );
  }
}
