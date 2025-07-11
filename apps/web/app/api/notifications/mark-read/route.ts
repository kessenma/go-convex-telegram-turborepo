import { NextRequest, NextResponse } from 'next/server';

const CONVEX_API_BASE = process.env.CONVEX_URL || 'http://localhost:3001';

// PUT /api/notifications/mark-read - Mark a notification as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.notificationId) {
      return NextResponse.json(
        { error: 'Missing required field: notificationId' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${CONVEX_API_BASE}/api/notifications/mark-read`, {
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
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}