/*
 * SHARED UTILITIES FOR HTTP ENDPOINTS
 * apps/docker-convex/convex/https-endpoints/shared/utils.ts
 * =====================
 * 
 * Common utilities and helper functions used across all HTTP endpoint modules.
 */

// Helper for standardized error responses
export const errorResponse = (message: string, status: number, details?: any) => {
  return new Response(JSON.stringify({ error: message, details }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};

// Common CORS headers
export const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// Success response helper
export const successResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
};