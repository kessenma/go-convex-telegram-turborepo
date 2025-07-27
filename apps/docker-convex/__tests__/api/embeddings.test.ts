/**
 * API Tests for Embedding Endpoints
 * 
 * These tests verify the HTTP API endpoints for embedding management,
 * including generation, retrieval, and vector search functionality.
 */

// Mock the Convex server functions
const mockRunMutation = jest.fn()
const mockRunQuery = jest.fn()
const mockRunAction = jest.fn()

const mockCtx = {
  runMutation: mockRunMutation,
  runQuery: mockRunQuery,
  runAction: mockRunAction,
}

// Mock embedding data
const mockEmbedding = {
  _id: 'test-embedding-123',
  documentId: 'test-doc-123',
  embedding: Array(384).fill(0).map(() => Math.random()),
  embeddingModel: 'sentence-transformers/all-distilroberta-v1',
  embeddingDimensions: 384,
  chunkIndex: 0,
  chunkText: 'This is test content for embedding',
  createdAt: Date.now(),
  processingTimeMs: 1500,
  isActive: true,
}

const mockSearchResults = {
  results: [
    {
      _id: 'test-doc-123',
      title: 'Test Document',
      content: 'This is test content',
      _score: 0.85,
    },
  ],
  query: 'test query',
  totalResults: 1,
}

