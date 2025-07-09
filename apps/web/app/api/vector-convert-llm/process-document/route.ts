import { NextRequest, NextResponse } from 'next/server';

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3211';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_id } = body;
    
    if (!document_id) {
      return NextResponse.json(
        { error: 'document_id is required' },
        { status: 400 }
      );
    }
    
    console.log('Processing document:', document_id);
    
    // 1. Fetch document content from web API
    const getDocUrl = `http://localhost:3000/api/documents/${document_id}`;
    const docResponse = await fetch(getDocUrl);
    if (!docResponse.ok) {
      const errorBody = await docResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
      return NextResponse.json(
        { error: 'Failed to fetch document', details: errorBody },
        { status: docResponse.status }
      );
    }
    const document = await docResponse.json();
    const inputText = document.content;

    if (!inputText) {
      return NextResponse.json(
        { error: 'Document has no text content to process' },
        { status: 400 }
      );
    }
    
    // 2. Get the vector-convert-llm service URL from environment
    const vectorServiceUrl = process.env.VECTOR_CONVERT_LLM_URL || process.env.VECTOR_CONVERT_LLM_INTERNAL_URL || 'http://vector-convert-llm:8081';
    
    console.log('Sending to vector-convert-llm service:', vectorServiceUrl);
    console.log('Document content length:', inputText.length);
    
    // 3. Forward the request to the vector-convert-llm service with the document content
    const response = await fetch(`${vectorServiceUrl}/process-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        document_id,
        inputText 
      }),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Vector service error:', responseData);
      return NextResponse.json(
        { error: responseData.error || 'Vector service error' },
        { status: response.status }
      );
    }
    
    console.log('Vector service response:', responseData);
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error in vector-convert-llm proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}