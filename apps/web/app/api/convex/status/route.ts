import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use the internal Convex URL for server-side requests
    const convexUrl = process.env.CONVEX_HTTP_URL || process.env.CONVEX_URL || 'http://localhost:3211';
    const healthUrl = `${convexUrl}/api/health`;
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: 'disconnected',
        ready: false,
        message: `Convex service returned ${response.status}: ${response.statusText}`,
        details: {
          service_status: `HTTP ${response.status}`,
          error: `${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString()
        }
      }, { status: 200 }); // Return 200 but with error status in body
    }

    const healthData = await response.json();
    
    // Transform the health response to our expected format
    return NextResponse.json({
      success: true,
      status: 'connected',
      ready: true,
      message: 'Convex database connected',
      details: {
        service_status: healthData.status || 'healthy',
        timestamp: healthData.timestamp || new Date().toISOString(),
        service: healthData.service || 'convex-backend'
      }
    });

  } catch (error) {
    console.error('Error checking Convex status:', error);
    
    // Handle timeout or connection errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      status: 'connecting',
      ready: false,
      message: `Cannot connect to Convex service: ${errorMessage}`,
      details: {
        service_status: 'disconnected',
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 }); // Return 200 but with connecting status in body
  }
}