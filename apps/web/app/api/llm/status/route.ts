import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Redirect to consolidated metrics endpoint and extract vector service data
    const metricsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/llm/metrics`);
    
    if (!metricsResponse.ok) {
      throw new Error(`Metrics endpoint returned ${metricsResponse.status}`);
    }

    const metricsData = await metricsResponse.json();
    const vectorService = metricsData.services?.vector;

    if (!vectorService) {
      throw new Error('Vector service data not available');
    }

    // Transform to legacy format for backward compatibility
    return NextResponse.json({
      success: metricsData.success,
      status: vectorService.status,
      ready: vectorService.ready,
      message: vectorService.message,
      model: vectorService.model,
      details: {
        service_status: vectorService.status,
        model_loaded: vectorService.ready,
        model_loading: vectorService.status === 'loading',
        uptime: vectorService.uptime?.toString(),
        error: vectorService.error || null,
        timestamp: new Date().toISOString(),
      },
      memory_usage: vectorService.memory_usage,
    });

  } catch (error) {
    console.error("Error checking LLM status:", error);

    // Fallback to direct service check
    try {
      const llmUrl =
        process.env.VECTOR_CONVERT_LLM_URL ||
        process.env.VECTOR_CONVERT_LLM_INTERNAL_URL ||
        "http://vector-convert-llm:8081";
      
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
          ready: healthData.ready || healthData.model_loaded || false,
          message: healthData.message || "Direct health check",
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
        message: `Cannot connect to LLM service: ${error instanceof Error ? error.message : "Unknown error"}`,
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
