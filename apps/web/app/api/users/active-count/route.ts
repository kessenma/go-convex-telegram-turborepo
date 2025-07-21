// apps/web/app/api/users/active-count/route.ts

import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "../../../../generated-convex";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const CONVEX_API_BASE = process.env.CONVEX_HTTP_URL || "http://localhost:3211";

export async function GET(_request: NextRequest) {
  try {
    // Use the Convex HTTP endpoint instead of direct query
    const response = await fetch(`${CONVEX_API_BASE}/api/users/active-count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Return the data in the expected format
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching active user count from Convex HTTP:", error);

    // Fallback to direct Convex query if HTTP endpoint fails
    try {
      console.log("Falling back to direct Convex query...");
      const userCount = await convex.query(api.userSessions.getActiveUserCount);

      return NextResponse.json({
        status: "success",
        data: {
          activeUsers: userCount.total,
          bySource: userCount.bySource,
          timestamp: userCount.timestamp,
          lastUpdated: new Date().toISOString(),
        },
        message: `${userCount.total} active users (fallback)`,
      });
    } catch (fallbackError) {
      console.error("Fallback query also failed:", fallbackError);

      return NextResponse.json(
        {
          status: "error",
          data: {
            activeUsers: 0,
            bySource: {},
            timestamp: Date.now(),
            lastUpdated: new Date().toISOString(),
          },
          message: "Failed to fetch active user count",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      userId,
      userAgent,
      source = "web",
      metadata,
      action,
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { status: "error", message: "Session ID is required" },
        { status: 400 }
      );
    }

    // Handle session end action
    if (action === "end") {
      // Mark session as inactive using the dedicated endSession mutation
      await convex.mutation(api.userSessions.endSession, {
        sessionId,
      });

      return NextResponse.json({
        status: "success",
        message: "Session ended successfully",
      });
    }

    // Create or update session in Convex (default behavior)
    await convex.mutation(api.userSessions.upsertSession, {
      sessionId,
      userId,
      userAgent,
      source,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    return NextResponse.json({
      status: "success",
      message: "Session updated successfully",
    });
  } catch (error) {
    console.error("Error updating session:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to update session",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
