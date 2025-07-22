import { NextResponse } from "next/server";

interface ServiceHealth {
  status: string;
  ready: boolean;
  message: string;
  memory_usage?: {
    process_memory_mb?: number;
    process_cpu_percent?: number;
    system_memory_used_percent?: number;
    system_memory_available_gb?: number;
  };
  model?: string;
  uptime?: number;
  error?: string;
}

interface MetricsResponse {
  success: boolean;
  services: {
    vector: ServiceHealth;
    chat: ServiceHealth;
  };
  timestamp: number;
  summary: {
    totalMemoryMB: number;
    averageCPU: number;
    healthyServices: number;
    totalServices: number;
  };
}

// Cache to prevent too frequent API calls
let metricsCache: MetricsResponse | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

async function fetchServiceHealth(url: string, serviceName: string): Promise<ServiceHealth> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: "error",
        ready: false,
        message: `${serviceName} service returned ${response.status}`,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    
    // Normalize the response format
    return {
      status: data.status || "unknown",
      ready: data.ready || data.model_loaded || false,
      message: data.message || `${serviceName} status unknown`,
      memory_usage: data.memory_usage || {},
      model: data.model,
      uptime: data.uptime,
      error: data.error,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return {
      status: "disconnected",
      ready: false,
      message: `Cannot connect to ${serviceName} service`,
      error: errorMessage,
    };
  }
}

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (metricsCache && (now - lastCacheTime) < CACHE_DURATION) {
      return NextResponse.json(metricsCache);
    }

    // Service URLs
    const vectorUrl = process.env.VECTOR_CONVERT_LLM_URL || 
                     process.env.VECTOR_CONVERT_LLM_INTERNAL_URL || 
                     "http://vector-convert-llm:8081";
    
    const chatUrl = process.env.LIGHTWEIGHT_LLM_URL || 
                   process.env.LIGHTWEIGHT_LLM_INTERNAL_URL || 
                   "http://lightweight-llm:8082";

    // Fetch health from both services concurrently
    const [vectorHealth, chatHealth] = await Promise.all([
      fetchServiceHealth(`${vectorUrl}/health`, "Vector Convert"),
      fetchServiceHealth(`${chatUrl}/health`, "Chat LLM"),
    ]);

    // Calculate summary metrics
    const vectorMemory = vectorHealth.memory_usage?.process_memory_mb || 0;
    const chatMemory = chatHealth.memory_usage?.process_memory_mb || 0;
    const vectorCPU = vectorHealth.memory_usage?.process_cpu_percent || 0;
    const chatCPU = chatHealth.memory_usage?.process_cpu_percent || 0;

    const totalMemoryMB = vectorMemory + chatMemory;
    const averageCPU = vectorHealth.ready && chatHealth.ready 
      ? (vectorCPU + chatCPU) / 2 
      : vectorHealth.ready 
        ? vectorCPU 
        : chatHealth.ready 
          ? chatCPU 
          : 0;

    const healthyServices = [vectorHealth, chatHealth].filter(s => s.ready).length;

    const metrics: MetricsResponse = {
      success: true,
      services: {
        vector: vectorHealth,
        chat: chatHealth,
      },
      timestamp: now,
      summary: {
        totalMemoryMB,
        averageCPU,
        healthyServices,
        totalServices: 2,
      },
    };

    // Update cache
    metricsCache = metrics;
    lastCacheTime = now;

    return NextResponse.json(metrics);

  } catch (error) {
    console.error("Error fetching LLM metrics:", error);
    
    const errorResponse: MetricsResponse = {
      success: false,
      services: {
        vector: {
          status: "error",
          ready: false,
          message: "Failed to fetch vector service metrics",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        chat: {
          status: "error",
          ready: false,
          message: "Failed to fetch chat service metrics",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      timestamp: Date.now(),
      summary: {
        totalMemoryMB: 0,
        averageCPU: 0,
        healthyServices: 0,
        totalServices: 2,
      },
    };

    return NextResponse.json(errorResponse, { status: 200 }); // Return 200 with error data
  }
}