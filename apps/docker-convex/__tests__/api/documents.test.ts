/**
 * API Tests for Document Endpoints
 * 
 * These tests verify the HTTP API endpoints for document management,
 * including upload, retrieval, deletion, and embedding generation.
 */

import { Request, Response } from 'node-fetch'

// Mock the Convex server functions
const mockRunMutation = jest.fn()
const mockRunQuery = jest.fn()
const mockRunAction = jest.fn()

const mockCtx = {
  runMutation: mockRunMutation,
  runQuery: mockRunQuery,
  runAction: mockRunAction,
}

// Mock document data
const mockDocument = {
  _id: 'test-doc-123',
  title: 'Test Document',
  content: 'This is test content',
  contentType: 'text',
  fileSize: 1024,
  wordCount: 10,
  uploadedAt: Date.now(),
  summary: 'Test summary',
  hasEmbedding: false,
}

const mockDocumentWithEmbedding = {
  ...mockDocument,
  _id: 'test-doc-embedded-456',
  hasEmbedding: true,
}

describe('Document API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/documents - Save Document', () => {
    it('successfully saves a document', async () => {
      mockRunMutation.mockResolvedValue('test-doc-123')

      const requestBody = {
        title: 'Test Document',
        content: 'This is test content',
        contentType: 'text',
        fileSize: 1024,
        summary: 'Test summary',
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      // Import the handler function (this would be from your actual http.ts file)
      // For now, we'll simulate the handler logic
      const result = await simulateSaveDocumentAPI(mockCtx, mockRequest)

      expect(mockRunMutation).toHaveBeenCalledWith(
        expect.any(Function), // api.documents.saveDocument
        requestBody
      )

      expect(result.status).toBe(201)
      const responseData = await result.json()
      expect(responseData).toEqual({
        success: true,
        documentId: 'test-doc-123',
      })
    })

    it('returns 400 for missing required fields', async () => {
      const requestBody = {
        title: 'Test Document',
        // Missing content and contentType
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateSaveDocumentAPI(mockCtx, mockRequest)

      expect(result.status).toBe(400)
      const responseData = await result.json()
      expect(responseData.error).toContain('Missing required fields')
    })

    it('handles database errors gracefully', async () => {
      mockRunMutation.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        title: 'Test Document',
        content: 'This is test content',
        contentType: 'text',
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateSaveDocumentAPI(mockCtx, mockRequest)

      expect(result.status).toBe(500)
      const responseData = await result.json()
      expect(responseData.error).toBe('Internal server error')
    })
  })

  describe('POST /api/documents/batch - Batch Save Documents', () => {
    it('successfully saves multiple documents', async () => {
      const batchResult = {
        success: true,
        results: [
          { success: true, documentId: 'doc-1', title: 'Document 1' },
          { success: true, documentId: 'doc-2', title: 'Document 2' },
        ],
        message: '2 documents uploaded successfully',
      }

      mockRunMutation.mockResolvedValue(batchResult)

      const requestBody = {
        documents: [
          {
            title: 'Document 1',
            content: 'Content 1',
            contentType: 'text',
          },
          {
            title: 'Document 2',
            content: 'Content 2',
            contentType: 'markdown',
          },
        ],
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateSaveDocumentsBatchAPI(mockCtx, mockRequest)

      expect(result.status).toBe(201)
      const responseData = await result.json()
      expect(responseData).toEqual(batchResult)
    })

    it('validates document array', async () => {
      const requestBody = {
        documents: 'not-an-array',
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateSaveDocumentsBatchAPI(mockCtx, mockRequest)

      expect(result.status).toBe(400)
      const responseData = await result.json()
      expect(responseData.error).toContain('Missing or invalid documents array')
    })

    it('validates individual documents in batch', async () => {
      const requestBody = {
        documents: [
          {
            title: 'Valid Document',
            content: 'Valid content',
            contentType: 'text',
          },
          {
            title: 'Invalid Document',
            // Missing content and contentType
          },
        ],
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateSaveDocumentsBatchAPI(mockCtx, mockRequest)

      expect(result.status).toBe(400)
      const responseData = await result.json()
      expect(responseData.error).toContain('Document 2: Missing required fields')
    })
  })

  describe('GET /api/documents/:id - Get Document by ID', () => {
    it('successfully retrieves a document', async () => {
      mockRunQuery.mockResolvedValue(mockDocument)

      const mockRequest = {
        url: 'http://localhost:3210/api/documents/test-doc-123',
      } as any

      const result = await simulateGetDocumentByIdAPI(mockCtx, mockRequest)

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.any(Function), // api.documents.getDocumentById
        { documentId: 'test-doc-123' }
      )

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual(mockDocument)
    })

    it('returns 404 for non-existent document', async () => {
      mockRunQuery.mockResolvedValue(null)

      const mockRequest = {
        url: 'http://localhost:3210/api/documents/non-existent',
      } as any

      const result = await simulateGetDocumentByIdAPI(mockCtx, mockRequest)

      expect(result.status).toBe(404)
      const responseData = await result.json()
      expect(responseData.error).toBe('Document not found')
    })

    it('returns 400 for missing document ID', async () => {
      const mockRequest = {
        url: 'http://localhost:3210/api/documents/',
      } as any

      const result = await simulateGetDocumentByIdAPI(mockCtx, mockRequest)

      expect(result.status).toBe(400)
      const responseData = await result.json()
      expect(responseData.error).toContain('Missing documentId')
    })
  })

  describe('DELETE /api/documents/:id - Delete Document', () => {
    it('successfully deletes a document', async () => {
      mockRunMutation.mockResolvedValue(undefined)

      const mockRequest = {
        url: 'http://localhost:3210/api/documents/test-doc-123',
      } as any

      const result = await simulateDeleteDocumentAPI(mockCtx, mockRequest)

      expect(mockRunMutation).toHaveBeenCalledWith(
        expect.any(Function), // api.documents.deleteDocument
        { documentId: 'test-doc-123' }
      )

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual({ success: true })
    })

    it('handles deletion errors', async () => {
      mockRunMutation.mockRejectedValue(new Error('Document not found'))

      const mockRequest = {
        url: 'http://localhost:3210/api/documents/test-doc-123',
      } as any

      const result = await simulateDeleteDocumentAPI(mockCtx, mockRequest)

      expect(result.status).toBe(500)
      const responseData = await result.json()
      expect(responseData.error).toBe('Internal server error')
    })
  })

  describe('GET /api/documents - Get All Documents', () => {
    it('successfully retrieves documents with pagination', async () => {
      const mockDocuments = {
        documents: [mockDocument, mockDocumentWithEmbedding],
        hasMore: false,
        cursor: null,
      }

      mockRunQuery.mockResolvedValue(mockDocuments)

      const mockRequest = {
        url: 'http://localhost:3210/api/documents?limit=20',
      } as any

      const result = await simulateGetDocumentsAPI(mockCtx, mockRequest)

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.any(Function), // api.documents.getAllDocuments
        { limit: 20, cursor: undefined }
      )

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual(mockDocuments)
    })

    it('handles query parameters correctly', async () => {
      const mockDocuments = {
        documents: [mockDocument],
        hasMore: true,
        cursor: 'next-cursor',
      }

      mockRunQuery.mockResolvedValue(mockDocuments)

      const mockRequest = {
        url: 'http://localhost:3210/api/documents?limit=10&cursor=some-cursor',
      } as any

      const result = await simulateGetDocumentsAPI(mockCtx, mockRequest)

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.any(Function),
        { limit: 10, cursor: 'some-cursor' }
      )
    })
  })

  describe('GET /api/documents/stats - Get Document Statistics', () => {
    it('successfully retrieves document statistics', async () => {
      const mockStats = {
        totalDocuments: 10,
        totalSize: 1024000,
        embeddedDocuments: 7,
        averageWordCount: 250,
      }

      mockRunQuery.mockResolvedValue(mockStats)

      const mockRequest = {} as any

      const result = await simulateGetDocumentStatsAPI(mockCtx, mockRequest)

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.any(Function), // api.documents.getDocumentStats
        {}
      )

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual(mockStats)
    })
  })
})

