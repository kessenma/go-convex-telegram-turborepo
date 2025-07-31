import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "../../../../generated-convex";

const convex = new ConvexHttpClient(
  process.env.CONVEX_HTTP_URL || "http://localhost:3211"
);

export async function GET() {
  try {
    console.log("Checking documents and embeddings...");

    // Get all documents
    const documents = await convex.query(api.documents.getAllDocuments, {
      limit: 10,
    });
    console.log("Documents response:", documents);

    // Handle paginated response structure
    const documentsList = documents?.page || [];
    console.log("Found documents:", documentsList.length);

    // Check embeddings for each document
    const documentsWithEmbeddings = await Promise.all(
      documentsList.map(async (doc: any) => {
        try {
          const embeddings = await convex.query(
            api.embeddings.getDocumentEmbeddings,
            {
              documentId: doc._id,
            }
          );
          console.log(`Document ${doc.title}: ${embeddings.length} embeddings`);
          return {
            id: doc._id,
            title: doc.title,
            hasEmbedding: doc.hasEmbedding,
            embeddingCount: embeddings.length,
            contentLength: doc.content.length,
          };
        } catch (error) {
          console.error(`Error checking embeddings for ${doc.title}:`, error);
          return {
            id: doc._id,
            title: doc.title,
            hasEmbedding: false,
            embeddingCount: 0,
            contentLength: doc.content.length,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    // Test vector search if we have documents with embeddings
    let vectorSearchTest: any = null;
    const documentsWithEmbeddings_filtered = documentsWithEmbeddings.filter(
      (d) => d.embeddingCount > 0
    );

    if (documentsWithEmbeddings_filtered.length > 0) {
      try {
        console.log("Testing vector search...");
        const testResults = await convex.action(
          api.embeddings.searchDocumentsByVector,
          {
            queryText: "test query",
            limit: 3,
          }
        );
        vectorSearchTest = {
          success: true,
          resultCount: testResults.length,
          results: testResults.map((r: any) => ({
            documentId: r.document._id,
            title: r.document.title,
            score: r._score,
          })),
        };
        console.log(
          "Vector search test successful:",
          testResults.length,
          "results"
        );
      } catch (error) {
        console.error("Vector search test failed:", error);
        vectorSearchTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return NextResponse.json({
      totalDocuments: documentsList.length,
      documentsWithEmbeddings: documentsWithEmbeddings_filtered.length,
      documents: documentsWithEmbeddings,
      vectorSearchTest,
    });
  } catch (error) {
    console.error("Error checking documents:", error);
    return NextResponse.json(
      {
        error: "Failed to check documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
