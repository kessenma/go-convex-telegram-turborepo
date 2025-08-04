// import React from 'react'
// import { screen, fireEvent, waitFor } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
// import { toast } from 'sonner'
// import { render, createMockDocument, createMockEmbedding } from '../utils/test-utils'
// import DocumentViewer from '../../components/rag/DocumentViewer'

// // Mock framer-motion more specifically
// jest.mock('framer-motion', () => ({
//   motion: {
//     div: ({ children, ...props }) => <div {...props}>{children}</div>,
//   },
//   AnimatePresence: ({ children }) => <>{children}</>,
// }))

// describe('DocumentViewer', () => {
//   const defaultProps = {
//     documentId: 'test-doc-123',
//     isOpen: true,
//     onClose: jest.fn(),
//     animationOrigin: { x: 100, y: 100 },
//     small: false,
//   }

//   beforeEach(() => {
//     jest.clearAllMocks()
//     // Mock fetch globally for each test
//     global.fetch = jest.fn()
//   })

//   afterEach(() => {
//     jest.restoreAllMocks()
//   })

//   describe('Document Loading', () => {
//     it('shows loading state initially', async () => {
//       const mockDocument = createMockDocument()
      
//       global.fetch = jest.fn(() =>
//         Promise.resolve({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//       ) as jest.Mock

//       render(<DocumentViewer {...defaultProps} />)

//       // Should show loading initially
//       expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument()
//     })

//     it('loads and displays document data correctly', async () => {
//       const mockDocument = createMockDocument({
//         title: 'Test Document Title',
//         contentType: 'markdown',
//         fileSize: 2048,
//         hasEmbedding: false,
//       })

//       global.fetch = jest.fn(() =>
//         Promise.resolve({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//       ) as jest.Mock

//       render(<DocumentViewer {...defaultProps} />)

//       await waitFor(() => {
//         expect(screen.getByText('Test Document Title')).toBeInTheDocument()
//       })

//       expect(screen.getByText('markdown • 2 KB')).toBeInTheDocument()
//       expect(screen.getByText('Not Embedded')).toBeInTheDocument()
//     })

//     it('handles document loading error', async () => {
//       global.fetch = jest.fn(() =>
//         Promise.resolve({
//           ok: false,
//           status: 404,
//         })
//       ) as jest.Mock

//       render(<DocumentViewer {...defaultProps} />)

//       await waitFor(() => {
//         expect(screen.getByText(/error/i)).toBeInTheDocument()
//       })
//     })
//   })

//   describe('Document with Embeddings', () => {
//     it('displays embedded document correctly', async () => {
//       const mockDocument = createMockDocument({
//         hasEmbedding: true,
//         title: 'Embedded Document',
//       })
//       const mockEmbedding = createMockEmbedding()

//       global.fetch = jest.fn()
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve([mockEmbedding]),
//         })

//       render(<DocumentViewer {...defaultProps} />)

//       await waitFor(() => {
//         expect(screen.getByText('Embedded Document')).toBeInTheDocument()
//       })

//       expect(screen.getByText('Embedded')).toBeInTheDocument()
//       expect(screen.getByText('Embedded Vectors')).toBeInTheDocument()
//     })

//     it('shows embedding details when expanded', async () => {
//       const mockDocument = createMockDocument({ hasEmbedding: true })
//       const mockEmbedding = createMockEmbedding({
//         embeddingModel: 'test-model',
//         embeddingDimensions: 384,
//         processingTimeMs: 1500,
//       })

//       global.fetch = jest.fn()
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve([mockEmbedding]),
//         })

//       render(<DocumentViewer {...defaultProps} />)

//       await waitFor(() => {
//         expect(screen.getByText('Embedded Vectors')).toBeInTheDocument()
//       })

//       // Click to expand embeddings section
//       const embeddingTrigger = screen.getByText('Embedded Vectors')
//       fireEvent.click(embeddingTrigger)

//       await waitFor(() => {
//         expect(screen.getByText('test-model')).toBeInTheDocument()
//         expect(screen.getByText('384')).toBeInTheDocument()
//         expect(screen.getByText('1500ms')).toBeInTheDocument()
//       })
//     })
//   })

//   describe('Document without Embeddings', () => {
//     it('shows retry embedding button for non-embedded documents', async () => {
//       const mockDocument = createMockDocument({ hasEmbedding: false })

//       global.fetch = jest.fn(() =>
//         Promise.resolve({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//       ) as jest.Mock

//       render(<DocumentViewer {...defaultProps} />)

//       await waitFor(() => {
//         expect(screen.getByText('Not Embedded')).toBeInTheDocument()
//       })

//       expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
//     })

//     it('handles retry embedding correctly', async () => {
//       const mockDocument = createMockDocument({ hasEmbedding: false })
//       const user = userEvent.setup()

//       global.fetch = jest.fn()
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve({ success: true }),
//         })

//       render(<DocumentViewer {...defaultProps} />)

//       await waitFor(() => {
//         expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
//       })

//       const retryButton = screen.getByRole('button', { name: /try again/i })
//       await user.click(retryButton)

