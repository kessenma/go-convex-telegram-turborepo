import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Create a new conversion job
export const createConversionJobAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { jobId, jobType, documentId, inputText, requestSource, userId } = body;

    if (!jobId || !jobType) {
      return new Response(
        JSON.stringify({ error: "jobId and jobType are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const jobData = {
      jobId,
      jobType,
      status: "pending",
      documentId: documentId ? documentId as Id<"rag_documents"> : undefined,
      inputText,
      requestSource,
      userId,
      createdAt: Date.now(),
    };

    const jobDocId = await ctx.runMutation(api.conversionJobs.createJob, jobData);

    return new Response(
      JSON.stringify({ success: true, jobDocId, jobId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating conversion job:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create conversion job" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Update conversion job status
export const updateConversionJobAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { jobId, status, outputData, errorMessage, processingTimeMs, llmModel, embeddingDimensions } = body;

    if (!jobId || !status) {
      return new Response(
        JSON.stringify({ error: "jobId and status are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const updateData: any = {
      jobId,
      status,
      outputData,
      errorMessage,
      processingTimeMs,
      llmModel,
      embeddingDimensions,
    };

    if (status === "processing") {
      updateData.startedAt = Date.now();
    } else if (status === "completed" || status === "failed") {
      updateData.completedAt = Date.now();
    }

    const result = await ctx.runMutation(api.conversionJobs.updateJobByJobId, updateData);

    return new Response(
      JSON.stringify({ success: true, updated: result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating conversion job:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update conversion job" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Get conversion jobs with pagination and filtering
export const getConversionJobsAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const jobType = url.searchParams.get("jobType") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const userId = url.searchParams.get("userId") || undefined;

    const result = await ctx.runQuery(api.conversionJobs.getConversionJobs, {
      page: Math.floor(offset / limit) + 1,
      limit,
      jobType,
      status,
      userId,
    });

    return new Response(
      JSON.stringify({
        jobs: result.jobs,
        totalJobs: result.totalJobs,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching conversion jobs:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch conversion jobs" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Get conversion job statistics
export const getConversionJobStatsAPI = httpAction(async (ctx, request) => {
  try {
    const stats = await ctx.runQuery(api.conversionJobs.getJobStats);

    return new Response(
      JSON.stringify(stats),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching conversion job stats:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch conversion job stats" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// Get conversion job by ID
export const getConversionJobByIdAPI = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const jobId = url.pathname.split("/").pop();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "Job ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const job = await ctx.runQuery(api.conversionJobs.getJobByJobId, { jobId });

    if (!job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(job),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching conversion job:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch conversion job" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});