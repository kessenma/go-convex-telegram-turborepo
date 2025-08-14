import { NextRequest, NextResponse } from "next/server";

async function textSearchFallback(query: string, limit: number) {
  const convexUrl = process.env.CONVEX_HTTP_URL || "http://localhost:3211";
  const documentsResponse = await fetch(`${convexUrl}/api/documents`);
  if (!documentsResponse.ok) {
    throw new Error(`Failed to fetch documents: ${documentsResponse.statusText}`);
  }
  const documentsData = await documentsResponse.json();
  const documents = documentsData.documents || documentsData.page || [];

  // Extract potential numeric values from the query
  const numericValues = extractNumericValues(query);
  const hasNumericQuery = numericValues.length > 0;
  
  const results = documents
    .filter((doc: any) => {
      const content = (doc.content || "").toLowerCase();
      const title = (doc.title || "").toLowerCase();
      const queryLower = query.toLowerCase();
      
      // If query contains numeric values, prioritize documents with those values
      if (hasNumericQuery) {
        return numericValues.some(value => 
          content.includes(value) || title.includes(value)
        ) || content.includes(queryLower) || title.includes(queryLower);
      }
      
      return content.includes(queryLower) || title.includes(queryLower);
    })
    .map((doc: any, index: number) => {
      const content = doc.content || "";
      let queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
      let snippet = "";
      
      // Check for numeric values in the query and find them in the content
      const numericValues = extractNumericValues(query);
      if (numericValues.length > 0 && queryIndex < 0) {
        // Try to find any of the numeric values in the content
        for (const value of numericValues) {
          const valueIndex = content.indexOf(value);
          if (valueIndex >= 0) {
            queryIndex = valueIndex;
            break;
          }
        }
      }
      
      if (queryIndex >= 0) {
        // Expand the context window to capture more surrounding text
        const start = Math.max(0, queryIndex - 150);
        const end = Math.min(content.length, queryIndex + query.length + 150);
        snippet = content.substring(start, end);
        if (start > 0) snippet = "..." + snippet;
        if (end < content.length) snippet = snippet + "...";
      } else {
        snippet = content.substring(0, 200) + (content.length > 200 ? "..." : "");
      }
      return {
        _id: doc._id,
        _score: 1.0 - index * 0.1,
        title: doc.title,
        content,
        snippet,
        contentType: doc.contentType,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        wordCount: doc.wordCount,
        summary: doc.summary,
        isChunkResult: false,
        chunkIndex: 0,
      };
    })
    .slice(0, limit);

  return {
    success: true,
    results,
    total: results.length,
    query,
    limit,
    searchType: "text",
  };
}

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

    const convexUrl = process.env.CONVEX_HTTP_URL || process.env.CONVEX_URL || "http://localhost:3211";
    const searchUrl = `${convexUrl}/api/embeddings/search?queryText=${encodeURIComponent(query)}&limit=${limit}`;

    const response = await fetch(searchUrl);
    if (!response.ok) {
      // Fallback to text search
      const fallback = await textSearchFallback(query, limit);
      return NextResponse.json(fallback);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Search API error (GET):", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to extract numeric values from a query string
function extractNumericValues(query: string): string[] {
  // Match currency amounts like $6,000 or 6,000 or 6000
  const currencyRegex = /\$?(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)/g;
  const matches = query.match(currencyRegex) || [];
  return matches;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = body.query || body.q;
    const limit = parseInt(body.limit?.toString() || "10");
    const documentIds = body.documentIds;

    if (!query) {
      return NextResponse.json(
        { error: "Missing required field: query or q" },
        { status: 400 }
      );
    }

    const convexUrl = process.env.CONVEX_HTTP_URL || process.env.CONVEX_URL || "http://localhost:3211";
    const response = await fetch(`${convexUrl}/api/embeddings/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queryText: query, limit, documentIds }),
    });

    if (!response.ok) {
      const fallback = await textSearchFallback(query, limit);
      return NextResponse.json(fallback);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Search API error (POST):", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
