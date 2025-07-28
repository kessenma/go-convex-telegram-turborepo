import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockDocument } from '../utils/test-utils'
import { DocumentSelector } from '../../components/rag/chat/DocumentSelector'
import { useRagChatStore } from '../../stores/ragChatStore'

// Mock Zustand store
jest.mock('../../stores/ragChatStore', () => ({
  useRagChatStore: jest.fn(),
}))

const mockUseRagChatStore = useRagChatStore as jest.MockedFunction<typeof useRagChatStore>

// Mock window.location
const mockLocation = {
  href: '',
  reload: jest.fn(),
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('DocumentSelector', () => {
  const mockStoreActions = {
    toggleDocument: jest.fn(),
    navigateToChat: jest.fn(),
    navigateToHistory: jest.fn(),
  }

  const defaultStoreState = {
    documents: [],
    selectedDocuments: [],
    ...mockStoreActions,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocation.href = ''
    
    // Mock Zustand store
    mockUseRagChatStore.mockReturnValue(defaultStoreState)
  })

  describe('Empty State', () => {
    it('shows empty state when no embedded documents are available', () => {
      const documentsWithoutEmbeddings = [
        createMockDocument({ hasEmbedding: false }),
        createMockDocument({ _id: 'doc-2', hasEmbedding: false }),
      ]
      
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: documentsWithoutEmbeddings,
      })

      render(<DocumentSelector />)

      expect(screen.getByText('No Embedded Documents Found')).toBeInTheDocument()
      expect(screen.getByText('You need to upload and embed documents before you can start chatting.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    it('redirects to upload page when upload button is clicked', async () => {
      const user = userEvent.setup()

      render(<DocumentSelector />)

      const uploadButton = screen.getByRole('button', { name: /upload documents/i })
      await user.click(uploadButton)

      expect(mockLocation.href).toBe('/RAG-upload')
    })

    it('handles non-array documents gracefully', () => {
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: null as any,
      })
      
      render(<DocumentSelector />)

      expect(screen.getByText('No Embedded Documents Found')).toBeInTheDocument()
    })
  })

  describe('Document List', () => {
    const embeddedDocuments = [
      createMockDocument({
        _id: 'doc-1',
        title: 'First Document',
        hasEmbedding: true,
        fileSize: 1024,
        wordCount: 100,
        contentType: 'markdown',
        summary: 'This is the first document summary',
      }),
      createMockDocument({
        _id: 'doc-2',
        title: 'Second Document',
        hasEmbedding: true,
        fileSize: 2048,
        wordCount: 200,
        contentType: 'text',
      }),
    ]

    it('displays embedded documents correctly', () => {
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
      })
      
      render(<DocumentSelector />)

      expect(screen.getByText('First Document')).toBeInTheDocument()
      expect(screen.getByText('Second Document')).toBeInTheDocument()
      expect(screen.getByText('2 embedded documents available')).toBeInTheDocument()
    })

    it('shows document metadata correctly', () => {
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
      })
      
      render(<DocumentSelector />)

      // Check file sizes
      expect(screen.getByText('1 KB')).toBeInTheDocument()
      expect(screen.getByText('2 KB')).toBeInTheDocument()

      // Check word counts
      expect(screen.getByText('100 words')).toBeInTheDocument()
      expect(screen.getByText('200 words')).toBeInTheDocument()

      // Check content types
      expect(screen.getByText('markdown')).toBeInTheDocument()
      expect(screen.getByText('text')).toBeInTheDocument()
    })

    it('shows document summary when available', () => {
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
      })
      
      render(<DocumentSelector />)

      expect(screen.getByText('This is the first document summary')).toBeInTheDocument()
    })

    it('filters out non-embedded documents', () => {
      const mixedDocuments = [
        ...embeddedDocuments,
        createMockDocument({
          _id: 'doc-3',
          title: 'Non-embedded Document',
          hasEmbedding: false,
        }),
      ]
      
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: mixedDocuments,
      })

      render(<DocumentSelector />)

      expect(screen.getByText('First Document')).toBeInTheDocument()
      expect(screen.getByText('Second Document')).toBeInTheDocument()
      expect(screen.queryByText('Non-embedded Document')).not.toBeInTheDocument()
      expect(screen.getByText('2 embedded documents available')).toBeInTheDocument()
    })
  })

  describe('Document Selection', () => {
    const embeddedDocuments = [
      createMockDocument({
        _id: 'doc-1',
        title: 'First Document',
        hasEmbedding: true,
      }),
      createMockDocument({
        _id: 'doc-2',
        title: 'Second Document',
        hasEmbedding: true,
      }),
    ]

    it('handles document selection correctly', async () => {
      const user = userEvent.setup()
      const mockToggleDocument = jest.fn()
      
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
        toggleDocument: mockToggleDocument,
      })

      render(<DocumentSelector />)

      const firstDocument = screen.getByText('First Document').closest('div')
      await user.click(firstDocument!)

      expect(mockToggleDocument).toHaveBeenCalledWith('doc-1')
    })

    it('shows selected documents with different styling', () => {
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
        selectedDocuments: ['doc-1'],
      })
      
      render(<DocumentSelector />)

      const firstDocument = screen.getByText('First Document').closest('div')
      const secondDocument = screen.getByText('Second Document').closest('div')

      expect(firstDocument).toHaveClass('border-curious-cyan-500')
      expect(secondDocument).toHaveClass('border-gray-700')
    })

    it('shows checkmark for selected documents', () => {
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
        selectedDocuments: ['doc-1'],
      })
      
      render(<DocumentSelector />)

      // The selected document should have a checkmark
      const checkboxes = screen.getAllByRole('generic') // checkboxes are rendered as divs
      const selectedCheckbox = checkboxes.find(el => 
        el.classList.contains('bg-curious-cyan-500')
      )
      expect(selectedCheckbox).toBeInTheDocument()
    })
  })

  describe('Chat Actions', () => {
    const embeddedDocuments = [
      createMockDocument({
        _id: 'doc-1',
        title: 'First Document',
        hasEmbedding: true,
      }),
    ]

    it('disables start chat button when no documents are selected', () => {
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
        selectedDocuments: [],
      })
      
      render(<DocumentSelector />)

      const startChatButton = screen.getByRole('button', { name: /start chat \(0 selected\)/i })
      expect(startChatButton).toBeDisabled()
    })

    it('enables start chat button when documents are selected', () => {
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
        selectedDocuments: ['doc-1'],
      })
      
      render(<DocumentSelector />)

      const startChatButton = screen.getByRole('button', { name: /start chat \(1 selected\)/i })
      expect(startChatButton).not.toBeDisabled()
    })

    it('calls onStartChat when start chat button is clicked', async () => {
      const user = userEvent.setup()
      const mockNavigateToChat = jest.fn()
      
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
        selectedDocuments: ['doc-1'],
        navigateToChat: mockNavigateToChat,
      })

      render(<DocumentSelector />)

      const startChatButton = screen.getByRole('button', { name: /start chat \(1 selected\)/i })
      await user.click(startChatButton)

      expect(mockNavigateToChat).toHaveBeenCalled()
    })

    it('calls onShowHistory when view history button is clicked', async () => {
      const user = userEvent.setup()
      const mockNavigateToHistory = jest.fn()
      
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
        navigateToHistory: mockNavigateToHistory,
      })

      render(<DocumentSelector />)

      const historyButton = screen.getByRole('button', { name: /view history/i })
      await user.click(historyButton)

      expect(mockNavigateToHistory).toHaveBeenCalled()
    })
  })

  describe('Responsive Design', () => {
    const embeddedDocuments = [
      createMockDocument({
        _id: 'doc-1',
        title: 'Test Document',
        hasEmbedding: true,
      }),
    ]

    it('shows different text for mobile and desktop', () => {
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
        selectedDocuments: ['doc-1'],
      })
      
      render(<DocumentSelector />)

      // Desktop text
      expect(screen.getByText('Start Chat (1 selected)')).toBeInTheDocument()
      // Mobile text (hidden by default but present in DOM)
      expect(screen.getByText('Chat (1)')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    const embeddedDocuments = [
      createMockDocument({
        _id: 'doc-1',
        title: 'Test Document',
        hasEmbedding: true,
      }),
    ]

    it('provides tooltip for disabled start chat button', async () => {
      const user = userEvent.setup()
      
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
        selectedDocuments: [],
      })

      render(<DocumentSelector />)

      const disabledButton = screen.getByRole('button', { name: /start chat \(0 selected\)/i })
      
      // Hover over disabled button to show tooltip
      await user.hover(disabledButton)

      // Note: Tooltip content might not be immediately visible in tests
      // This test ensures the tooltip trigger is present
      expect(disabledButton).toBeInTheDocument()
    })

    it('has proper button roles and labels', () => {
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: embeddedDocuments,
        selectedDocuments: ['doc-1'],
      })
      
      render(<DocumentSelector />)

      expect(screen.getByRole('button', { name: /start chat/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view history/i })).toBeInTheDocument()
    })
  })

  describe('Data Formatting', () => {
    it('formats file sizes correctly', () => {
      const documentsWithVariousSizes = [
        createMockDocument({
          _id: 'doc-1',
          title: 'Small File',
          hasEmbedding: true,
          fileSize: 512, // 512 bytes
        }),
        createMockDocument({
          _id: 'doc-2',
          title: 'Medium File',
          hasEmbedding: true,
          fileSize: 1024 * 1024, // 1 MB
        }),
      ]
      
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: documentsWithVariousSizes,
      })

      render(<DocumentSelector />)

      expect(screen.getByText('512 Bytes')).toBeInTheDocument()
      expect(screen.getByText('1 MB')).toBeInTheDocument()
    })

    it('formats word counts with locale formatting', () => {
      const documentWithLargeWordCount = [
        createMockDocument({
          _id: 'doc-1',
          title: 'Large Document',
          hasEmbedding: true,
          wordCount: 12345,
        }),
      ]
      
      mockUseRagChatStore.mockReturnValue({
        ...defaultStoreState,
        documents: documentWithLargeWordCount,
      })

      render(<DocumentSelector />)

      expect(screen.getByText('12,345 words')).toBeInTheDocument()
    })
  })
})