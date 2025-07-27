import { http, HttpResponse } from 'msw'

// Mock document data
const mockDocument = {
  _id: 'test-doc-id-123',
  title: 'Test Document',
  content: 'This is test document content for testing purposes.',
  contentType: 'text',
  fileSize: 1024,
  wordCount: 10,
  uploadedAt: Date.now(),
  summary: 'Test document summary',
  hasEmbedding: false,
}

const mockDocumentWithEmbedding = {
  ...mockDocument,
  _id: 'test-doc-embedded-456',
  title: 'Embedded Test Document',
  hasEmbedding: true,
}

const mockEmbedding = {
  _id: 'test-embedding-123',
  documentId: 'test-doc-embedded-456',
  embedding: Array(384).fill(0).map(() => Math.random()),
  embeddingModel: 'sentence-transformers/all-distilroberta-v1',
  embeddingDimensions: 384,
  chunkIndex: 0,
  chunkText: 'This is test document content for testing purposes.',
  createdAt: Date.now(),
  processingTimeMs: 1500,
  isActive: true,
}

const mockNotification = {
  _id: 'test-notification-123',
  type: 'document_uploaded',
  title: 'Document Uploaded',
  message: 'Your document has been uploaded successfully',
  documentId: 'test-doc-id-123',
  isRead: false,
  createdAt: Date.now(),
}

export const handlers = [
  // Document upload endpoints
  http.post('/api/documents', async ({ request }) => {
    const body = await request.json()
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return HttpResponse.json({
      success: true,
      documentId: mockDocument._id,
      message: 'Document uploaded successfully'
    }, { status: 201 })
  }),

  http.post('/api/documents/batch', async ({ request }) => {
    const body = await request.json()
    
    // Simulate batch upload delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const results = body.documents.map((doc, index) => ({
      success: true,
      documentId: `test-doc-batch-${index}`,
      title: doc.title,
    }))
    
    return HttpResponse.json({
      success: true,
      results,
      message: `${body.documents.length} documents uploaded successfully`
    }, { status: 201 })
  }),

  // Document retrieval endpoints
  http.get('/api/documents/:id', ({ params }) => {
    const { id } = params
    
    if (id === 'test-doc-embedded-456') {
      return HttpResponse.json(mockDocumentWithEmbedding)
    }
    
    if (id === 'test-doc-id-123') {
      return HttpResponse.json(mockDocument)
    }
    
    return HttpResponse.json(
      { error: 'Document not found' },
      { status: 404 }
    )
  }),

  http.get('/api/documents', () => {
    return HttpResponse.json({
      documents: [mockDocument, mockDocumentWithEmbedding],
      hasMore: false,
      cursor: null,
    })
  }),

  http.delete('/api/documents/:id', ({ params }) => {
    const { id } = params
    
    // Simulate deletion delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(HttpResponse.json({ success: true }))
      }, 100)
    })
  }),

  // Embedding endpoints
  http.post('/api/RAG/embeddings', async ({ request }) => {
    const body = await request.json()
    
    // Simulate embedding generation delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return HttpResponse.json({
      success: true,
      message: 'Embedding generation started successfully',
      documentId: body.documentId,
    })
  }),

  http.get('/api/documents/:id/embeddings', ({ params }) => {
    const { id } = params
    
    if (id === 'test-doc-embedded-456') {
      return HttpResponse.json([mockEmbedding])
    }
    
    return HttpResponse.json([])
  }),

  http.post('/api/embeddings/search', async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      results: [
        {
          ...mockDocumentWithEmbedding,
          _score: 0.85,
        }
      ],
      query: body.queryText,
      totalResults: 1,
    })
  }),

  // Notification endpoints
  http.get('/api/notifications', () => {
    return HttpResponse.json({
      success: true,
      notifications: [mockNotification],
      count: 1,
    })
  }),

  http.post('/api/notifications', async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      success: true,
      notificationId: 'test-notification-new',
      message: 'Notification created successfully',
    }, { status: 201 })
  }),

  http.get('/api/notifications/unread-count', () => {
    return HttpResponse.json({
      success: true,
      unreadCount: 1,
    })
  }),

  http.put('/api/notifications/mark-read', () => {
    return HttpResponse.json({
      success: true,
      message: 'Notification marked as read',
    })
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: Date.now(),
      service: 'convex-api',
      version: '1.0.0'
    })
  }),

  // Error simulation endpoints for testing error handling
  http.post('/api/documents/error', () => {
    return HttpResponse.json(
      { error: 'Simulated upload error' },
      { status: 500 }
    )
  }),

  http.post('/api/RAG/embeddings/error', () => {
    return HttpResponse.json(
      { error: 'Simulated embedding error' },
      { status: 500 }
    )
  }),
]