//       expect(global.fetch).toHaveBeenCalledWith('/api/RAG/embeddings', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ documentId: 'test-doc-123' }),
//       })

//       expect(toast.success).toHaveBeenCalledWith('Embedding generation started successfully')
//     })

//     it('handles retry embedding error', async () => {
//       const mockDocument = createMockDocument({ hasEmbedding: false })
//       const user = userEvent.setup()

//       global.fetch = jest.fn()
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//         .mockResolvedValueOnce({
//           ok: false,
//           json: () => Promise.resolve({ error: 'Embedding failed' }),
//         })

//       render(<DocumentViewer {...defaultProps} />)

//       await waitFor(() => {
//         expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
//       })

//       const retryButton = screen.getByRole('button', { name: /try again/i })
//       await user.click(retryButton)

//       await waitFor(() => {
//         expect(toast.error).toHaveBeenCalledWith('Embedding failed')
//       })
//     })
//   })

//   describe('Document Actions', () => {
//     it('handles document deletion correctly', async () => {
//       const mockDocument = createMockDocument()
//       const onClose = jest.fn()
//       const user = userEvent.setup()

//       global.fetch = jest.fn()
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve({ success: true }),
//         })

//       render(<DocumentViewer {...defaultProps} onClose={onClose} />)

//       await waitFor(() => {
//         expect(screen.getByText('Test Document')).toBeInTheDocument()
//       })

//       const deleteButton = screen.getByRole('button', { name: /delete/i })
//       await user.click(deleteButton)

//       expect(global.fetch).toHaveBeenCalledWith('/api/documents/test-doc-123', {
//         method: 'DELETE',
//       })

//       expect(toast.success).toHaveBeenCalledWith('Document deleted successfully')
//     })

//     it('handles document deletion error', async () => {
//       const mockDocument = createMockDocument()
//       const user = userEvent.setup()

//       global.fetch = jest.fn()
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//         .mockResolvedValueOnce({
//           ok: false,
//           status: 500,
//         })

//       render(<DocumentViewer {...defaultProps} />)

//       await waitFor(() => {
//         expect(screen.getByText('Test Document')).toBeInTheDocument()
//       })

//       const deleteButton = screen.getByRole('button', { name: /delete/i })
//       await user.click(deleteButton)

//       await waitFor(() => {
//         expect(toast.error).toHaveBeenCalledWith('Failed to delete document')
//       })
//     })

//     it('closes viewer when close button is clicked', async () => {
//       const mockDocument = createMockDocument()
//       const onClose = jest.fn()
//       const user = userEvent.setup()

//       global.fetch = jest.fn(() =>
//         Promise.resolve({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//       ) as jest.Mock

//       render(<DocumentViewer {...defaultProps} onClose={onClose} />)

//       await waitFor(() => {
//         expect(screen.getByText('Test Document')).toBeInTheDocument()
//       })

//       const closeButton = screen.getByRole('button', { name: /close/i })
//       await user.click(closeButton)

//       expect(onClose).toHaveBeenCalled()
//     })
//   })

//   describe('Responsive Design', () => {
//     it('renders in small mode correctly', async () => {
//       const mockDocument = createMockDocument()

//       global.fetch = jest.fn(() =>
//         Promise.resolve({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//       ) as jest.Mock

//       render(<DocumentViewer {...defaultProps} small={true} />)

//       await waitFor(() => {
//         expect(screen.getByText('Test Document')).toBeInTheDocument()
//       })

//       // Check that small mode styling is applied
//       const viewer = screen.getByText('Test Document').closest('div')
//       expect(viewer).toHaveClass('max-w-2xl')
//     })
//   })

//   describe('Keyboard Navigation', () => {
//     it('closes viewer on Escape key press', async () => {
//       const mockDocument = createMockDocument()
//       const onClose = jest.fn()

//       global.fetch = jest.fn(() =>
//         Promise.resolve({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//       ) as jest.Mock

//       render(<DocumentViewer {...defaultProps} onClose={onClose} />)

//       await waitFor(() => {
//         expect(screen.getByText('Test Document')).toBeInTheDocument()
//       })

//       fireEvent.keyDown(window, { key: 'Escape' })

//       expect(onClose).toHaveBeenCalled()
//     })
//   })

//   describe('Conditional Rendering', () => {
//     it('does not render when isOpen is false', () => {
//       render(<DocumentViewer {...defaultProps} isOpen={false} />)

//       expect(screen.queryByText('Test Document')).not.toBeInTheDocument()
//     })

//     it('only shows documents with embeddings in DocumentSelector context', async () => {
//       // This test ensures DocumentViewer only appears for embedded documents
//       const mockDocument = createMockDocument({ hasEmbedding: true })

//       global.fetch = jest.fn(() =>
//         Promise.resolve({
//           ok: true,
//           json: () => Promise.resolve(mockDocument),
//         })
//       ) as jest.Mock

//       render(<DocumentViewer {...defaultProps} />)

//       await waitFor(() => {
//         expect(screen.getByText('Embedded')).toBeInTheDocument()
//       })
//     })
//   })
// })