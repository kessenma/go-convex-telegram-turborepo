import { NextRequest, NextResponse } from 'next/server';

const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error('CONVEX_URL environment variable is required');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const status = searchParams.get('status');
    const jobType = searchParams.get('jobType');
    const documentId = searchParams.get('documentId');

    const params = new URLSearchParams({
      page,
      limit,
      ...(status && { status }),
      ...(jobType && { jobType }),
      ...(documentId && { documentId }),
    });

    const response = await fetch(`${CONVEX_URL}/api/conversion-jobs?${params}`);
    
    if (!response.ok) {
      throw new Error(`Convex API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conversion jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversion jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${CONVEX_URL}/api/conversion-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Convex API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating conversion job:', error);
    return NextResponse.json(
      { error: 'Failed to create conversion job' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${CONVEX_URL}/api/conversion-jobs`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Convex API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating conversion job:', error);
    return NextResponse.json(
      { error: 'Failed to update conversion job' },
      { status: 500 }
    );
  }
}