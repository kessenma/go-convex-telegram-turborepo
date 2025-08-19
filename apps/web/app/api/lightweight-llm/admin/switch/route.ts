import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const llmUrl = process.env.LIGHTWEIGHT_LLM_URL || 
                  process.env.LIGHTWEIGHT_LLM_INTERNAL_URL || 
                  "http://localhost:8082";
    
    const response = await fetch(`${llmUrl}/admin/switch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000), // 30 second timeout for model switching
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM service returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error switching model:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}