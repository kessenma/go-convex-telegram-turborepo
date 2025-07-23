import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../generated-convex";

const convex = new ConvexHttpClient(
  process.env.CONVEX_HTTP_URL || "http://localhost:3211"
);

export async function GET() {
  try {
    const stats = await convex.query(api.threads.getThreadStats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching thread stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread stats" },
      { status: 500 }
    );
  }
}
