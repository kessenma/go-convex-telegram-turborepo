import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Docker daemon is typically accessible via Unix socket or TCP
    // For this implementation, we'll check if Docker is running by attempting to connect
    // to the Docker API or checking container status

    // In a real implementation, you might use Docker SDK or make HTTP calls to Docker API
    // For now, we'll simulate Docker status based on environment or actual Docker checks

    const dockerHost = process.env.DOCKER_HOST || "unix:///var/run/docker.sock";

    // Mock Docker status response - in production, you'd query actual Docker API
    const dockerStatus = {
      success: true,
      status: "healthy",
      ready: true,
      message: "18gb ram allocated",
      services: [
        {
          name: "web-dashboard",
          status: "running",
          health: "healthy",
          port: process.env.WEB_DASHBOARD_PORT || "3000",
          uptime: "2h 15m",
          restarts: 0,
        },
        {
          name: "convex-backend",
          status: "running",
          health: "healthy",
          port: process.env.CONVEX_DASHBOARD_PORT || "3210",
          uptime: "2h 15m",
          restarts: 0,
        },
        {
          name: "vector-convert-llm",
          status: "running",
          health: "healthy",
          port: process.env.VECTOR_CONVERT_LLM_PORT || "8081",
          uptime: "2h 15m",
          restarts: 0,
        },
        {
          name: "telegram-bot",
          status: "running",
          health: "healthy",
          uptime: "2h 15m",
          restarts: 0,
        },
      ],
      networks: [
        {
          name: "telegram-bot-network",
          driver: "bridge",
          scope: "local",
          attachedServices: 4,
          // Remove ports from here, handled per-service
        },
      ],
      // Remove resources, not available in Next.js API
      environment: {
        DOCKER_HOST: dockerHost,
        WEB_DASHBOARD_PORT: process.env.WEB_DASHBOARD_PORT || "3000",
        CONVEX_DASHBOARD_PORT: process.env.CONVEX_DASHBOARD_PORT || "3210",
        VECTOR_CONVERT_LLM_PORT: process.env.VECTOR_CONVERT_LLM_PORT || "8081",
      },
      timestamp: Date.now(),
    };

    return NextResponse.json(dockerStatus);
  } catch (error) {
    console.error("Error checking Docker status:", error);
    return NextResponse.json(
      {
        success: false,
        status: "error",
        ready: false,
        message: "Failed to connect to Docker daemon",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        },
      },
      { status: 500 }
    );
  }
}
