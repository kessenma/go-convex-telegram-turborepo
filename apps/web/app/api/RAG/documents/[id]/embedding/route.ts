import { type NextRequest, NextResponse } from "next/server";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3211";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";
    const cursor = searchParams.get("cursor");

    // Build query parameters
    const params = new URLSearchParams({
      limit,
      ...(cursor && { cursor }),
    });

    const convexUrl = `${CONVEX_URL}/api/documents?${params.toString()}`;

    const response = await fetch(convexUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Convex API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter only documents that have embeddings
    const embeddedDocuments = {
      ...data,
      page:
        data.page?.filter(
          (doc: any) => doc.embedding && doc.embedding.length > 0
        ) || [],
    };

    return NextResponse.json(embeddedDocuments);
  } catch (error) {
    console.error("Error fetching embedded documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch embedded documents" },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    // 1. Fetch document content from Convex
    const getDocUrl = `${CONVEX_URL}/api/documents/by-id?documentId=${documentId}`;
    const docResponse = await fetch(getDocUrl);
    if (!docResponse.ok) {
      const errorBody = await docResponse
        .json()
        .catch(() => ({ error: "Failed to parse error response" }));
      return NextResponse.json(
        { error: "Failed to fetch document", details: errorBody },
        { status: docResponse.status }
      );
    }
    const document = await docResponse.json();
    const textToEmbed = document.content;

    if (!textToEmbed) {
      return NextResponse.json(
        { error: "Document has no text content to embed" },
        { status: 400 }
      );
    }

    // 2. Call vector-convert-llm service
    const vectorServiceUrl = "http://vector-convert-llm:8081/encode";
    const vectorResponse = await fetch(vectorServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sentences: [textToEmbed] }),
    });

    if (!vectorResponse.ok) {
      const errorBody = await vectorResponse
        .json()
        .catch(() => ({ error: "Failed to parse error response" }));
      return NextResponse.json(
        { error: "Vector service error", details: errorBody },
        { status: vectorResponse.status }
      );
    }
    const vectorData = await vectorResponse.json();
    const embedding = vectorData.embeddings[0];

    // 3. Save embedding back to Convex
    const saveEmbeddingUrl = `${CONVEX_URL}/api/documents/${documentId}/embedding`;
    const saveResponse = await fetch(saveEmbeddingUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embedding }),
    });

    if (!saveResponse.ok) {
      const errorBody = await saveResponse
        .json()
        .catch(() => ({ error: "Failed to parse error response" }));
      return NextResponse.json(
        { error: "Failed to save embedding", details: errorBody },
        { status: saveResponse.status }
      );
    }

    const result = await saveResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating embedding:", error);
    return NextResponse.json(
      { error: "Failed to generate embedding" },
      { status: 500 }
    );
  }
}
