import { NextRequest, NextResponse } from 'next/server';

// Define the Convex HTTP URL
const CONVEX_HTTP_URL = process.env.CONVEX_HTTP_URL || "http://localhost:3211";

export async function POST(req: NextRequest) {
  try {
    const { conversationId, title } = await req.json();

    if (!conversationId || !title) {
      return NextResponse.json(
        { error: "Missing conversationId or title" },
        { status: 400 }
      );
    }

    console.log(`Updating conversation title: ${conversationId} -> ${title}`);

    // Call the Convex HTTP API to update the conversation title
    const response = await fetch(`${CONVEX_HTTP_URL}/api/conversations/update-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        title,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to update conversation title:", errorText);
      return NextResponse.json(
        { error: "Failed to update conversation title" },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log("Conversation title updated successfully:", result);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating conversation title:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}