// apps/web/app/api/users/active-count/cleanup/route.ts

import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "../../../../../generated-convex";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(_request: NextRequest) {
  try {
    // Trigger session cleanup in Convex
    const result = await convex.mutation(
      api.userSessions.cleanupExpiredSessions
    );

    return NextResponse.json({
      status: "success",
      message: `Cleaned up ${result.cleanedUp} expired sessions`,
      cleanedUp: result.cleanedUp,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error("Error cleaning up sessions:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to cleanup expired sessions",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
