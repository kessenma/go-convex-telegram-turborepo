import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { documentId } = body;

    // Validate required fields
    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing required field: documentId' },
        { status: 400 }
      );
    }

    // Get the Convex HTTP API URL from environment variables
    const convexUrl = process.env.CONVEX_HTTP_URL || process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3211';
    
    // Call the Convex individual document embedding API
    const response = await fetch(`${convexUrl}/api/embeddings/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Convex API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate embedding', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}