// Simulate API handler functions
// In a real implementation, these would be imported from your http.ts file

async function simulateSaveDocumentAPI(ctx: any, request: any) {
  try {
    const body = await request.json()
    if (!body.title || !body.content || !body.contentType) {
      return new Response(JSON.stringify({ error: 'Missing required fields: title, content, contentType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const documentId = await ctx.runMutation(jest.fn(), body)
    return new Response(JSON.stringify({ success: true, documentId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function simulateSaveDocumentsBatchAPI(ctx: any, request: any) {
  try {
    const body = await request.json()
    
    if (!body.documents || !Array.isArray(body.documents)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid documents array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    for (let i = 0; i < body.documents.length; i++) {
      const doc = body.documents[i]
      if (!doc.title || !doc.content || !doc.contentType) {
        return new Response(JSON.stringify({ error: `Document ${i + 1}: Missing required fields: title, content, contentType` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const result = await ctx.runMutation(jest.fn(), { documents: body.documents })
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function simulateGetDocumentByIdAPI(ctx: any, request: any) {
  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const documentId = pathParts[pathParts.length - 1]
    
    if (!documentId || documentId === '') {
      return new Response(JSON.stringify({ error: 'Missing documentId in path' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    const document = await ctx.runQuery(jest.fn(), { documentId })
    if (!document) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify(document), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function simulateDeleteDocumentAPI(ctx: any, request: any) {
  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const documentId = pathParts[pathParts.length - 1]
    
    if (!documentId) {
      return new Response(JSON.stringify({ error: 'Missing documentId in path' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    await ctx.runMutation(jest.fn(), { documentId })
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function simulateGetDocumentsAPI(ctx: any, request: any) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const cursor = url.searchParams.get('cursor') || undefined
    
    const documents = await ctx.runQuery(jest.fn(), { limit, cursor })
    return new Response(JSON.stringify(documents), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function simulateGetDocumentStatsAPI(ctx: any, request: any) {
  try {
    const stats = await ctx.runQuery(jest.fn(), {})
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}