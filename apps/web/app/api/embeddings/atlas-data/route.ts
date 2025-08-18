import { type NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../generated-convex";

// Ensure compatibility with edge runtime if needed
export const runtime = "nodejs"; // Use nodejs runtime for better Convex compatibility

/**
 * EMBEDDING ATLAS DATA API
 * ========================
 *
 * Strategy:
 * 1) Try Convex HTTP router endpoint (CONVEX_HTTP_URL + /http/api/embeddings/atlas-data)
 * 2) If that 404s with "No matching routes found", fall back to ConvexHttpClient
 *    using the websocket/base URL (CONVEX_URL or NEXT_PUBLIC_CONVEX_URL) and call
 *    api.embeddings.getBasicEmbeddingsForAtlas directly.
 */

function normalizeHttpBase(url: string) {
  if (!url) return "";
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.endsWith("/http") ? trimmed : `${trimmed}/http`;
}

function normalizeWsBase(url: string) {
  if (!url) return "";
  // Ensure we are NOT pointing at /http for the WS/base client
  return url.replace(/\/http\/?$/, "").replace(/\/+$/, "");
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500); // Cap at 500 for performance
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Prefer Convex HTTP router URL (internal in Docker), fallback to localhost default
    const rawHttp = process.env.CONVEX_HTTP_URL || "http://localhost:3210";
    const convexHttpBase = normalizeHttpBase(rawHttp);

    // WS/base URL for ConvexHttpClient fallback
    const rawWs = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3211";
    const convexWsBase = normalizeWsBase(rawWs);

    console.log("=== ATLAS DATA API DEBUG START ===");
    console.log("Request URL:", request.url);
    console.log("Search params:", { limit, offset });
    console.log("Environment variables check:", {
      CONVEX_HTTP_URL: process.env.CONVEX_HTTP_URL,
      CONVEX_URL: process.env.CONVEX_URL,
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
      httpBase: convexHttpBase,
      wsBase: convexWsBase,
    });

    if (!convexHttpBase && !convexWsBase) {
      console.error("Convex URLs not properly configured");
      return NextResponse.json(
        {
          success: false,
          error: "Convex URL(s) not configured",
          details:
            "Missing CONVEX_HTTP_URL and CONVEX_URL/NEXT_PUBLIC_CONVEX_URL environment variables.",
        },
        { status: 500 }
      );
    }

    let embeddings: any[] = [];
    let totalCount = 0;
    let usedMode: "http" | "client" = "http";

    // 1) Try HTTP router first if available
    if (convexHttpBase) {
      const httpUrl = `${convexHttpBase}/api/embeddings/atlas-data?limit=${limit}&offset=${offset}`;
      console.log("Fetching embeddings from Convex HTTP:", httpUrl);

      const resp = await fetch(httpUrl, { method: "GET" });
      if (resp.ok) {
        const payload = await resp.json();
        // The Convex handler typically returns: { success, embeddings, count }
        embeddings = payload.embeddings || payload.data || [];
        totalCount = payload.total ?? payload.count ?? 0;
        console.log("HTTP embeddings fetched:", embeddings?.length || 0, "totalCount:", totalCount);
      } else {
        const text = await resp.text();
        console.error("Convex HTTP error:", resp.status, text);

        if (resp.status === 404) {
          // Fall back to Convex client when route isn't registered on this instance
          usedMode = "client";
        } else {
          // Hard error for non-404 issues
          return NextResponse.json(
            {
              success: false,
              error: "Failed to fetch embedding data",
              details: `Convex HTTP ${resp.status}: ${text}`,
              convexUrl: convexHttpBase,
              timestamp: new Date().toISOString(),
            },
            { status: 500 }
          );
        }
      }
    } else {
      usedMode = "client";
    }

    // 2) Fallback to ConvexHttpClient against WS/base URL
    if (usedMode === "client") {
      console.log("Falling back to ConvexHttpClient with base:", convexWsBase);
      if (!convexWsBase) {
        return NextResponse.json(
          {
            success: false,
            error: "Convex base URL for client not configured",
            details: "Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variables",
          },
          { status: 500 }
        );
      }

      try {
        const client = new ConvexHttpClient(convexWsBase);
        const [embRes, countRes] = await Promise.all([
          client.query(api.embeddings.getBasicEmbeddingsForAtlas, { limit, offset }),
          client.query(api.embeddings.getEmbeddingsCount, {}),
        ]);

        embeddings = embRes || [];
        totalCount = typeof countRes === "number" ? countRes : 0;

        console.log("Client embeddings fetched:", embeddings?.length || 0, "totalCount:", totalCount);
      } catch (clientErr) {
        console.error("Convex client query error:", clientErr);
        const message = clientErr instanceof Error ? clientErr.message : String(clientErr);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch embedding data",
            details: message,
            convexUrl: convexWsBase,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    }

    // Compute hasMore/total when totalCount wasn't provided
    let hasMore: boolean;
    if (totalCount && Number.isFinite(totalCount)) {
      hasMore = offset + embeddings.length < totalCount;
    } else {
      hasMore = embeddings.length === limit;
      totalCount = hasMore ? offset + embeddings.length + 1 : offset + embeddings.length;
    }

    // Transform data for Embedding Atlas with simple 2D projection
    const atlasData = (embeddings || []).map((embedding: any) => {
      const vec: number[] = embedding.embedding || [];
      const x = (vec[0] || 0) * 50 + (vec[2] || 0) * 25;
      const y = (vec[1] || 0) * 50 + (vec[3] || 0) * 25;

      return {
        id: embedding._id,
        document_id: embedding.documentId,
        x: x + Math.random() * 5, // Jitter to prevent overlap
        y: y + Math.random() * 5,
        text: embedding.chunkText || embedding.documentTitle || `Chunk ${embedding.chunkIndex || 0}`,
        document_title: embedding.documentTitle || "Loading...",
        chunk_index: embedding.chunkIndex || 0,
        embedding_model: embedding.embeddingModel,
        created_at: new Date(embedding.createdAt || Date.now()).toISOString(),
        dimensions: embedding.embeddingDimensions,
        content_type: embedding.documentContentType || "unknown",
        // Include the full embedding for similarity calculations
        embedding_vector: embedding.embedding,
      };
    });

    console.log("Final response data:", {
      mode: usedMode,
      atlasDataLength: atlasData.length,
      totalCount,
      hasMore,
    });
    console.log("=== ATLAS DATA API DEBUG END ===");

    return NextResponse.json(
      {
        success: true,
        data: atlasData,
        count: atlasData.length,
        total: totalCount,
        hasMore,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching atlas data:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isConvexError =
      errorMessage.includes("fetch") ||
      errorMessage.includes("network") ||
      errorMessage.includes("ECONNREFUSED");

    return NextResponse.json(
      {
        success: false,
        error: isConvexError ? "Failed to connect to Convex backend" : "Failed to fetch embedding data",
        details: errorMessage,
        convexUrl: process.env.CONVEX_HTTP_URL,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
