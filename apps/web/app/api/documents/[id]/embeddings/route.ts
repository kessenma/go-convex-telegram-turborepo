import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../docker-convex/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Fetch embeddings for the document
    const embeddings = await convex.query(api.embeddings.getDocumentEmbeddings, {
      documentId: documentId as any,
    });

    return NextResponse.json(embeddings);
  } catch (error) {
    console.error('Error fetching document embeddings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document embeddings' },
      { status: 500 }
    );
  }
}