import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const llmUrl = process.env.VECTOR_CONVERT_LLM_URL || process.env.VECTOR_CONVERT_LLM_INTERNAL_URL || 'http://vector-convert-llm:8081';
    const healthUrl = `${llmUrl}/health`;
    
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
        status: 'error',
        ready: false,
        message: `LLM service returned ${response.status}: ${response.statusText}`,
        details: {
          service_status: `HTTP ${response.status}`,
          model_loaded: false,
          error: `${response.status}: ${response.statusText}`,
          uptime: null
        }
      }, { status: 200 }); // Return 200 but with error status in body
    }

    const healthData = await response.json();
    
    // Map the Python service status to our frontend status
    let actualStatus: string;
    let ready = healthData.ready || false;
    
    switch (healthData.status) {
      case 'healthy':
        actualStatus = 'healthy';
        ready = true;
        break;
      case 'loading':
        actualStatus = 'loading';
        ready = false;
        break;
      case 'starting':
        actualStatus = 'starting';
        ready = false;
        break;
      case 'error':
        actualStatus = 'error';
        ready = false;
        break;
      default:
        actualStatus = 'connecting';
        ready = false;
    }
    
    // Transform the health response to our expected format
    return NextResponse.json({
      success: true,
      status: actualStatus,
      ready: ready,
      message: healthData.message || 'LLM service status unknown',
      model: healthData.model,
      details: {
        service_status: healthData.status || 'unknown',
        model_loaded: healthData.model_loaded !== false,
        model_loading: healthData.model_loading || false,
        uptime: healthData.uptime?.toString(),
        error: healthData.error || null
      }
    });

  } catch (error) {
    console.error('Error checking LLM status:', error);
    
    // Handle timeout or connection errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      status: 'connecting',
      ready: false,
      message: `Cannot connect to LLM service: ${errorMessage}`,
      details: {
        service_status: 'disconnected',
        model_loaded: false,
        model_loading: false,
        error: errorMessage,
        uptime: null
      }
    }, { status: 200 }); // Return 200 but with connecting status in body
  }
}




