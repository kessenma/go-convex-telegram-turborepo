// apps/web/app/api/users/active-count/route.ts

import { type NextRequest, NextResponse } from "next/server";

const CONVEX_HTTP_URL = process.env.CONVEX_HTTP_URL || process.env.CONVEX_URL || "http://localhost:3210";

export async function GET(_request: NextRequest) {
  try {
    console.log("Fetching active user count...");
    const response = await fetch(`${CONVEX_HTTP_URL}/api/users/active-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Active user count:", result);

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching active user count:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch active user count",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Session action:", body);

    const response = await fetch(`${CONVEX_HTTP_URL}/api/users/active-count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Session update result:", result);

    return NextResponse.json({
      success: true,
      message: result.message || "Session update successful",
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
