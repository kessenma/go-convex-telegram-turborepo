import { type NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../generated-convex";

/**
 * EMBEDDING ATLAS DATA API
 * ========================
 * 
 * Fetches embedding data formatted for Embedding Atlas visualization
 * Returns embeddings with 2D projections and metadata using generated Convex client
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500); // Cap at 500 for performance
    const offset = parseInt(searchParams.get('offset') || '0');

    // Initialize Convex client with environment URL
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "http://localhost:3210";
    const client = new ConvexHttpClient(convexUrl);

    console.log('Using Convex client with URL:', convexUrl);

    // Get embeddings with document metadata for atlas visualization with pagination
    const embeddings = await client.query(api.embeddings.getAllEmbeddingsForAtlas, { 
      limit, 
      offset 
    });

    // Get total count for pagination
    const totalCount = await client.query(api.embeddings.getEmbeddingsCount, {});

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
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch embedding data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}