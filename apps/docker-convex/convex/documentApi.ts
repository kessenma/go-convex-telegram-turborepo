// apps/docker-convex/convex/documentApi.ts
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// Save a new document
export const saveDocumentAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.content || !body.contentType) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: title, content, contentType" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Validate content type
    if (!['markdown', 'text'].includes(body.contentType)) {
      return new Response(
        JSON.stringify({ 
          error: "contentType must be 'markdown' or 'text'" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Validate content length (max 1MB)
    if (body.content.length > 1024 * 1024) {
      return new Response(
        JSON.stringify({ 
          error: "Content too large. Maximum size is 1MB" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const documentId = await ctx.runMutation(api.documents.saveDocument, {
      title: body.title,
      content: body.content,
      contentType: body.contentType,
      tags: body.tags,
      summary: body.summary,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId,
        message: "Document saved successfully"
      }),
      { 
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error saving document:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// Get documents with pagination
export const getDocumentsAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const cursor = url.searchParams.get("cursor") || undefined;
    const searchTerm = url.searchParams.get("search") || undefined;

    let documents;
    
    if (searchTerm) {
      // Use search functionality
      documents = await ctx.runQuery(api.documents.searchDocuments, {
        searchTerm,
        limit,
      });
    } else {
      // Get all documents with pagination
      documents = await ctx.runQuery(api.documents.getAllDocuments, {
        limit,
        cursor,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        documents
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching documents:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// Get document statistics
export const getDocumentStatsAPI = httpAction(async (ctx, request) => {
  try {
    const stats = await ctx.runQuery(api.documents.getDocumentStats, {});

    return new Response(
      JSON.stringify({ 
        success: true, 
        stats
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching document stats:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});