import { NextRequest, NextResponse } from 'next/server';

interface ChatRequest {
  message: string;
  documentIds: string[];
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface DocumentChunk {
  content: string;
  score: number;
  documentId: string;
  title: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, documentIds, conversationHistory = [] } = body;

    if (!message || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Message and document IDs are required' },
        { status: 400 }
      );
    }

    console.log('RAG Chat request:', { message, documentIds: documentIds.length, historyLength: conversationHistory.length });

    // Step 1: Get embeddings for the user's message
    const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || 'http://localhost:8081';
    
    console.log('Generating embedding for user message...');
    const embeddingResponse = await fetch(`${vectorServiceUrl}/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Embedding generation failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate embedding for message' },
        { status: 500 }
      );
    }

    const embeddingData = await embeddingResponse.json();
    const messageEmbedding = embeddingData.embeddings;

    console.log('Message embedding generated, dimension:', messageEmbedding.length);

    // Step 2: Retrieve relevant document chunks using semantic search
    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    console.log('Searching for relevant document chunks...');
    const searchResponse = await fetch(`${convexUrl}/api/embeddings/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embedding: messageEmbedding,
        documentIds: documentIds,
        topK: 5,
        threshold: 0.3
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Document search failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to search documents' },
        { status: 500 }
      );
    }

    const searchResults = await searchResponse.json();
    const relevantChunks: DocumentChunk[] = searchResults.results || [];

    console.log('Found relevant chunks:', relevantChunks.length);

    // Step 3: Prepare context from relevant chunks
    const context = relevantChunks
      .map(chunk => `Document: ${chunk.title}\nContent: ${chunk.content}`)
      .join('\n\n---\n\n');

    // Step 4: Generate response using a simple template (you can integrate with OpenAI/Claude here)
    let response: string;
    
    if (relevantChunks.length === 0) {
      response = "I couldn't find relevant information in the selected documents to answer your question. Could you try rephrasing your question or selecting different documents?";
    } else {
      // Simple template-based response (you can replace this with actual LLM integration)
      response = generateTemplateResponse(message, context, relevantChunks);
    }

    // Step 5: Prepare sources for the response
    const sources = relevantChunks.map(chunk => ({
      documentId: chunk.documentId,
      title: chunk.title,
      snippet: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''),
      score: chunk.score
    }));

    console.log('RAG Chat response generated successfully');

    return NextResponse.json({
      response,
      sources,
      metadata: {
        chunksFound: relevantChunks.length,
        documentsSearched: documentIds.length,
        embeddingDimension: messageEmbedding.length
      }
    });

  } catch (error) {
    console.error('RAG Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error during RAG chat processing' },
      { status: 500 }
    );
  }
}

function generateTemplateResponse(message: string, context: string, chunks: DocumentChunk[]): string {
  // Simple template-based response generation
  // In a production system, you'd want to integrate with OpenAI, Claude, or another LLM
  
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
  const isQuestion = questionWords.some(word => 
    message.toLowerCase().includes(word.toLowerCase())
  );

  if (isQuestion) {
    return `Based on the documents you've selected, here's what I found regarding your question:

${chunks.map((chunk, index) => 
  `${index + 1}. From "${chunk.title}": ${chunk.content.substring(0, 300)}${chunk.content.length > 300 ? '...' : ''}`
).join('\n\n')}

This information comes from ${chunks.length} relevant section${chunks.length > 1 ? 's' : ''} in your selected documents. Would you like me to elaborate on any specific aspect?`;
  } else {
    return `I found relevant information in your documents related to "${message}":

${chunks.map((chunk, index) => 
  `• From "${chunk.title}": ${chunk.content.substring(0, 200)}${chunk.content.length > 200 ? '...' : ''}`
).join('\n\n')}

Is there anything specific you'd like to know more about from these sources?`;
  }
}
