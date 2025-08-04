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

export const getUsersWithLocationAPI = httpAction(async (ctx, request) => {
  try {
    // Get user presence data from the Convex Presence API
    // Use a string literal for the query path to avoid type instantiation issues
    // @ts-ignore - Using string path to avoid type instantiation issues
    const result = await ctx.runQuery("presence:getActiveUsersWithLocation", {});
    // Define the expected result type
    type PresenceResult = { users?: Array<{ id: string; ipAddress?: string; country?: string }> };
    const usersWithLocation = (result as PresenceResult)?.users || [];
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          users: usersWithLocation,
          count: usersWithLocation.length,
          timestamp: Date.now()
        },
        message: `Retrieved ${usersWithLocation.length} users with location data`
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error fetching users with location:", error);
    return errorResponse(
      "Failed to fetch users with location data",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

export const getActiveUserCountAPI = httpAction(async (ctx, request) => {
  try {
    // Get actual presence data from the Convex Presence API
    // Use a string literal for the query path to avoid type instantiation issues
    // @ts-ignore - Using string path to avoid type instantiation issues
    const userCount = await ctx.runQuery("presence:getActiveUserCount", {});
    
    // Get IP and country info from the request
    const { getIpAndCountryInfo } = await import("../shared/ip_utils");
    const { ip, country } = getIpAndCountryInfo(request);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          total: userCount.total,
          bySource: {
            web: userCount.total, // Assuming all are web for now
            mobile: 0,
            api: 0
          },
          timestamp: userCount.timestamp,
          lastUpdated: new Date().toISOString(),
          // Include the requester's IP and country
          requester: {
            ip,
            country
          }
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