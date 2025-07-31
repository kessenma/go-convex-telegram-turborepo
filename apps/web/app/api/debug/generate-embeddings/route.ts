import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../generated-convex";

const convex = new ConvexHttpClient(
  process.env.CONVEX_HTTP_URL ||
  "http://localhost:3211"
);

export async function POST() {
  try {
    // Get all documents
    const documents = await convex.query(api.documents.getAllDocuments, {
      limit: 10,
    });

    console.log("Found documents:", documents?.page?.length || 0);

    const results: any[] = [];

    for (const doc of documents?.page || []) {
      try {
        // Check if document already has embeddings
        const existingEmbeddings = await convex.query(
          api.embeddings.getDocumentEmbeddings,
          {
            documentId: doc._id,
          }
        );

        if (existingEmbeddings.length > 0) {
          results.push({
            documentId: doc._id,
            title: doc.title,
            status: "already_has_embeddings",
            embeddingCount: existingEmbeddings.length,
          });
          continue;
        }

        // Generate embeddings for this document
        console.log("Generating embeddings for:", doc.title);
        const result = await convex.action(
          api.embeddings.processDocumentWithChunking,
          {
            documentId: doc._id,
          }
        );

        results.push({
          documentId: doc._id,
          title: doc.title,
          status: "generated",
          result,
        });
      } catch (error) {
        console.error(`Error processing document ${doc._id}:`, error);
        results.push({
          documentId: doc._id,
          title: doc.title,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      totalDocuments: documents.documents.length,
      results,
    });
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return NextResponse.json(
      { error: "Failed to generate embeddings" },
      { status: 500 }
    );
  }
}
