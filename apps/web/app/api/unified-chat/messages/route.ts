import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../generated-convex';
import type { GenericId as Id } from 'convex/values';

export const runtime = 'nodejs';

function normalizeWsBase(url: string) {
  if (!url) return '';
  // Ensure we are NOT pointing at /http for the WS/base client
  return url.replace(/\/http\/?$/, '').replace(/\/+$/, '');
}

const convex = new ConvexHttpClient(
  normalizeWsBase(process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3210')
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Fetch messages for the conversation
    const messages = await convex.query(
      api.unifiedChat.getConversationMessages,
      { conversationId: conversationId as Id<'unified_conversations'> }
    );

    if (!messages) {
      return NextResponse.json(
        { messages: [] },
        { status: 200 }
      );
    }

    // Format messages for the frontend
    const formattedMessages = messages.map((msg: any) => ({
      id: msg._id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      sources: msg.sources || [],
      metadata: msg.metadata || {}
    }));

    return NextResponse.json(
      { messages: formattedMessages },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: message },
      { status: 500 }
    );
  }
}