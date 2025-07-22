import { type NextRequest, NextResponse } from "next/server";
import {
  SessionManager,
  sessionManager,
} from "../../../../lib/session-manager";

/**
 * VECTOR CONVERT LLM PROCESS DOCUMENT API ENDPOINT
 * ===============================================
 *
 * PURPOSE: Proxies document processing requests to the external Python LLM service
 *
 * USAGE: Handles document processing through the vector-convert-llm Python service
 * - Takes a document_id and forwards it to the Python LLM service
 * - Manages session/resource allocation to prevent service overload
 * - Includes timeout handling for long-running operations
 *
 * USED BY:
 * - External systems that need to process documents through the LLM service
 * - Batch processing operations
 * - Alternative processing pipeline (different from direct Convex embedding)
 *
 * FLOW: API Request → Session Management → Python LLM Service → Response
 *
 * RECOMMENDATION: CONSOLIDATE OR REMOVE - This seems to duplicate functionality with the RAG embeddings endpoint.
 * Consider if this is needed or if it can be merged with the primary embedding workflow.
 */

export async function POST(request: NextRequest) {
  let sessionId: string | undefined;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.document_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Document ID is required",
        },
        { status: 400 }
      );
    }

    // Try to acquire the vector conversion service
    const acquisition = sessionManager.acquireService(
      SessionManager.VECTOR_CONVERT
    );
    if (!acquisition.success) {
      return NextResponse.json(
        {
          success: false,
          error: acquisition.message,
          serviceUnavailable: true,
        },
        { status: 503 }
      );
    }

    sessionId = acquisition.sessionId;

    const vectorServiceUrl =
      process.env.VECTOR_CONVERT_LLM_URL || "http://localhost:8081";
    const processUrl = `${vectorServiceUrl}/process-document`;

    // Forward the request to the vector conversion service
    const response = await fetch(processUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_id: body.document_id,
        convex_url:
          body.convex_url ||
          process.env.CONVEX_HTTP_URL ||
          "http://localhost:3211",
      }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(60000), // 60 second timeout for document processing
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Vector conversion service error:",
        response.status,
        errorText
      );

      return NextResponse.json(
        {
          success: false,
          error: `Vector conversion service error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Return the processing result
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in vector conversion:", error);

    // Handle timeout or connection errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: `Failed to connect to vector conversion service: ${errorMessage}`,
      },
      { status: 500 }
    );
  } finally {
    // Always release the service when done
    if (sessionId) {
      sessionManager.releaseService(SessionManager.VECTOR_CONVERT, sessionId);
    }
  }
}
