import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../docker-convex/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.CONVEX_URL || 'http://localhost:3211');
const LIGHTWEIGHT_LLM_URL = process.env.LIGHTWEIGHT_LLM_INTERNAL_URL || 'http://localhost:8082';

interface ChatRequest {
  message: string;
  documentIds: string[];
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  sessionId?: string;
}

interface VectorSearchResult {
  documentId: string;
  title: string;
  snippet: string;
  score: number;
}

// Generate a session ID if not provided
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Perform vector search to find relevant document chunks
async function performVectorSearch(
  query: string, 
  documentIds: string[], 
  limit: number = 5
): Promise<VectorSearchResult[]> {
  try {
    // Call the vector-convert-llm service for similarity search
    const response = await fetch(`${process.env.VECTOR_CONVERT_LLM_INTERNAL_URL || 'http://localhost:8081'}/similarity-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        document_ids: documentIds,
        top_k: limit,
        threshold: 0.3, // Minimum similarity threshold
      }),
    });

    if (!response.ok) {
      console.error('Vector search failed:', response.statusText);
      return [];
    }

    const results = await response.json();
    
    // Transform results to match our interface
    return results.results?.map((result: any) => ({
      documentId: result.document_id,
      title: result.title || 'Unknown Document',
      snippet: result.text || result.content || '',
      score: result.score || 0,
    })) || [];
    
  } catch (error) {
    console.error('Error performing vector search:', error);
    return [];
  }
}

// Get document content for context
async function getDocumentContext(documentIds: string[]): Promise<string> {
  try {
    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        try {
          const doc = await convex.query(api.documents.getDocumentById, { documentId: docId as any });
          return doc;
        } catch (error) {
          console.error(`Error fetching document ${docId}:`, error);
          return null;
        }
      })
    );

    const validDocuments = documents.filter(Boolean);
    
    // Combine document content (truncate if too long)
    const context = validDocuments
      .map(doc => doc ? `Document: ${doc.title}\n${doc.content}` : '')
      .filter(Boolean)
      .join('\n\n')
      .substring(0, 8000); // Limit context size

    return context;
  } catch (error) {
    console.error('Error getting document context:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, documentIds, conversationHistory, sessionId } = body;

    if (!message || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Message and document IDs are required' },
        { status: 400 }
      );
    }

    const currentSessionId = sessionId || generateSessionId();
    const startTime = Date.now();

    // Step 1: Perform vector search to find relevant content
    console.log('Performing vector search...');
    const vectorResults = await performVectorSearch(message, documentIds, 5);
    
    // Step 2: Get additional document context if vector search returns limited results
    let context = '';
    if (vectorResults.length > 0) {
      // Use vector search results as context
      context = vectorResults
        .map(result => `${result.title}: ${result.snippet}`)
        .join('\n\n');
    } else {
      // Fallback to full document content if no vector results
      console.log('No vector results, using full document context...');
      context = await getDocumentContext(documentIds);
    }

    // Step 3: Call the lightweight LLM service
    console.log('Calling lightweight LLM service...');
    const llmResponse = await fetch(`${LIGHTWEIGHT_LLM_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        conversation_history: conversationHistory,
        max_length: 512,
        temperature: 0.7,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('LLM service error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate response from LLM service' },
        { status: 500 }
      );
    }

    const llmResult = await llmResponse.json();
    const processingTime = Date.now() - startTime;

    // Step 4: Save conversation to Convex (temporarily disabled until API is regenerated)
    try {
      // TODO: Re-enable once ragChat functions are available in generated API
      console.log('Conversation saving temporarily disabled - need to regenerate Convex API');
    } catch (convexError) {
      console.error('Error saving to Convex:', convexError);
      // Continue even if saving fails
    }

    // Step 5: Return response
    return NextResponse.json({
      response: llmResult.response,
      sessionId: currentSessionId,
      sources: vectorResults,
      usage: llmResult.usage,
      processingTimeMs: processingTime,
      model: llmResult.model_info,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'RAG Chat API is running',
    endpoints: {
      POST: '/api/RAG/chat - Send a chat message with document context',
    },
  });
}
