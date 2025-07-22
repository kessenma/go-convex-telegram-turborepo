import { type NextRequest, NextResponse } from "next/server";
import {
  SessionManager,
  sessionManager,
} from "../../../../lib/session-manager";

export async function GET(_request: NextRequest) {
  try {
    // Get session manager status
    const chatStatus = sessionManager.getServiceStatus(
      SessionManager.LIGHTWEIGHT_LLM
    );
    const vectorStatus = sessionManager.getServiceStatus(
      SessionManager.VECTOR_CONVERT
    );
    const allSessions = sessionManager.getAllSessions();

    // Get detailed health from metrics endpoint
    let detailedMetrics: {
      services?: {
        chat?: {
          [key: string]: unknown;
        };
        vector?: {
          [key: string]: unknown;
        };
      };
      summary?: {
        [key: string]: unknown;
      };
    } | null = null;
    try {
      const metricsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/llm/metrics`);
      if (metricsResponse.ok) {
        detailedMetrics = await metricsResponse.json();
      }
    } catch (error) {
      console.warn("Could not fetch detailed metrics:", error);
    }

    return NextResponse.json({
      services: {
        chat: {
          id: SessionManager.LIGHTWEIGHT_LLM,
          name: "Chat Service",
          available: chatStatus.available,
          message: chatStatus.message,
          health: detailedMetrics?.services?.chat || null,
        },
        vectorConvert: {
          id: SessionManager.VECTOR_CONVERT,
          name: "Document Conversion Service",
          available: vectorStatus.available,
          message: vectorStatus.message,
          health: detailedMetrics?.services?.vector || null,
        },
      },
      activeSessions: allSessions.map((session) => ({
        serviceId: session.serviceId,
        sessionId: session.sessionId,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        duration: Date.now() - session.startTime,
      })),
      metrics: detailedMetrics?.summary || null,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error getting service status:", error);
    return NextResponse.json(
      { error: "Failed to get service status" },
      { status: 500 }
    );
  }
}
