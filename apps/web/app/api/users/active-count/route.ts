import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This endpoint is for backward compatibility
    // Return a simple response that won't break existing code
    return NextResponse.json({
      success: true,
      data: {
        total: 0,
        requester: {
          ip: 'unknown',
          country: 'unknown'
        }
      }
    });
  } catch (error) {
    console.error('Active count API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get active count'
    }, { status: 500 });
  }
}