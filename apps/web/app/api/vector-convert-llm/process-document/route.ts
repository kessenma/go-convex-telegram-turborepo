// This route has been deprecated in favor of direct calls to the Python vector service
// The DocumentViewer now calls the Python service directly at http://localhost:8081/process-document
// This eliminates the unnecessary proxy layer and reduces potential points of failure

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint has been deprecated. Please call the vector service directly at /process-document',
      deprecated: true,
      redirect_to: 'http://localhost:8081/process-document'
    }, 
    { status: 410 } // Gone
  );
}
