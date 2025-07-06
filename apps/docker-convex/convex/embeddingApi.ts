// apps/docker-convex/convex/embeddingApi.ts
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// Generate embedding for a document
export const generateDocumentEmbeddingAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.documentId) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required field: documentId" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const result = await ctx.runAction(api.embeddings.processDocumentEmbedding, {
      documentId: body.documentId,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        message: "Embedding generated successfully"
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error generating document embedding:", error);
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

// Search documents using vector similarity
export const searchDocumentsVectorAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const queryText = url.searchParams.get("q") || url.searchParams.get("query");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    // Validate required fields
    if (!queryText) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required parameter: q or query" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const results = await ctx.runAction(api.embeddings.searchDocumentsByVector, {
      queryText,
      limit,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        query: queryText,
        limit
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error searching documents by vector:", error);
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

// Check LLM service status and readiness
export const checkLLMServiceStatusAPI = httpAction(async (ctx, request) => {
  try {
    const result = await ctx.runAction(api.embeddings.checkLLMServiceStatus, {});

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...result
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error checking LLM service status:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        status: "error",
        ready: false,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// Batch generate embeddings for all documents without embeddings
export const batchGenerateEmbeddingsAPI = httpAction(async (ctx, request) => {
  try {
    // Get all documents without embeddings
    const documents = await ctx.runQuery(api.documents.getAllDocuments, { limit: 1000 });
    
    const documentsWithoutEmbeddings = documents.page.filter(doc => 
      !doc.embedding || doc.embedding.length === 0
    );

    if (documentsWithoutEmbeddings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "All documents already have embeddings",
          processed: 0
        }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Process embeddings for documents without them
    const results = [];
    for (const doc of documentsWithoutEmbeddings) {
      try {
        const result = await ctx.runAction(api.embeddings.processDocumentEmbedding, {
          documentId: doc._id,
        });
        results.push({ documentId: doc._id, success: true, result });
      } catch (error) {
        console.error(`Error processing embedding for document ${doc._id}:`, error);
        results.push({ 
          documentId: doc._id, 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${documentsWithoutEmbeddings.length} documents`,
        processed: documentsWithoutEmbeddings.length,
        successful: successCount,
        errors: errorCount,
        results
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error batch generating embeddings:", error);
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