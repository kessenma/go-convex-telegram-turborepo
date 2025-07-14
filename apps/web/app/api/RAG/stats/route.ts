import { NextRequest, NextResponse } from 'next/server';

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3211';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${CONVEX_URL}/api/documents/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Convex API error: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching RAG document stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document stats' },
      { status: 500 }
    );
  }
}
