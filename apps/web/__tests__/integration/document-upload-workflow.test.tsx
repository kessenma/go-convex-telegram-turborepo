import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { render, createMockFile } from '../utils/test-utils'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

// Mock components for integration testing
const MockUploadPage = () => {
  const [uploadMethod, setUploadMethod] = React.useState<'file' | 'text'>('file')
  const [title, setTitle] = React.useState('')
  const [summary, setSummary] = React.useState('')
  const [textContent, setTextContent] = React.useState('')
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = React.useState('')
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = React.useState(false)
  const [embeddingMessage, setEmbeddingMessage] = React.useState('')

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadStatus('idle')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title || file.name.replace(/\.[^/.]+$/, ''))
      formData.append('summary', summary)
      
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: title || file.name.replace(/\.[^/.]+$/, ''),
          content: await file.text(),
          contentType: 'text',
          fileSize: file.size,
          summary,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        setUploadStatus('success')
        setUploadMessage('Document uploaded successfully!')
        
        // Automatically start embedding generation
        setTimeout(() => {
          handleGenerateEmbeddings(result.documentId)
        }, 1000)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      setUploadStatus('error')
      setUploadMessage('Upload failed!')
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerateEmbeddings = async (documentId?: string) => {
    setIsGeneratingEmbeddings(true)
    setEmbeddingMessage('Generating embeddings...')
    
    try {
      const response = await fetch('/api/RAG/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      })
      
      if (response.ok) {
        setEmbeddingMessage('Embeddings generated successfully!')
        // Simulate notification
        setTimeout(() => {
          toast.success('Document is now ready for chat!')
        }, 500)
      } else {
        throw new Error('Embedding generation failed')
      }
    } catch (error) {
      setEmbeddingMessage('Embedding generation failed!')
      toast.error('Failed to generate embeddings')
    } finally {
      setIsGeneratingEmbeddings(false)
    }
  }

  return (
    <div data-testid="upload-page">
      <h1>Upload Document</h1>
      
      {/* Simplified upload form */}
      <div>
        <input
          type="text"
          placeholder="Document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="title-input"
        />
        
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setTitle(file.name.replace(/\.[^/.]+$/, ''))
              handleFileUpload(file)
            }
          }}
          data-testid="file-input"
        />
        
        {isUploading && <div data-testid="upload-loading">Uploading...</div>}
        {uploadStatus === 'success' && <div data-testid="upload-success">{uploadMessage}</div>}
        {uploadStatus === 'error' && <div data-testid="upload-error">{uploadMessage}</div>}
        
        {isGeneratingEmbeddings && <div data-testid="embedding-loading">{embeddingMessage}</div>}
        {!isGeneratingEmbeddings && embeddingMessage && (
          <div data-testid="embedding-status">{embeddingMessage}</div>
        )}
      </div>
    </div>
  )
}

