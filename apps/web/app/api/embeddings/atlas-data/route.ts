import { type NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../generated-convex";

// Ensure compatibility with edge runtime if needed
export const runtime = 'nodejs'; // Use nodejs runtime for better Convex compatibility

/**
 * EMBEDDING ATLAS DATA API
 * ========================
 * 
 * Fetches embedding data formatted for Embedding Atlas visualization
 * Returns embeddings with 2D projections and metadata using generated Convex client
 */

export async function OPTIONS(request: NextRequest) {
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500); // Cap at 500 for performance
    const offset = parseInt(searchParams.get('offset') || '0');

    // Initialize Convex client with environment URL - prioritize internal URLs for production
    // In Docker, use CONVEX_HTTP_URL (internal network), fallback to others for local dev
    const convexUrl = process.env.CONVEX_HTTP_URL || process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3210";

    console.log('Environment variables check:', {
      CONVEX_HTTP_URL: process.env.CONVEX_HTTP_URL,
      CONVEX_URL: process.env.CONVEX_URL,
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
      finalUrl: convexUrl
    });

    if (!convexUrl || convexUrl === "http://localhost:3210") {
      console.error('Convex URL not properly configured for production');
      return NextResponse.json(
        {
          success: false,
          error: "Convex URL not configured",
          details: "Missing CONVEX_HTTP_URL or CONVEX_URL environment variable"
        },
        { status: 500 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);
    console.log('Using Convex client with URL:', convexUrl);

    // Get embeddings with document metadata for atlas visualization with pagination
    console.log('Attempting to query embeddings with limit:', limit, 'offset:', offset);
    const embeddings = await client.query(api.embeddings.getAllEmbeddingsForAtlas, {
      limit,
      offset
    });
    console.log('Successfully fetched embeddings:', embeddings?.length || 0);

    // Get total count for pagination
    console.log('Attempting to get embeddings count');
    const totalCount = await client.query(api.embeddings.getEmbeddingsCount, {});
    console.log('Total embeddings count:', totalCount);

    // Transform data for Embedding Atlas with better 2D projection
    const atlasData = embeddings.map((embedding: any, index: number) => {
      // Simple PCA-like projection using first few dimensions
      const vec = embedding.embedding;
      const x = (vec[0] || 0) * 50 + (vec[2] || 0) * 25;
      const y = (vec[1] || 0) * 50 + (vec[3] || 0) * 25;

      return {
        id: embedding._id,
        document_id: embedding.documentId, // Add document ID for viewing full document
        x: x + Math.random() * 5, // Add small jitter to prevent overlap
        y: y + Math.random() * 5,
        text: embedding.chunkText || embedding.documentTitle || `Chunk ${embedding.chunkIndex || 0}`,
        document_title: embedding.documentTitle,
        chunk_index: embedding.chunkIndex || 0,
        embedding_model: embedding.embeddingModel,
        created_at: new Date(embedding.createdAt).toISOString(),
        dimensions: embedding.embeddingDimensions,
        content_type: embedding.documentContentType,
        // Include the full embedding for similarity calculations
        embedding_vector: embedding.embedding
      };
    });

    return NextResponse.json({
      success: true,
      data: atlasData,
      count: atlasData.length,
      total: totalCount,
      hasMore: offset + limit < totalCount
    }, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });

  } catch (error) {
    console.error("Error fetching atlas data:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');

    // Check if it's a Convex connection error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isConvexError = errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED');

    return NextResponse.json(
      {
        success: false,
        error: isConvexError ? "Failed to connect to Convex backend" : "Failed to fetch embedding data",
        details: errorMessage,
        convexUrl: process.env.CONVEX_HTTP_URL || process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}