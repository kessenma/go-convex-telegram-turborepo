import { NextRequest, NextResponse } from 'next/server';

// This will be the main chat endpoint that integrates with your LLM
// For now, it's a placeholder that demonstrates the structure

interface ChatRequest {
  message: string;
  documentIds: string[];
  conversationHistory?: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

interface ChatResponse {
  response: string;
  sources: {
    documentId: string;
    title: string;
    snippet: string;
    score: number;
  }[];
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body: ChatRequest = await request.json();
    
    // Validate required fields
    if (!body.message || !body.documentIds || body.documentIds.length === 0) {
      return NextResponse.json(
        { 
          response: '',
          sources: [],
          error: 'Missing required fields: message and documentIds' 
        },
        { status: 400 }
      );
    }

    // Step 1: Perform vector search to find relevant document chunks
    const searchResponse = await fetch(`${process.env.CONVEX_HTTP_URL}/api/documents/search?q=${encodeURIComponent(body.message)}&limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!searchResponse.ok) {
      throw new Error('Vector search failed');
    }

    const searchResults = await searchResponse.json();
    
    // Filter results to only include selected documents
    const relevantSources = searchResults.results?.filter((result: any) => 
      body.documentIds.includes(result.documentId)
    ) || [];

    // Step 2: Prepare context for LLM
    const context = relevantSources
      .slice(0, 3) // Limit to top 3 most relevant sources
      .map((source: any) => `Document: ${source.title}\nContent: ${source.content}`)
      .join('\n\n');

    // Step 3: TODO - Replace with actual LLM call
    // This is where you'll integrate Phi, Llama, or your chosen model
    const llmResponse = await generateLLMResponse(body.message, context, body.conversationHistory);

    return NextResponse.json({
      response: llmResponse,
      sources: relevantSources.map((source: any) => ({
        documentId: source.documentId,
        title: source.title,
        snippet: source.content.substring(0, 200) + '...',
        score: source.score
      }))
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        response: '',
        sources: [],
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Placeholder function for LLM integration
// Replace this with your actual LLM implementation
async function generateLLMResponse(
  userMessage: string, 
  context: string, 
  conversationHistory?: { role: 'user' | 'assistant'; content: string; }[]
): Promise<string> {
  // TODO: Integrate with your chosen LLM (Phi, Llama, etc.)
  // This could be:
  // 1. A call to your Go server running the LLM
  // 2. A call to a separate Docker container with the LLM
  // 3. A call to a cloud LLM service
  
  // For now, return a placeholder response
  const contextPreview = context.length > 200 ? context.substring(0, 200) + '...' : context;
  
  return `This is a placeholder response for: "${userMessage}"

Based on the provided context from your documents, I would analyze the relevant information and provide a comprehensive answer. 

Context preview: ${contextPreview}

**Next Steps for LLM Integration:**
1. Choose your LLM: Microsoft Phi, Meta Llama, or another model
2. Set up the model in a Docker container or your Go server
3. Replace this function with actual LLM API calls
4. Implement proper prompt engineering for legal/academic use cases

Conversation history length: ${conversationHistory?.length || 0} messages`;
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ 
    status: 'Chat API is running',
    timestamp: new Date().toISOString(),
    note: 'LLM integration pending'
  });
}