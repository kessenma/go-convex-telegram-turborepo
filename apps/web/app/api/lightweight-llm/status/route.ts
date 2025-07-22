import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Redirect to consolidated metrics endpoint and extract chat service data
    const metricsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/llm/metrics`);
    
    if (!metricsResponse.ok) {
      throw new Error(`Metrics endpoint returned ${metricsResponse.status}`);
    }

    const metricsData = await metricsResponse.json();
    const chatService = metricsData.services?.chat;

    if (!chatService) {
      throw new Error('Chat service data not available');
    }

    // Transform to legacy format for backward compatibility
    return NextResponse.json({
      success: metricsData.success,
      status: chatService.status,
      ready: chatService.ready,
      message: chatService.ready ? "Lightweight LLM ready for chat" : chatService.message,
      model: chatService.model || "llama-3.2-1b",
      details: {
        service_status: chatService.status,
        model_loaded: chatService.ready,
        gpu_available: false,
        timestamp: new Date().toISOString(),
      },
      memory_usage: chatService.memory_usage,
    });

  } catch (error) {
    console.error("Error checking Lightweight LLM status:", error);

    // Fallback to direct service check
    try {
      const llmUrl = process.env.LIGHTWEIGHT_LLM_URL || "http://localhost:8082";
      
      const response = await fetch(`${llmUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const healthData = await response.json();
        return NextResponse.json({
          success: true,
          status: healthData.status || "unknown",
          ready: healthData.model_loaded || false,
          message: healthData.model_loaded ? "Ready for chat" : "Model loading...",
          memory_usage: healthData.memory_usage,
        });
      }
    } catch (fallbackError) {
      console.error("Fallback health check also failed:", fallbackError);
    }

    // Final fallback
    return NextResponse.json(
      {
        success: false,
        status: "connecting",
        ready: false,
        message: `Cannot connect to Lightweight LLM service: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: {
          service_status: "disconnected",
          model_loaded: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 200 }
    );
  }
}
