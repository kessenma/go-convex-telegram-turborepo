import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const summary = formData.get('summary') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const documents: Array<{
      title: string;
      content: string;
      contentType: string;
      summary?: string;
      fileSize: number;
      wordCount: number;
    }> = [];

    // Process each file
    for (const file of files) {
      try {
        const content = await file.text();
        
        // Determine content type based on file extension
        const fileName = file.name.toLowerCase();
        let contentType = 'text';
        if (fileName.endsWith('.md')) {
          contentType = 'markdown';
        }

        // Calculate word count
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

        documents.push({
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          content,
          contentType,
          summary: summary || undefined,
          fileSize: file.size,
          wordCount,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files
      }
    }

    if (documents.length === 0) {
      return NextResponse.json({ error: 'No valid documents to upload' }, { status: 400 });
    }

    // Save batch to Convex
    const response = await fetch(`${process.env.CONVEX_HTTP_URL}/api/documents/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documents }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save documents');
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      uploadedCount: documents.length,
      documentIds: result.documentIds,
      message: `${documents.length} documents uploaded successfully`,
    });

  } catch (error) {
    console.error('Batch upload error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Batch upload failed',
        success: false 
      },
      { status: 500 }
    );
  }
}