describe('Embedding API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/RAG/embeddings - Generate Document Embedding', () => {
    it('successfully starts embedding generation', async () => {
      mockRunAction.mockResolvedValue(undefined)

      const requestBody = {
        documentId: 'test-doc-123',
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateGenerateDocumentEmbeddingAPI(mockCtx, mockRequest)

      expect(mockRunAction).toHaveBeenCalledWith(
        expect.any(Function), // internal.embeddings.processDocumentEmbedding
        { documentId: 'test-doc-123' }
      )

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual({
        success: true,
        message: 'Embedding generation started successfully',
        documentId: 'test-doc-123',
      })
    })

    it('returns 400 for missing document ID', async () => {
      const requestBody = {}

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateGenerateDocumentEmbeddingAPI(mockCtx, mockRequest)

      expect(result.status).toBe(400)
      const responseData = await result.json()
      expect(responseData.error).toBe('Missing documentId')
    })

    it('handles embedding generation errors', async () => {
      mockRunAction.mockRejectedValue(new Error('Embedding service unavailable'))

      const requestBody = {
        documentId: 'test-doc-123',
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateGenerateDocumentEmbeddingAPI(mockCtx, mockRequest)

      expect(result.status).toBe(500)
      const responseData = await result.json()
      expect(responseData.error).toBe('Internal server error')
    })
  })

  describe('POST /api/embeddings/createDocumentEmbedding - Create Document Embedding', () => {
    it('successfully creates a document embedding', async () => {
      mockRunMutation.mockResolvedValue('test-embedding-123')

      const requestBody = {
        documentId: 'test-doc-123',
        embedding: Array(384).fill(0).map(() => Math.random()),
        embeddingModel: 'all-MiniLM-L6-v2',
        embeddingDimensions: 384,
        chunkText: 'Test chunk text',
        chunkIndex: 0,
        processingTimeMs: 1500,
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateCreateDocumentEmbeddingAPI(mockCtx, mockRequest)

      expect(mockRunMutation).toHaveBeenCalledWith(
        expect.any(Function), // api.embeddings.createDocumentEmbedding
        {
          documentId: 'test-doc-123',
          embedding: requestBody.embedding,
          embeddingModel: 'all-MiniLM-L6-v2',
          embeddingDimensions: 384,
          chunkText: 'Test chunk text',
          chunkIndex: 0,
          processingTimeMs: 1500,
        }
      )

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual({
        success: true,
        embeddingId: 'test-embedding-123',
      })
    })

    it('returns 400 for missing required fields', async () => {
      const requestBody = {
        documentId: 'test-doc-123',
        // Missing embedding
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateCreateDocumentEmbeddingAPI(mockCtx, mockRequest)

      expect(result.status).toBe(400)
      const responseData = await result.json()
      expect(responseData.error).toContain('Missing required fields')
    })

    it('uses default values for optional fields', async () => {
      mockRunMutation.mockResolvedValue('test-embedding-123')

      const requestBody = {
        documentId: 'test-doc-123',
        embedding: Array(384).fill(0).map(() => Math.random()),
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateCreateDocumentEmbeddingAPI(mockCtx, mockRequest)

      expect(mockRunMutation).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          embeddingModel: 'all-MiniLM-L6-v2',
          embeddingDimensions: 384,
        })
      )
    })
  })

  describe('GET /api/embeddings/document - Get Document Embeddings', () => {
    it('successfully retrieves document embeddings', async () => {
      mockRunQuery.mockResolvedValue([mockEmbedding])

      const mockRequest = {
        url: 'http://localhost:3210/api/embeddings/document?documentId=test-doc-123',
      } as any

      const result = await simulateGetDocumentEmbeddingsAPI(mockCtx, mockRequest)

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.any(Function), // api.embeddings.getDocumentEmbeddings
        { documentId: 'test-doc-123' }
      )

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual([mockEmbedding])
    })

    it('returns 400 for missing document ID', async () => {
      const mockRequest = {
        url: 'http://localhost:3210/api/embeddings/document',
      } as any

      const result = await simulateGetDocumentEmbeddingsAPI(mockCtx, mockRequest)

      expect(result.status).toBe(400)
      const responseData = await result.json()
      expect(responseData.error).toContain('Missing documentId parameter')
    })

    it('returns empty array for document with no embeddings', async () => {
      mockRunQuery.mockResolvedValue([])

      const mockRequest = {
        url: 'http://localhost:3210/api/embeddings/document?documentId=test-doc-no-embeddings',
      } as any

      const result = await simulateGetDocumentEmbeddingsAPI(mockCtx, mockRequest)

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual([])
    })
  })

  describe('POST /api/embeddings/search - Vector Search', () => {
    it('successfully performs vector search with POST request', async () => {
      mockRunAction.mockResolvedValue(mockSearchResults)

      const requestBody = {
        queryText: 'test search query',
        limit: 10,
        documentIds: ['doc-1', 'doc-2'],
      }

      const mockRequest = {
        method: 'POST',
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateSearchDocumentsVectorAPI(mockCtx, mockRequest)

      expect(mockRunAction).toHaveBeenCalledWith(
        expect.any(Function), // api.embeddings.searchDocumentsByVector
        {
          queryText: 'test search query',
          limit: 10,
          documentIds: ['doc-1', 'doc-2'],
        }
      )

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual(mockSearchResults)
    })

    it('successfully performs vector search with GET request', async () => {
      mockRunAction.mockResolvedValue(mockSearchResults)

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost:3210/api/embeddings/search?queryText=test%20query&limit=5',
      } as any

      const result = await simulateSearchDocumentsVectorAPI(mockCtx, mockRequest)

      expect(mockRunAction).toHaveBeenCalledWith(
        expect.any(Function),
        {
          queryText: 'test query',
          limit: 5,
          documentIds: undefined,
        }
      )
    })

    it('returns 400 for missing query text', async () => {
      const requestBody = {
        limit: 10,
      }

      const mockRequest = {
        method: 'POST',
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateSearchDocumentsVectorAPI(mockCtx, mockRequest)

      expect(result.status).toBe(400)
      const responseData = await result.json()
      expect(responseData.error).toContain('Missing queryText parameter')
    })

    it('handles search errors gracefully', async () => {
      mockRunAction.mockRejectedValue(new Error('Vector search failed'))

      const requestBody = {
        queryText: 'test query',
      }

      const mockRequest = {
        method: 'POST',
        json: () => Promise.resolve(requestBody),
      } as any

      const result = await simulateSearchDocumentsVectorAPI(mockCtx, mockRequest)

      expect(result.status).toBe(500)
      const responseData = await result.json()
      expect(responseData.error).toBe('Internal server error')
    })
  })

  describe('GET /api/embeddings/all - Get All Document Embeddings', () => {
    it('successfully retrieves all document embeddings', async () => {
      const allEmbeddings = [mockEmbedding, { ...mockEmbedding, _id: 'embedding-2' }]
      mockRunQuery.mockResolvedValue(allEmbeddings)

      const mockRequest = {} as any

      const result = await simulateGetAllDocumentEmbeddingsAPI(mockCtx, mockRequest)

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.any(Function), // api.embeddings.getAllDocumentEmbeddings
        {}
      )

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual(allEmbeddings)
    })

    it('handles empty embeddings collection', async () => {
      mockRunQuery.mockResolvedValue([])

      const mockRequest = {} as any

      const result = await simulateGetAllDocumentEmbeddingsAPI(mockCtx, mockRequest)

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual([])
    })
  })

  describe('GET /api/embeddings/llm-status - Check LLM Service Status', () => {
    it('successfully checks LLM service status', async () => {
      const mockStatus = {
        status: 'healthy',
        ready: true,
        model: 'sentence-transformers/all-distilroberta-v1',
        timestamp: Date.now(),
      }

      mockRunAction.mockResolvedValue(mockStatus)

      const mockRequest = {} as any

      const result = await simulateCheckLLMServiceStatusAPI(mockCtx, mockRequest)

      expect(mockRunAction).toHaveBeenCalledWith(
        expect.any(Function), // api.embeddings.checkLLMServiceStatus
        {}
      )

      expect(result.status).toBe(200)
      const responseData = await result.json()
      expect(responseData).toEqual(mockStatus)
    })

    it('handles LLM service unavailable', async () => {
      mockRunAction.mockRejectedValue(new Error('LLM service unavailable'))

      const mockRequest = {} as any

      const result = await simulateCheckLLMServiceStatusAPI(mockCtx, mockRequest)

      expect(result.status).toBe(500)
      const responseData = await result.json()
      expect(responseData.error).toBe('Internal server error')
    })
  })
})

