// apps/web/app/api/users/active-count/cleanup/route.ts

// apps/web/app/api/users/active-count/cleanup/route.ts

import { type NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  try {
    // Skip Convex integration during build/deployment
    return NextResponse.json({
      status: "success",
      message: "Session cleanup temporarily disabled",
      cleanedUp: 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in cleanup route:", error);

    return NextResponse.json(
        {
          status: "error",
          message: "Cleanup route failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
    );
  }
}
