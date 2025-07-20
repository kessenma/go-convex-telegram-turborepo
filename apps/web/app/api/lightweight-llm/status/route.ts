import { NextResponse } from "next/server";

export async function GET() {
  try {
    const llmUrl = process.env.LIGHTWEIGHT_LLM_URL || "http://localhost:8082";
    const healthUrl = `${llmUrl}/health`;

    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: "error",
          ready: false,
          message: `Lightweight LLM service returned ${response.status}: ${response.statusText}`,
          details: {
            service_status: `HTTP ${response.status}`,
            model_loaded: false,
            error: `${response.status}: ${response.statusText}`,
            uptime: null,
          },
        },
        { status: 200 }
      ); // Return 200 but with error status in body
    }

    const healthData = await response.json();

    // Map the Python service status to our frontend status
    let actualStatus: string;
    let ready = healthData.model_loaded || false;

    if (healthData.status === "healthy" && healthData.model_loaded) {
      actualStatus = "healthy";
      ready = true;
    } else if (healthData.status === "healthy" && !healthData.model_loaded) {
      actualStatus = "loading";
      ready = false;
    } else {
      actualStatus = "connecting";
      ready = false;
    }

    // Transform the health response to our expected format
    return NextResponse.json({
      success: true,
      status: actualStatus,
      ready: ready,
      message: ready ? "Lightweight LLM ready for chat" : "Model loading...",
      model: "distilgpt2",
      details: {
        service_status: healthData.status || "unknown",
        model_loaded: healthData.model_loaded !== false,
        gpu_available: healthData.gpu_available || false,
        timestamp: new Date().toISOString(),
      },
      memory_usage: healthData.memory_usage, // propagate memory usage if present
    });
  } catch (error) {
    console.error("Error checking Lightweight LLM status:", error);

    // Handle timeout or connection errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        status: "connecting",
        ready: false,
        message: `Cannot connect to Lightweight LLM service: ${errorMessage}`,
        details: {
          service_status: "disconnected",
          model_loaded: false,
          error: errorMessage,
        },
      },
      { status: 200 }
    ); // Return 200 but with connecting status in body
  }
}
