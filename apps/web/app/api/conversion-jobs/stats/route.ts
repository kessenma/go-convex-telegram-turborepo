import { NextRequest, NextResponse } from 'next/server';

const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error('CONVEX_URL environment variable is required');
}

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${CONVEX_URL}/api/conversion-jobs/stats`);
    
    if (!response.ok) {
      throw new Error(`Convex API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conversion job stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversion job stats' },
      { status: 500 }
    );
  }
}