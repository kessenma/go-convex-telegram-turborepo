import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "../../../../generated-convex";

const convex = new ConvexHttpClient(
  process.env.CONVEX_HTTP_URL || "http://localhost:3211"
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("query");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json(
        { error: "Missing required parameter: q or query" },
        { status: 400 }
      );
    }

    console.log(`🔍 Vector search request: "${query}" (limit: ${limit})`);

    // Use Convex client to call vector search action
    // Use the Convex HTTP endpoint for vector search
    const convexUrl = process.env.CONVEX_URL || 'http://localhost:3211';
    const response = await fetch(`${convexUrl}/api/embeddings/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
         queryText: query,
         limit,
       }),
    });
    
    if (!response.ok) {
      throw new Error(`Convex search failed: ${response.statusText}`);
    }
    
    const searchResults = await response.json();

    console.log(`✅ Vector search found ${searchResults.length} results`);

    // Format results for API response
    const formattedResults = searchResults.map((result: any) => ({
      _id: result.document._id,
      _score: result._score,
      title: result.document.title,
      content: result.expandedContext || result.chunkText || result.document.content,
      snippet: (result.expandedContext || result.chunkText || result.document.content || '').substring(0, 200),
      contentType: result.document.contentType,
      fileSize: result.document.fileSize,
      uploadedAt: result.document.uploadedAt,
      wordCount: result.document.wordCount,
      summary: result.document.summary,
      isChunkResult: result.isChunkResult,
      chunkIndex: result.chunkIndex,
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
      total: searchResults.length,
      query,
      limit,
    });
  } catch (error) {
    console.error("Vector search API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.query && !body.q) {
      return NextResponse.json(
        { error: "Missing required field: query or q" },
        { status: 400 }
      );
    }

    const query = body.query || body.q;
    const limit = parseInt(body.limit?.toString() || "10");
    const documentIds = body.documentIds;

    console.log(`🔍 Vector search POST request: "${query}" (limit: ${limit})`);
    if (documentIds) {
      console.log(`📄 Filtering by ${documentIds.length} document IDs`);
    }

    // Use Convex client to call vector search action
    // Use the Convex HTTP endpoint for vector search
    const convexUrl = process.env.CONVEX_URL || 'http://localhost:3211';
    const searchUrl = `${convexUrl}/api/embeddings/search?queryText=${encodeURIComponent(query)}&limit=${limit}`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`Convex search failed: ${response.statusText}`);
    }
    
    const searchResults = await response.json();

    console.log(`✅ Vector search found ${searchResults.length} results`);

    // Format results for API response
    const formattedResults = searchResults.map((result: any) => ({
      _id: result.document._id,
      _score: result._score,
      title: result.document.title,
      content: result.expandedContext || result.chunkText || result.document.content,
      snippet: (result.expandedContext || result.chunkText || result.document.content || '').substring(0, 200),
      contentType: result.document.contentType,
      fileSize: result.document.fileSize,
      uploadedAt: result.document.uploadedAt,
      wordCount: result.document.wordCount,
      summary: result.document.summary,
      isChunkResult: result.isChunkResult,
      chunkIndex: result.chunkIndex,
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
      total: searchResults.length,
      query,
      limit,
      documentIds,
    });
  } catch (error) {
    console.error("Vector search API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
