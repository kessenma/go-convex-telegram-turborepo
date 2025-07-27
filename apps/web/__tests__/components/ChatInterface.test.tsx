import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { render, createMockDocument, mockFetchSuccess, mockFetchError } from '../utils/test-utils'
import { ChatInterface } from '../../app/RAG-chat/components/ChatInterface'

// Mock Convex hooks
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
}))

// Mock icon utils
jest.mock('../../lib/icon-utils', () => ({
  renderIcon: (Icon: any, props: any) => {
    const iconMap: Record<string, string> = {
      ArrowLeft: '←',
      History: '📜',
      MessageCircle: '💬',
      Bot: '🤖',
      User: '👤',
      Loader2: '⏳',
      Send: '📤',
    }
    const iconName = Icon.name || Icon.displayName || 'Unknown'
    return <span {...props}>{iconMap[iconName] || '❓'}</span>
  },
}))

// Mock components
jest.mock('../../components/rag/DocumentFolderIcon', () => {
  return function MockDocumentFolderIcon({ documentId, className }: any) {
    return <div data-testid={`folder-icon-${documentId}`} className={className}>📁</div>
  }
})

jest.mock('../../components/ui/accordion', () => ({
  Accordion: ({ children, className }: any) => <div className={className}>{children}</div>,
  AccordionItem: ({ children }: any) => <div>{children}</div>,
  AccordionTrigger: ({ children, className }: any) => (
    <button className={className}>{children}</button>
  ),
  AccordionContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}))

