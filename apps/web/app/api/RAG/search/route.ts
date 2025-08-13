// COMMENTED OUT - Vector search functionality is currently broken and not needed for MVP
// This will be re-enabled once vector search is properly implemented

/*
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
*/

/*
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
*/

import { NextRequest, NextResponse } from "next/server";

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

    // Since vector search is disabled, we'll implement a simple text-based search
    // This is a fallback until the vector search is fixed
    const convexUrl = process.env.CONVEX_HTTP_URL || 'http://localhost:3211';
    
    // Get documents
    const documentsResponse = await fetch(`${convexUrl}/api/documents`);
    if (!documentsResponse.ok) {
      throw new Error(`Failed to fetch documents: ${documentsResponse.statusText}`);
    }
    
    const documentsData = await documentsResponse.json();
    const documents = documentsData.documents || [];
    
    console.log(`Found ${documents.length} documents for text search`);
    
    // Simple text search implementation
    const results = documents
      .filter((doc: any) => {
        // Check if document content or title contains the query (case insensitive)
        const content = (doc.content || "").toLowerCase();
        const title = (doc.title || "").toLowerCase();
        const queryLower = query.toLowerCase();
        return content.includes(queryLower) || title.includes(queryLower);
      })
      .map((doc: any, index: number) => {
        // Find a snippet containing the query
        const content = doc.content || "";
        const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
        let snippet = "";
        
        if (queryIndex >= 0) {
          // Extract a snippet around the query match
          const start = Math.max(0, queryIndex - 100);
          const end = Math.min(content.length, queryIndex + query.length + 100);
          snippet = content.substring(start, end);
          
          // Add ellipsis if needed
          if (start > 0) snippet = "..." + snippet;
          if (end < content.length) snippet = snippet + "...";
        } else {
          // If query is in title but not content, use the beginning of content
          snippet = content.substring(0, 200) + (content.length > 200 ? "..." : "");
        }
        
        return {
          _id: doc._id,
          _score: 1.0 - (index * 0.1), // Simple scoring based on order
          title: doc.title,
          content: content,
          snippet: snippet,
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

    console.log(`✅ Text search found ${results.length} results`);

    return NextResponse.json({
      success: true,
      results: results,
      total: results.length,
      query,
      limit,
      searchType: "text", // Indicate this is text search, not vector search
    });
  } catch (error) {
    console.error("Search API error:", error);
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

    // Since vector search is disabled, we'll implement a simple text-based search
    const convexUrl = process.env.CONVEX_HTTP_URL || 'http://localhost:3211';
    
    // Get documents - either all or specific ones if documentIds is provided
    let documents: any[] = [];
    
    if (documentIds && documentIds.length > 0) {
      // Fetch specific documents by IDs
      documents = await Promise.all(
        documentIds.map(async (docId: string) => {
          try {
            // Try both endpoints for document retrieval
            let response = await fetch(
              `${convexUrl}/api/documents/by-id?documentId=${docId}`
            );
            
            // If that fails, try the direct path endpoint
            if (!response.ok) {
              response = await fetch(`${convexUrl}/api/documents/${docId}`);
            }
            
            if (!response.ok) {
              console.error(`Failed to fetch document ${docId}: ${response.status}`);
              return null;
            }
            
            return await response.json();
          } catch (error) {
            console.error(`Error fetching document ${docId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null results
      documents = documents.filter(Boolean);
    } else {
      // Get all documents
      const documentsResponse = await fetch(`${convexUrl}/api/documents`);
      if (!documentsResponse.ok) {
        throw new Error(`Failed to fetch documents: ${documentsResponse.statusText}`);
      }
      
      const documentsData = await documentsResponse.json();
      documents = documentsData.documents || [];
    }
    
    console.log(`Found ${documents.length} documents for text search`);
    
    // Simple text search implementation
    const results = documents
      .filter((doc: any) => {
        // Check if document content or title contains the query (case insensitive)
        const content = (doc.content || "").toLowerCase();
        const title = (doc.title || "").toLowerCase();
        const queryLower = query.toLowerCase();
        return content.includes(queryLower) || title.includes(queryLower);
      })
      .map((doc: any, index: number) => {
        // Find a snippet containing the query
        const content = doc.content || "";
        const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
        let snippet = "";
        
        if (queryIndex >= 0) {
          // Extract a snippet around the query match
          const start = Math.max(0, queryIndex - 100);
          const end = Math.min(content.length, queryIndex + query.length + 100);
          snippet = content.substring(start, end);
          
          // Add ellipsis if needed
          if (start > 0) snippet = "..." + snippet;
          if (end < content.length) snippet = snippet + "...";
        } else {
          // If query is in title but not content, use the beginning of content
          snippet = content.substring(0, 200) + (content.length > 200 ? "..." : "");
        }
        
        return {
          _id: doc._id,
          _score: 1.0 - (index * 0.1), // Simple scoring based on order
          title: doc.title,
          content: content,
          snippet: snippet,
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

    console.log(`✅ Text search found ${results.length} results`);

    return NextResponse.json({
      success: true,
      results: results,
      total: results.length,
      query,
      limit,
      documentIds,
      searchType: "text", // Indicate this is text search, not vector search
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
