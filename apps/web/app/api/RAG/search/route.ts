import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');
    const limit = searchParams.get('limit') || '10';

    if (!query) {
      return NextResponse.json(
        { error: 'Missing required parameter: q or query' },
        { status: 400 }
      );
    }

    // Get Convex URL from environment
    const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3211';
    if (!convexUrl) {
      console.error('CONVEX_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams({ 
      q: query,
      limit 
    });

    // Forward request to Convex HTTP API
    const convexResponse = await fetch(`${convexUrl}/api/documents/search?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const convexResult = await convexResponse.json();

    if (!convexResponse.ok) {
      console.error('Convex API error:', convexResult);
      return NextResponse.json(
        { error: convexResult.error || 'Failed to search documents' },
        { status: convexResponse.status }
      );
    }

    return NextResponse.json(convexResult);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
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
        { error: 'Missing required field: query or q' },
        { status: 400 }
      );
    }

    // Get Convex URL from environment
    const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3211';
    if (!convexUrl) {
      console.error('CONVEX_URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Build query parameters for GET request to Convex
    const queryParams = new URLSearchParams({ 
      q: body.query || body.q,
      limit: body.limit?.toString() || '10'
    });

    // Forward request to Convex HTTP API
    const convexResponse = await fetch(`${convexUrl}/api/documents/search?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const convexResult = await convexResponse.json();

    if (!convexResponse.ok) {
      console.error('Convex API error:', convexResult);
      return NextResponse.json(
        { error: convexResult.error || 'Failed to search documents' },
        { status: convexResponse.status }
      );
    }

    return NextResponse.json(convexResult);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
