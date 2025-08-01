import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Document upload started');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;

    console.log('Upload details:', {
      fileName: file?.name,
      fileSize: file?.size,
      title,
      summary
    });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file content
    const content = await file.text();
    
    // Determine content type based on file extension
    const fileName = file.name.toLowerCase();
    let contentType = 'text';
    if (fileName.endsWith('.md')) {
      contentType = 'markdown';
    }

    // Calculate word count
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    // Prepare document data for Convex (only required fields)
    const documentData = {
      title: title || file.name.replace(/\.[^/.]+$/, ''), // Remove extension if no title provided
      content,
      contentType,
      summary: summary || undefined,
    };

    console.log('Prepared document data:', {
      title: documentData.title,
      contentType: documentData.contentType,
      fileSize: file.size,
      wordCount: wordCount,
      contentLength: content.length
    });

    // Save to Convex
    const convexUrl = process.env.CONVEX_HTTP_URL || process.env.CONVEX_URL;
    if (!convexUrl) {
      throw new Error('CONVEX_HTTP_URL or CONVEX_URL environment variable is not set');
    }
    
    console.log('Sending to Convex:', convexUrl + '/api/documents');
    
    const response = await fetch(`${convexUrl}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentData),
    });

    console.log('Convex response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Convex API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      let errorMessage = 'Failed to save document';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      title: documentData.title,
      message: 'Document uploaded successfully',
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false 
      },
      { status: 500 }
    );
  }
}