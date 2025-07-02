import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.content || !body.contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, contentType' },
        { status: 400 }
      );
    }

    // Validate content type
    if (!['markdown', 'text'].includes(body.contentType)) {
      return NextResponse.json(
        { error: "contentType must be 'markdown' or 'text'" },
        { status: 400 }
      );
    }

    // Validate content length (max 1MB)
    if (body.content.length > 1024 * 1024) {
      return NextResponse.json(
        { error: 'Content too large. Maximum size is 1MB' },
        { status: 400 }
      );
    }

    // Get Convex URL from environment
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.error('NEXT_PUBLIC_CONVEX_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Forward request to Convex HTTP API
    const convexResponse = await fetch(`${convexUrl}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: body.title,
        content: body.content,
        contentType: body.contentType,
        tags: body.tags,
        summary: body.summary,
      }),
    });

    const convexResult = await convexResponse.json();

    if (!convexResponse.ok) {
      console.error('Convex API error:', convexResult);
      return NextResponse.json(
        { error: convexResult.error || 'Failed to save document' },
        { status: convexResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      documentId: convexResult.documentId,
      message: 'Document uploaded successfully',
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    const cursor = searchParams.get('cursor');
    const search = searchParams.get('search');

    // Get Convex URL from environment
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.error('NEXT_PUBLIC_CONVEX_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams({ limit });
    if (cursor) queryParams.set('cursor', cursor);
    if (search) queryParams.set('search', search);

    // Forward request to Convex HTTP API
    const convexResponse = await fetch(`${convexUrl}/api/documents?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const convexResult = await convexResponse.json();

    if (!convexResponse.ok) {
      console.error('Convex API error:', convexResult);
      return NextResponse.json(
        { error: convexResult.error || 'Failed to fetch documents' },
        { status: convexResponse.status }
      );
    }

    return NextResponse.json(convexResult);

  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}