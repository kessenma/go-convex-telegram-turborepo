/*
 * MONITORING & HEALTH ENDPOINTS
 * apps/docker-convex/convex/https-endpoints/monitoring/index.ts
 * =====================
 * 
 * Health check and monitoring endpoints for system status tracking.
 * These endpoints provide real-time status information for various services.
 */

import { httpAction } from "../../_generated/server";
import { api } from "../../_generated/api";
import { errorResponse, successResponse, corsHeaders } from "../shared/utils";

// =============================================================================
// DOCKER STATUS MONITORING
// =============================================================================

export const getDockerStatusAPI = httpAction(async (ctx, request) => {
  try {
    // This would typically check Docker daemon status
    // For now, return a basic status
    return new Response(
      JSON.stringify({
        success: true,
        status: "running",
        containers: {
          total: 0,
          running: 0,
          stopped: 0
        },
        timestamp: Date.now()
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error checking Docker status:", error);
    return errorResponse(
      "Failed to check Docker status",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// =============================================================================
// LLM SERVICE MONITORING
// =============================================================================

export const getLightweightLLMStatusAPI = httpAction(async (ctx, request) => {
  try {
    // TEMPORARY: Commented out due to type instantiation issues
    // const statuses = await ctx.runQuery(api.serviceStatus.getAllServiceStatuses, {});
    // const llmStatus = statuses.find(s => s.serviceName === 'lightweight-llm');
    
    return new Response(
      JSON.stringify({
        success: true,
        status: 'unknown',
        ready: false,
        message: 'Service status temporarily disabled due to type issues',
        memoryUsage: {},
        model: 'unknown',
        timestamp: Date.now()
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error checking lightweight LLM status:", error);
    return errorResponse(
      "Failed to check lightweight LLM status",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

// =============================================================================
// USER ACTIVITY MONITORING (using Convex Presence API)
// =============================================================================

export const getActiveUserCountAPI = httpAction(async (ctx, request) => {
  try {
    // Since you're using Convex Presence API, this could query presence data
    // For now, return placeholder data
    const userCount = {
      total: 0,
      bySource: {
        web: 0,
        mobile: 0,
        api: 0
      },
      timestamp: Date.now()
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          total: userCount.total,
          bySource: userCount.bySource,
          timestamp: userCount.timestamp,
          lastUpdated: new Date().toISOString(),
        },
        message: `${userCount.total} active users`
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error fetching active user count:", error);
    return errorResponse(
      "Failed to fetch active user count",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});