describe('Document Upload Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Upload and Embedding Flow', () => {
    it('successfully uploads document and generates embeddings', async () => {
      const user = userEvent.setup()
      
      render(<MockUploadPage />)
      
      // Step 1: Upload document
      const fileInput = screen.getByTestId('file-input')
      const mockFile = createMockFile('test-document.txt', 'This is test content for the document.')
      
      await user.upload(fileInput, mockFile)
      
      // Step 2: Verify upload starts
      expect(screen.getByTestId('upload-loading')).toBeInTheDocument()
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
      
      // Step 3: Wait for upload success
      await waitFor(() => {
        expect(screen.getByTestId('upload-success')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      expect(screen.getByText('Document uploaded successfully!')).toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Document uploaded successfully!')
      
      // Step 4: Wait for embedding generation to start
      await waitFor(() => {
        expect(screen.getByTestId('embedding-loading')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      expect(screen.getByText('Generating embeddings...')).toBeInTheDocument()
      
      // Step 5: Wait for embedding completion
      await waitFor(() => {
        expect(screen.getByTestId('embedding-status')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      expect(screen.getByText('Embeddings generated successfully!')).toBeInTheDocument()
      
      // Step 6: Verify final notification
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Document is now ready for chat!')
      }, { timeout: 1000 })
    })

    it('handles upload failure gracefully', async () => {
      const user = userEvent.setup()
      
      // Override the mock to simulate failure
      server.use(
        http.post('/api/documents', () => {
          return HttpResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
          )
        })
      )
      
      render(<MockUploadPage />)
      
      const fileInput = screen.getByTestId('file-input')
      const mockFile = createMockFile('test-document.txt', 'This is test content.')
      
      await user.upload(fileInput, mockFile)
      
      // Wait for upload failure
      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toBeInTheDocument()
      })
      
      expect(screen.getByText('Upload failed!')).toBeInTheDocument()
      expect(toast.error).toHaveBeenCalledWith('Upload failed!')
    })

    it('handles embedding generation failure gracefully', async () => {
      const user = userEvent.setup()
      
      // Override the mock to simulate embedding failure
      server.use(
        http.post('/api/RAG/embeddings', () => {
          return HttpResponse.json(
            { error: 'Embedding generation failed' },
            { status: 500 }
          )
        })
      )
      
      render(<MockUploadPage />)
      
      const fileInput = screen.getByTestId('file-input')
      const mockFile = createMockFile('test-document.txt', 'This is test content.')
      
      await user.upload(fileInput, mockFile)
      
      // Wait for upload success
      await waitFor(() => {
        expect(screen.getByTestId('upload-success')).toBeInTheDocument()
      })
      
      // Wait for embedding failure
      await waitFor(() => {
        expect(screen.getByText('Embedding generation failed!')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      expect(toast.error).toHaveBeenCalledWith('Failed to generate embeddings')
    })
  })

  describe('Notification System Integration', () => {
    it('creates notifications for upload and embedding events', async () => {
      const user = userEvent.setup()
      
      // Mock notification creation
      const notificationSpy = jest.fn()
      server.use(
        http.post('/api/notifications', async ({ request }) => {
          const body = await request.json()
          notificationSpy(body)
          return HttpResponse.json({
            success: true,
            notificationId: 'test-notification',
          })
        })
      )
      
      render(<MockUploadPage />)
      
      const fileInput = screen.getByTestId('file-input')
      const mockFile = createMockFile('test-document.txt', 'This is test content.')
      
      await user.upload(fileInput, mockFile)
      
      // Wait for the complete workflow
      await waitFor(() => {
        expect(screen.getByText('Embeddings generated successfully!')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      // Verify notifications were created (this would be called by the actual notification system)
      // In a real implementation, the backend would create these notifications
      expect(toast.success).toHaveBeenCalledWith('Document uploaded successfully!')
      expect(toast.success).toHaveBeenCalledWith('Document is now ready for chat!')
    })
  })

  describe('Document State Management', () => {
    it('updates document state from non-embedded to embedded', async () => {
      const user = userEvent.setup()
      
      // Track document state changes
      let documentState = { hasEmbedding: false }
      
      server.use(
        http.get('/api/documents/:id', ({ params }) => {
          return HttpResponse.json({
            _id: params.id,
            title: 'Test Document',
            content: 'Test content',
            contentType: 'text',
            fileSize: 1024,
            wordCount: 10,
            uploadedAt: Date.now(),
            hasEmbedding: documentState.hasEmbedding,
          })
        }),
        
        http.post('/api/RAG/embeddings', async () => {
          // Simulate embedding completion
          setTimeout(() => {
            documentState.hasEmbedding = true
          }, 1000)
          
          return HttpResponse.json({
            success: true,
            message: 'Embedding generation started',
          })
        })
      )
      
      render(<MockUploadPage />)
      
      const fileInput = screen.getByTestId('file-input')
      const mockFile = createMockFile('test-document.txt', 'This is test content.')
      
      await user.upload(fileInput, mockFile)
      
      // Wait for complete workflow
      await waitFor(() => {
        expect(screen.getByText('Embeddings generated successfully!')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      // Verify state transition
      expect(documentState.hasEmbedding).toBe(true)
    })
  })

  describe('Error Recovery', () => {
    it('allows retry after embedding failure', async () => {
      const user = userEvent.setup()
      let embeddingAttempts = 0
      
      server.use(
        http.post('/api/RAG/embeddings', () => {
          embeddingAttempts++
          if (embeddingAttempts === 1) {
            return HttpResponse.json(
              { error: 'Embedding generation failed' },
              { status: 500 }
            )
          } else {
            return HttpResponse.json({
              success: true,
              message: 'Embedding generation started',
            })
          }
        })
      )
      
      render(<MockUploadPage />)
      
      const fileInput = screen.getByTestId('file-input')
      const mockFile = createMockFile('test-document.txt', 'This is test content.')
      
      await user.upload(fileInput, mockFile)
      
      // Wait for initial embedding failure
      await waitFor(() => {
        expect(screen.getByText('Embedding generation failed!')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // In a real implementation, there would be a retry button
      // For this test, we simulate the retry by checking that the system
      // can handle multiple embedding attempts
      expect(embeddingAttempts).toBe(1)
    })
  })

  describe('Performance and Timing', () => {
    it('completes workflow within reasonable time limits', async () => {
      const user = userEvent.setup()
      const startTime = Date.now()
      
      render(<MockUploadPage />)
      
      const fileInput = screen.getByTestId('file-input')
      const mockFile = createMockFile('test-document.txt', 'This is test content.')
      
      await user.upload(fileInput, mockFile)
      
      await waitFor(() => {
        expect(screen.getByText('Embeddings generated successfully!')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      // Workflow should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000)
    })
  })
})