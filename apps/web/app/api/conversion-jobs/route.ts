import { type NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../generated-convex";
import type { GenericId as Id } from "convex/values";

/**
 * CONVERSION JOBS API ENDPOINT
 * ============================
 *
 * PURPOSE: Manages conversion job tracking and monitoring
 *
 * USAGE: Tracks the status and progress of document processing jobs
 * - GET: Retrieves conversion job history with filtering (status, jobType, documentId)
 * - POST: Creates new conversion job records for tracking
 * - PUT: Updates existing conversion job status and results
 *
 * USED BY:
 * - LLM conversion service to track processing jobs
 * - Frontend dashboard to monitor job progress
 * - Analytics and reporting features
 *
 * FLOW: Job Creation → Processing → Status Updates → Completion Tracking
 *
 * RECOMMENDATION: KEEP - Essential for job tracking and monitoring, especially for async operations
 */

const convex = new ConvexHttpClient(
  process.env.CONVEX_HTTP_URL || "http://localhost:3211"
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;
    const jobType = searchParams.get("jobType") || undefined;
    const documentId = searchParams.get("documentId") || undefined;

    const jobs = await convex.query(api.conversionJobs.getConversionJobs, {
      page,
      limit,
      status,
      jobType,
      documentId: documentId ? (documentId as Id<"rag_documents">) : undefined,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching conversion jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversion jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, jobType, status, createdAt, documentId, inputText, requestSource, userId } = body;

    const job = await convex.mutation(api.conversionJobs.createJob, {
      jobId,
      jobType,
      status,
      createdAt,
      documentId: documentId ? (documentId as Id<"rag_documents">) : undefined,
      inputText,
      requestSource,
      userId,
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error creating conversion job:", error);
    return NextResponse.json(
      { error: "Failed to create conversion job" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, status, startedAt, completedAt, processingTimeMs, outputData, errorMessage, llmModel, embeddingDimensions } = body;

    const updatedJob = await convex.mutation(api.conversionJobs.updateJobByJobId, {
      jobId,
      status,
      startedAt,
      completedAt,
      processingTimeMs,
      outputData,
      errorMessage,
      llmModel,
      embeddingDimensions,
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("Error updating conversion job:", error);
    return NextResponse.json(
      { error: "Failed to update conversion job" },
      { status: 500 }
    );
  }
}
