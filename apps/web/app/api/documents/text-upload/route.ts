import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, summary, contentType = 'text' } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Calculate word count and file size
    const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;
    const fileSize = new Blob([content]).size;

    // Prepare document data
    const documentData = {
      title,
      content,
      contentType,
      summary: summary || undefined,
      fileSize,
      wordCount,
    };

    // Save to Convex
    const response = await fetch(`${process.env.CONVEX_HTTP_URL}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save document');
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      title: documentData.title,
      message: 'Document uploaded successfully',
    });

  } catch (error) {
    console.error('Text upload error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false 
      },
      { status: 500 }
    );
  }
}