import { NextRequest, NextResponse } from 'next/server';
import { sessionManager, SessionManager } from '../../../../lib/session-manager';

export async function POST(request: NextRequest) {
  let sessionId: string | undefined;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    // Try to acquire the lightweight LLM service
    const acquisition = sessionManager.acquireService(SessionManager.LIGHTWEIGHT_LLM);
    if (!acquisition.success) {
      return NextResponse.json({
        success: false,
        error: acquisition.message,
        serviceUnavailable: true
      }, { status: 503 });
    }

    sessionId = acquisition.sessionId;
    
    const llmUrl = process.env.LIGHTWEIGHT_LLM_URL || 'http://localhost:8082';
    const chatUrl = `${llmUrl}/chat`;

    // Forward the request to the lightweight LLM service
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: body.message,
        context: body.context || '',
        conversation_history: body.conversation_history || [],
        max_length: body.max_length || 512,
        temperature: body.temperature || 0.7
      }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000), // 30 second timeout for chat generation
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lightweight LLM chat error:', response.status, errorText);
      
      return NextResponse.json({
        success: false,
        error: `Lightweight LLM service error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const chatData = await response.json();

    // Return the chat response
    return NextResponse.json({
      success: true,
      response: chatData.response,
      model_info: chatData.model_info,
      usage: chatData.usage
    });

  } catch (error) {
    console.error('Error in lightweight LLM chat:', error);
    
    // Handle timeout or connection errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: `Failed to connect to Lightweight LLM service: ${errorMessage}`
    }, { status: 500 });
  } finally {
    // Always release the service when done
    if (sessionId) {
      sessionManager.releaseService(SessionManager.LIGHTWEIGHT_LLM, sessionId);
    }
  }
}
