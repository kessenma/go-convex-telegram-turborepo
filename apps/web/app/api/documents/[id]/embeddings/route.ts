import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convexApi1752607591403';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || 'http://localhost:3210';
const convex = new ConvexHttpClient(convexUrl);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentId = id;
    
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
