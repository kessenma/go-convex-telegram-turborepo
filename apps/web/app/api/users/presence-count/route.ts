import { type NextRequest, NextResponse } from "next/server";
import { api } from "../../../../docker-convex/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(_request: NextRequest) {
  try {
    const result = await convex.query(api.presence.getActiveUserCount, {});
    
    return NextResponse.json({
      success: true,
      total: result.total,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error("Error fetching presence count:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch presence count",
        details: error instanceof Error ? error.message : "Unknown error",
        total: 0,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}