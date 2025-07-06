import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// HTTP API endpoint to get all active threads
export const getActiveThreadsAPI = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");
  const chatId = url.searchParams.get("chatId");

  try {
    let threads;
    if (chatId) {
      threads = await ctx.runQuery(api.threads.getThreadsInChat, {
        chatId: parseInt(chatId),
        limit: limit ? parseInt(limit) : undefined,
      });
    } else {
      threads = await ctx.runQuery(api.threads.getAllActiveThreads, {
        limit: limit ? parseInt(limit) : undefined,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        threads: threads,
        count: threads.length 
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching threads:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch threads",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// HTTP API endpoint to get thread statistics
export const getThreadStatsAPI = httpAction(async (ctx, request) => {
  try {
    const stats = await ctx.runQuery(api.threads.getThreadStats);

    return new Response(
      JSON.stringify({ 
        success: true, 
        stats: stats
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching thread stats:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch thread stats",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

// HTTP API endpoint to get a specific thread by ID
export const getThreadByIdAPI = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const threadDocId = url.searchParams.get("threadDocId");

  if (!threadDocId) {
    return new Response(
      JSON.stringify({ 
        error: "Missing required parameter: threadDocId" 
      }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const thread = await ctx.runQuery(api.threads.getThreadById, {
      threadDocId: threadDocId as any, // Convex ID type
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        thread: thread
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching thread:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch thread",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});