import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../generated-convex";

const convex = new ConvexHttpClient(
  process.env.CONVEX_HTTP_URL || "http://localhost:3211"
);

export async function GET() {
  try {
    const stats = await convex.query(api.documents.getDocumentStats, {});
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching document stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch document stats" },
      { status: 500 }
    );
  }
}
