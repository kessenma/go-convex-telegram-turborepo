import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "../../../../generated-convex";

const convex = new ConvexHttpClient(
  process.env.CONVEX_HTTP_URL || "http://localhost:3211"
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, documentIds } = body;

    if (!query || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { error: "Query and document IDs are required" },
        { status: 400 }
      );
    }

    console.log("🔍 RAG Debug - Starting analysis...");
    console.log("Query:", query);
    console.log("Document IDs:", documentIds);

    // Step 1: Check documents
    const documents = await Promise.all(
      documentIds.map(async (docId: string) => {
        try {
          const doc = await convex.query(api.documents.getDocumentById, {
            documentId: docId as any,
          });
          return doc;
        } catch (error) {
          console.error(`Error fetching document ${docId}:`, error);
          return null;
        }
      })
    );

    const validDocuments = documents.filter(Boolean);
    console.log("✅ Valid documents:", validDocuments.length);

    // Step 2: Check embeddings for each document
    const embeddingInfo = await Promise.all(
      validDocuments.map(async (doc: any) => {
        try {
          const embeddings = await convex.query(api.embeddings.getDocumentEmbeddings, {
            documentId: doc._id,
          });
          
          return {
            documentId: doc._id,
            title: doc.title,
            hasEmbedding: doc.hasEmbedding,
            embeddingCount: embeddings.length,
            embeddings: embeddings.map((emb: any) => ({
              id: emb._id,
              dimensions: emb.embeddingDimensions,
              model: emb.embeddingModel,
              hasChunk: !!emb.chunkText,
              chunkIndex: emb.chunkIndex,
              chunkPreview: emb.chunkText?.substring(0, 100),
            })),
          };
        } catch (error) {
          console.error(`Error fetching embeddings for ${doc._id}:`, error);
          return {
            documentId: doc._id,
            title: doc.title,
            hasEmbedding: doc.hasEmbedding,
            embeddingCount: 0,
            error: error.message,
          };
        }
      })
    );

    console.log("📊 Embedding info:", embeddingInfo);

    // Step 3: Test vector search
    let vectorSearchResults = [];
    try {
      console.log("🔍 Testing vector search...");
      // TODO: Fix this endpoint - searchDocumentsByVector doesn't exist
       // vectorSearchResults = await convex.action(
       //   api.embeddings.searchDocumentsByVector,
       //   {
       //     queryText: query,
       //     limit: 5,
       //   }
       // );
       vectorSearchResults = [];
      console.log("✅ Vector search results:", vectorSearchResults.length);
    } catch (vectorError) {
      console.error("❌ Vector search failed:", vectorError);
    }

    // Step 4: Test query embedding generation
    let queryEmbedding: any = null;
    try {
      console.log("🧮 Testing query embedding generation...");
      queryEmbedding = await convex.action(api.embeddings.generateEmbedding, {
        text: query,
      });
      console.log("✅ Query embedding generated, dimension:", queryEmbedding?.length);
    } catch (embeddingError) {
      console.error("❌ Query embedding failed:", embeddingError);
    }

    // Step 5: Analyze results
    const analysis = {
      query,
      documentIds,
      documents: validDocuments.map((doc: any) => ({
        id: doc._id,
        title: doc.title,
        hasEmbedding: doc.hasEmbedding,
        contentLength: doc.content?.length || 0,
      })),
      embeddingInfo,
      vectorSearch: {
        resultsCount: vectorSearchResults.length,
        results: vectorSearchResults.map((result: any) => ({
          documentId: result.documentId,
          title: result.document?.title,
          score: result._score,
          isChunkResult: result.isChunkResult,
          chunkIndex: result.chunkIndex,
          hasExpandedContext: !!result.expandedContext,
          snippetPreview: (result.expandedContext || result.chunkText || result.document?.content)?.substring(0, 150),
        })),
      },
      queryEmbedding: {
        generated: !!queryEmbedding,
        dimension: (queryEmbedding as any)?.length,
      },
    };

    return NextResponse.json({
      success: true,
      analysis,
      recommendations: generateRecommendations(analysis),
    });

  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

function generateRecommendations(analysis: any): string[] {
  const recommendations: string[] = [];

  // Check if documents have embeddings
  const docsWithoutEmbeddings = analysis.documents.filter((doc: any) => !doc.hasEmbedding);
  if (docsWithoutEmbeddings.length > 0) {
    recommendations.push(
      `❌ ${docsWithoutEmbeddings.length} document(s) don't have embeddings. Generate embeddings first.`
    );
  }

  // Check embedding counts
  const embeddingCounts: number[] = analysis.embeddingInfo.map((info: any) => info.embeddingCount);
  const totalEmbeddings = embeddingCounts.reduce((sum: number, count: number) => sum + count, 0);
  
  if (totalEmbeddings === 0) {
    recommendations.push("❌ No embeddings found. Your documents need to be processed for vector search.");
  } else {
    recommendations.push(`✅ Found ${totalEmbeddings} total embeddings across all documents.`);
  }

  // Check vector search results
  if (analysis.vectorSearch.resultsCount === 0) {
    recommendations.push("❌ Vector search returned no results. Check if embeddings exist and query is meaningful.");
  } else {
    const chunkResults = analysis.vectorSearch.results.filter((r: any) => r.isChunkResult);
    recommendations.push(`✅ Vector search found ${analysis.vectorSearch.resultsCount} results (${chunkResults.length} chunk-based).`);
  }

  // Check query embedding
  if (!analysis.queryEmbedding.generated) {
    recommendations.push("❌ Failed to generate query embedding. Check vector service.");
  } else {
    recommendations.push(`✅ Query embedding generated successfully (${analysis.queryEmbedding.dimension}D).`);
  }

  // Check result quality
  const highScoreResults = analysis.vectorSearch.results.filter((r: any) => r.score > 0.7);
  if (highScoreResults.length === 0 && analysis.vectorSearch.resultsCount > 0) {
    recommendations.push("⚠️ All search results have low relevance scores. Consider improving document chunking or query phrasing.");
  }

  return recommendations;
}

export async function GET() {
  return NextResponse.json({
    message: "RAG Debug API",
    usage: "POST with { query: string, documentIds: string[] } to debug RAG search",
  });
}