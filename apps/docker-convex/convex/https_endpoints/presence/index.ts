import { httpAction } from "../../_generated/server";
import { api } from "../../_generated/api";
import { heartbeatFromDb, HeartbeatInput } from "../../presence";

// PRESENCE API ENDPOINTS
export const presenceHeartbeatAPI = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { roomId, userId, sessionId, interval, location } = body;

    // Validate required fields
    if (!roomId || !userId || !sessionId || !interval) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: roomId, userId, sessionId, interval" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Use location data from frontend
    const locationData = location || {};

    // Prepare arguments for the helper
    const heartbeatArgs: HeartbeatInput = {
      roomId,
      userId,
      sessionId,
      interval,
      ipAddress: locationData.ip || 'unknown',
      country: locationData.country || 'Unknown',
      countryCode: locationData.countryCode || 'Unknown',
      region: locationData.region || 'Unknown',
      city: locationData.city || 'Unknown',
      zip: locationData.zip || 'Unknown',
      timezone: locationData.timezone || 'Unknown',
      coordinates: locationData.coordinates || [0, 0],
      isp: locationData.isp || 'Unknown',
      org: locationData.org || 'Unknown',
      as: locationData.as || 'Unknown',
    };
    
    await heartbeatFromDb(ctx, heartbeatArgs);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

export const presenceOptionsAPI = httpAction(async (ctx, request) => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    },
  });
});