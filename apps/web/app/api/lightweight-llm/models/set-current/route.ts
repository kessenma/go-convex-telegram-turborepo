import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { modelId } = await req.json();
    
    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'Model ID is required' },
        { status: 400 }
      );
    }
    
    // Get the LLM service URL from environment variables
    const llmUrl = process.env.LIGHTWEIGHT_LLM_URL || process.env.LIGHTWEIGHT_LLM_INTERNAL_URL || 'http://localhost:8000';
    
    // Make request to the LLM service to set the current model
    const response = await fetch(`${llmUrl}/admin/switch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model_id: modelId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `Failed to set current model: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      current_model: modelId,
      ...data
    });
    
  } catch (error) {
    console.error('Error setting current model:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}