import { NextResponse } from "next/server";

export async function GET() {
  try {
    const llmUrl = process.env.LIGHTWEIGHT_LLM_URL || 
                  process.env.LIGHTWEIGHT_LLM_INTERNAL_URL || 
                  "http://localhost:8082";
    
    const response = await fetch(`${llmUrl}/models/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`LLM service returned ${response.status}: ${response.statusText}`);
      
      // Return a proper response structure even when the service is down
      return NextResponse.json({
        success: false,
        error: `LLM service returned ${response.status}`,
        models: {},
        current_model: null,
        timestamp: Date.now()
      });
    }

    const data = await response.json();
    
    // Ensure the response has the expected structure
    const formattedResponse = {
      success: true,
      models: data.models || {},
      current_model: data.current_model || null,
      timestamp: data.timestamp || Date.now(),
      ...data
    };
    
    return NextResponse.json(formattedResponse);

  } catch (error) {
    console.error("Error fetching models status:", error);
    
    // Always return 200 with error information instead of 500
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      models: {},
      current_model: null,
      timestamp: Date.now()
    });
  }
}