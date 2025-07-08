import { NextRequest, NextResponse } from 'next/server';

const CONVEX_URL = process.env.CONVEX_HTTP_URL || process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3211';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const cursor = searchParams.get('cursor');
    
    // Build query parameters
    const params = new URLSearchParams({
      limit,
      ...(cursor && { cursor })
    });

    const convexUrl = `${CONVEX_URL}/api/documents?${params.toString()}`;
    
    const response = await fetch(convexUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Convex API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter only documents that have embeddings
    const embeddedDocuments = {
      ...data,
      page: data.page?.filter((doc: any) => doc.embedding && doc.embedding.length > 0) || []
    };

    return NextResponse.json(embeddedDocuments);
  } catch (error) {
    console.error('Error fetching embedded documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch embedded documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentIds } = body;

    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json(
        { error: 'documentIds array is required' },
        { status: 400 }
      );
    }

    const convexUrl = `${CONVEX_URL}/api/documents/embeddings/batch`;
    
    const response = await fetch(convexUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentIds }),
    });

    if (!response.ok) {
      throw new Error(`Convex API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error batch generating embeddings:', error);
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
}