jest.mock('../../components/ui/tool-tip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => asChild ? children : <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}))

import { useQuery } from 'convex/react'
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe('ChatInterface', () => {
  const mockDocuments = [
    createMockDocument({
      _id: 'doc-1',
      title: 'Test Document 1',
    }),
    createMockDocument({
      _id: 'doc-2',
      title: 'Test Document 2',
    }),
  ]

  const defaultProps = {
    selectedDocuments: mockDocuments,
    onBackToSelection: jest.fn(),
    sessionId: 'test-session-123',
    onShowHistory: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    
    // Mock Convex queries to return null by default
    mockUseQuery.mockReturnValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Header and Navigation', () => {
    it('renders header with navigation buttons correctly', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText('Chat')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /back to selection/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument()
    })

    it('calls onBackToSelection when back button is clicked', async () => {
      const user = userEvent.setup()
      const onBackToSelection = jest.fn()

      render(<ChatInterface {...defaultProps} onBackToSelection={onBackToSelection} />)

      const backButton = screen.getByRole('button', { name: /back to selection/i })
      await user.click(backButton)

      expect(onBackToSelection).toHaveBeenCalled()
    })

    it('calls onShowHistory when history button is clicked', async () => {
      const user = userEvent.setup()
      const onShowHistory = jest.fn()

      render(<ChatInterface {...defaultProps} onShowHistory={onShowHistory} />)

      const historyButton = screen.getByRole('button', { name: /history/i })
      await user.click(historyButton)

      expect(onShowHistory).toHaveBeenCalled()
    })

    it('displays selected documents in accordion', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText('Chatting with:')).toBeInTheDocument()
      expect(screen.getByText('Test Document 1')).toBeInTheDocument()
      expect(screen.getByText('Test Document 2')).toBeInTheDocument()
      expect(screen.getByTestId('folder-icon-doc-1')).toBeInTheDocument()
      expect(screen.getByTestId('folder-icon-doc-2')).toBeInTheDocument()
    })

    it('shows model information in accordion content', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText('Powered by all-MiniLM-L6-v2 embeddings + Llama 3.2 1B LLM')).toBeInTheDocument()
    })
  })

  describe('Message Display', () => {
    it('shows empty state when no messages', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText('Start a conversation by asking a question about your documents.')).toBeInTheDocument()
    })

    it('loads existing messages from conversation', () => {
      const mockConversation = { _id: 'conv-123' }
      const mockMessages = [
        {
          messageId: 'msg-1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
        },
        {
          messageId: 'msg-2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: Date.now(),
          sources: [
            {
              title: 'Test Doc',
              snippet: 'Test snippet',
              score: 0.95,
            },
          ],
        },
      ]

      mockUseQuery
        .mockReturnValueOnce(mockConversation) // getConversationBySessionId
        .mockReturnValueOnce(mockMessages) // getConversationMessages

      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
      expect(screen.getByText('Sources:')).toBeInTheDocument()
      expect(screen.getByText('Test Doc')).toBeInTheDocument()
      expect(screen.getByText('95.0% match')).toBeInTheDocument()
    })

    it('displays user and assistant messages with correct styling', () => {
      const mockConversation = { _id: 'conv-123' }
      const mockMessages = [
        {
          messageId: 'msg-1',
          role: 'user',
          content: 'User message',
          timestamp: Date.now(),
        },
        {
          messageId: 'msg-2',
          role: 'assistant',
          content: 'Assistant message',
          timestamp: Date.now(),
        },
      ]

      mockUseQuery
        .mockReturnValueOnce(mockConversation)
        .mockReturnValueOnce(mockMessages)

      render(<ChatInterface {...defaultProps} />)

      const userMessage = screen.getByText('User message').closest('div')
      const assistantMessage = screen.getByText('Assistant message').closest('div')

      expect(userMessage).toHaveClass('bg-curious-cyan-600')
      expect(assistantMessage).toHaveClass('bg-gray-700')
    })
  })

  describe('Message Input and Sending', () => {
    it('handles text input correctly', async () => {
      const user = userEvent.setup()

      render(<ChatInterface {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
      await user.type(textarea, 'Test message')

      expect(textarea).toHaveValue('Test message')
    })

    it('sends message on button click', async () => {
      const user = userEvent.setup()
      mockFetchSuccess({
        response: 'Test response',
        sources: [],
      })

      render(<ChatInterface {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      expect(global.fetch).toHaveBeenCalledWith('/api/RAG/simple-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test message',
          documentIds: ['doc-1', 'doc-2'],
        }),
      })
    })

    it('sends message on Enter key press', async () => {
      const user = userEvent.setup()
      mockFetchSuccess({
        response: 'Test response',
        sources: [],
      })

      render(<ChatInterface {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
      await user.type(textarea, 'Test message')
      await user.keyboard('{Enter}')

      expect(global.fetch).toHaveBeenCalled()
    })

    it('does not send message on Shift+Enter', async () => {
      const user = userEvent.setup()

      render(<ChatInterface {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
      await user.type(textarea, 'Test message')
      await user.keyboard('{Shift>}{Enter}{/Shift}')

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('disables input and button during loading', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      global.fetch = jest.fn(() => new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ response: 'Test response', sources: [] })
        }), 100)
      )) as jest.Mock

      render(<ChatInterface {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)

      // Check loading state
      expect(textarea).toBeDisabled()
      expect(sendButton).toBeDisabled()
      expect(screen.getByText('Thinking…')).toBeInTheDocument()
    })

    it('clears input after sending message', async () => {
      const user = userEvent.setup()
      mockFetchSuccess({
        response: 'Test response',
        sources: [],
      })

      render(<ChatInterface {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
      await user.type(textarea, 'Test message')
      await user.click(screen.getByRole('button', { name: /send/i }))

      await waitFor(() => {
        expect(textarea).toHaveValue('')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors correctly', async () => {
      const user = userEvent.setup()
      mockFetchError('Chat service error', 500)

      render(<ChatInterface {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
      await user.type(textarea, 'Test message')
      await user.click(screen.getByRole('button', { name: /send/i }))

      await waitFor(() => {
        expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument()
      })

      expect(toast.error).toHaveBeenCalled()
    })

    it('handles service unavailable (503) error', async () => {
      const user = userEvent.setup()
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.resolve({
            serviceUnavailable: true,
            error: 'Service temporarily unavailable'
          }),
        })
      ) as jest.Mock

      render(<ChatInterface {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
      await user.type(textarea, 'Test message')
      await user.click(screen.getByRole('button', { name: /send/i }))

      await waitFor(() => {
        expect(screen.getByText('Service temporarily unavailable')).toBeInTheDocument()
      })

      expect(toast.error).toHaveBeenCalledWith('Service temporarily unavailable')
    })

    it('prevents double submission during loading', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      global.fetch = jest.fn(() => new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ response: 'Test response', sources: [] })
        }), 100)
      )) as jest.Mock

      render(<ChatInterface {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Test message')
      await user.click(sendButton)
      await user.click(sendButton) // Try to click again

      // Should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Message Sources', () => {
    it('displays sources for assistant messages', () => {
      const mockConversation = { _id: 'conv-123' }
      const mockMessages = [
        {
          messageId: 'msg-1',
          role: 'assistant',
          content: 'Response with sources',
          timestamp: Date.now(),
          sources: [
            {
              title: 'Document 1',
              snippet: 'Relevant snippet from document',
              score: 0.85,
            },
            {
              title: 'Document 2',
              snippet: 'Another relevant snippet',
              score: 0.75,
            },
          ],
        },
      ]

      mockUseQuery
        .mockReturnValueOnce(mockConversation)
        .mockReturnValueOnce(mockMessages)

      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText('Sources:')).toBeInTheDocument()
      expect(screen.getByText('Document 1')).toBeInTheDocument()
      expect(screen.getByText('Document 2')).toBeInTheDocument()
      expect(screen.getByText('85.0% match')).toBeInTheDocument()
      expect(screen.getByText('75.0% match')).toBeInTheDocument()
      expect(screen.getByText('Relevant snippet from document')).toBeInTheDocument()
      expect(screen.getByText('Another relevant snippet')).toBeInTheDocument()
    })

    it('does not show sources section when no sources available', () => {
      const mockConversation = { _id: 'conv-123' }
      const mockMessages = [
        {
          messageId: 'msg-1',
          role: 'assistant',
          content: 'Response without sources',
          timestamp: Date.now(),
        },
      ]

      mockUseQuery
        .mockReturnValueOnce(mockConversation)
        .mockReturnValueOnce(mockMessages)

      render(<ChatInterface {...defaultProps} />)

      expect(screen.queryByText('Sources:')).not.toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('truncates long document titles on mobile', () => {
      const longTitleDocuments = [
        createMockDocument({
          _id: 'doc-1',
          title: 'This is a very long document title that should be truncated on mobile devices',
        }),
      ]

      render(<ChatInterface {...defaultProps} selectedDocuments={longTitleDocuments} />)

      const titleElement = screen.getByText('This is a very long document title that should be truncated on mobile devices')
      expect(titleElement).toHaveClass('truncate', 'max-w-[150px]', 'sm:max-w-none')
    })

    it('adjusts padding for different screen sizes', () => {
      render(<ChatInterface {...defaultProps} />)

      const headerNav = screen.getByText('Chat').closest('div')
      expect(headerNav).toHaveClass('p-3', 'sm:p-4')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByRole('button', { name: /back to selection/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Ask a question about your documents...')).toBeInTheDocument()
    })

    it('disables send button when input is empty', () => {
      render(<ChatInterface {...defaultProps} />)

      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()
    })

    it('enables send button when input has content', async () => {
      const user = userEvent.setup()

      render(<ChatInterface {...defaultProps} />)

      const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      await user.type(textarea, 'Test message')

      expect(sendButton).not.toBeDisabled()
    })
  })
})