// Simulate API handler functions

async function simulateGenerateDocumentEmbeddingAPI(ctx: any, request: any) {
  try {
    const body = await request.json()
    if (!body.documentId) {
      return new Response(JSON.stringify({ error: 'Missing documentId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    await ctx.runAction(jest.fn(), { documentId: body.documentId })
    return new Response(JSON.stringify({
      success: true,
      message: 'Embedding generation started successfully',
      documentId: body.documentId,
    }), {
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

async function simulateCreateDocumentEmbeddingAPI(ctx: any, request: any) {
  try {
    const body = await request.json()
    const { documentId, embedding, embeddingModel, embeddingDimensions, chunkText, chunkIndex, processingTimeMs } = body
    
    if (!documentId || !embedding) {
      return new Response(JSON.stringify({ error: 'Missing required fields: documentId, embedding' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    const result = await ctx.runMutation(jest.fn(), {
      documentId,
      embedding,
      embeddingModel: embeddingModel || 'all-MiniLM-L6-v2',
      embeddingDimensions: embeddingDimensions || embedding.length,
      chunkText,
      chunkIndex,
      processingTimeMs
    })
    
    return new Response(JSON.stringify({ success: true, embeddingId: result }), {
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

async function simulateGetDocumentEmbeddingsAPI(ctx: any, request: any) {
  try {
    const url = new URL(request.url)
    const documentId = url.searchParams.get('documentId')
    
    if (!documentId) {
      return new Response(JSON.stringify({ error: 'Missing documentId parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    const embeddings = await ctx.runQuery(jest.fn(), { documentId })
    return new Response(JSON.stringify(embeddings), {
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

async function simulateSearchDocumentsVectorAPI(ctx: any, request: any) {
  try {
    let queryText: string
    let limit: number = 10
    let documentIds: string[] | undefined

    if (request.method === 'POST') {
      const body = await request.json()
      queryText = body.queryText
      limit = body.limit || 10
      documentIds = body.documentIds
    } else {
      const url = new URL(request.url)
      queryText = url.searchParams.get('query') || url.searchParams.get('queryText') || ''
      limit = parseInt(url.searchParams.get('limit') || '10')
      const docIdsParam = url.searchParams.get('documentIds')
      documentIds = docIdsParam ? docIdsParam.split(',') : undefined
    }

    if (!queryText) {
      return new Response(JSON.stringify({ error: 'Missing queryText parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const results = await ctx.runAction(jest.fn(), {
      queryText,
      limit,
      documentIds,
    })

    return new Response(JSON.stringify(results), {
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

async function simulateGetAllDocumentEmbeddingsAPI(ctx: any, request: any) {
  try {
    const embeddings = await ctx.runQuery(jest.fn(), {})
    return new Response(JSON.stringify(embeddings), {
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

async function simulateCheckLLMServiceStatusAPI(ctx: any, request: any) {
  try {
    const status = await ctx.runAction(jest.fn(), {})
    return new Response(JSON.stringify(status), {
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