import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { saveMessageAPI, getMessagesAPI } from "./telegram";

const http = httpRouter();

// Telegram bot API endpoints
http.route({
  path: "/api/telegram/messages",
  method: "POST",
  handler: saveMessageAPI,
});

http.route({
  path: "/api/telegram/messages",
  method: "GET",
  handler: getMessagesAPI,
});

// Health check endpoint
const healthCheck = httpAction(async () => {
  return new Response(
    JSON.stringify({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "convex-telegram-backend"
    }),
    { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
});

http.route({
  path: "/api/health",
  method: "GET",
  handler: healthCheck,
});

export default http;