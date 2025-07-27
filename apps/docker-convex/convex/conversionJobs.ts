import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new conversion job
export const createJob = mutation({
  args: {
    jobId: v.string(),
    jobType: v.string(),
    status: v.string(),
    documentId: v.optional(v.id("rag_documents")),
    inputText: v.optional(v.string()),
    requestSource: v.optional(v.string()),
    userId: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversion_jobs", args);
  },
});

// Update conversion job by jobId
export const updateJobByJobId = mutation({
  args: {
    jobId: v.string(),
    status: v.optional(v.string()),
    outputData: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    processingTimeMs: v.optional(v.number()),
    llmModel: v.optional(v.string()),
    embeddingDimensions: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { jobId, ...updateFields } = args;
    
    // Find the job by jobId
    const job = await ctx.db
      .query("conversion_jobs")
      .filter((q) => q.eq(q.field("jobId"), jobId))
      .first();
    
    if (!job) {
      throw new Error(`Job with jobId ${jobId} not found`);
    }
    
    // Remove undefined fields
    const cleanUpdateFields = Object.fromEntries(
      Object.entries(updateFields).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(job._id, cleanUpdateFields);
    return true;
  },
});

// Get jobs with pagination and filtering
export const getConversionJobs = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    jobType: v.optional(v.string()),
    userId: v.optional(v.string()),
    documentId: v.optional(v.id("rag_documents")),
  },
  handler: async (ctx, { page = 1, limit = 20, status, jobType, userId, documentId }) => {
    let jobs;

    // Apply filters with proper query initialization
    if (status && jobType) {
      jobs = await ctx.db
        .query("conversion_jobs")
        .withIndex("by_status_and_type", (q) =>
          q.eq("status", status).eq("jobType", jobType)
        )
        .order("desc")
        .collect();
    } else if (jobType) {
      jobs = await ctx.db
        .query("conversion_jobs")
        .withIndex("by_job_type", (q) => q.eq("jobType", jobType))
        .order("desc")
        .collect();
    } else if (status) {
      jobs = await ctx.db
        .query("conversion_jobs")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    } else if (userId) {
      jobs = await ctx.db
        .query("conversion_jobs")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    } else if (documentId) {
      jobs = await ctx.db
        .query("conversion_jobs")
        .withIndex("by_document", (q) => q.eq("documentId", documentId))
        .order("desc")
        .collect();
    } else {
      jobs = await ctx.db
        .query("conversion_jobs")
        .withIndex("by_created_at")
        .order("desc")
        .collect();
    }

    // Apply pagination
    const totalJobs = jobs.length;
    const offset = (page - 1) * limit;
    const paginatedJobs = jobs.slice(offset, offset + limit);

    return {
      jobs: paginatedJobs,
      totalJobs,
      currentPage: page,
      totalPages: Math.ceil(totalJobs / limit),
      hasMore: page * limit < totalJobs,
    };
  },
});



// Get job by jobId
export const getJobByJobId = query({
  args: {
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversion_jobs")
      .filter((q) => q.eq(q.field("jobId"), args.jobId))
      .first();
  },
});

// Get job statistics
export const getJobStats = query({
  args: {},
  handler: async (ctx) => {
    const allJobs = await ctx.db.query("conversion_jobs").collect();
    
    const stats = {
      totalJobs: allJobs.length,
      pendingJobs: allJobs.filter(job => job.status === "pending").length,
      processingJobs: allJobs.filter(job => job.status === "processing").length,
      completedJobs: allJobs.filter(job => job.status === "completed").length,
      failedJobs: allJobs.filter(job => job.status === "failed").length,
      jobsByType: {
        embedding: allJobs.filter(job => job.jobType === "embedding").length,
        similarity: allJobs.filter(job => job.jobType === "similarity").length,
        search: allJobs.filter(job => job.jobType === "search").length,
        chat: allJobs.filter(job => job.jobType === "chat").length,
      },
      averageProcessingTime: (() => {
        const completedWithTime = allJobs.filter(job => 
          job.status === "completed" && job.processingTimeMs
        );
        if (completedWithTime.length === 0) return 0;
        const totalTime = completedWithTime.reduce((sum, job) => 
          sum + (job.processingTimeMs || 0), 0
        );
        return Math.round(totalTime / completedWithTime.length);
      })(),
      recentJobs: allJobs
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map(job => ({
          jobId: job.jobId,
          jobType: job.jobType,
          status: job.status,
          createdAt: job.createdAt,
          processingTimeMs: job.processingTimeMs,
        })),
    };
    
    return stats;
  },
});

// Get jobs by document ID
export const getJobsByDocument = query({
  args: {
    documentId: v.id("rag_documents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversion_jobs")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("desc")
      .collect();
  },
});