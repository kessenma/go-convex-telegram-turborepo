import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockDocument, mockFetchSuccess } from '../utils/test-utils'
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

// Mock components with simple implementations
jest.mock('../../components/rag/DocumentFolderIcon', () => {
  return function MockDocumentFolderIcon() {
    return <span>📁</span>
  }
})

jest.mock('../../components/ui/accordion', () => ({
  Accordion: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children }: any) => <div>{children}</div>,
  AccordionTrigger: ({ children }: any) => <button>{children}</button>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('../../components/ui/tool-tip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => asChild ? children : <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}))

import { useQuery } from 'convex/react'
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe('ChatInterface - Basic Tests', () => {
  const mockDocuments = [
    createMockDocument({
      _id: 'doc-1',
      title: 'Test Document',
    }),
  ]

  const defaultProps = {
    selectedDocuments: mockDocuments,
    onBackToSelection: jest.fn(),
    sessionId: 'test-session',
    onShowHistory: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    mockUseQuery.mockReturnValue(null)
  })

  it('renders chat interface correctly', () => {
    render(<ChatInterface {...defaultProps} />)

    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Chatting with:')).toBeInTheDocument()
    expect(screen.getByText('Test Document')).toBeInTheDocument()
  })

  it('shows navigation buttons', () => {
    render(<ChatInterface {...defaultProps} />)

    expect(screen.getByRole('button', { name: /back to selection/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument()
  })

  it('shows empty state when no messages', () => {
    render(<ChatInterface {...defaultProps} />)

    expect(screen.getByText('Start a conversation by asking a question about your documents.')).toBeInTheDocument()
  })

  it('has message input and send button', () => {
    render(<ChatInterface {...defaultProps} />)

    expect(screen.getByPlaceholderText('Ask a question about your documents...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('calls navigation callbacks correctly', async () => {
    const user = userEvent.setup()
    const onBackToSelection = jest.fn()
    const onShowHistory = jest.fn()

    render(
      <ChatInterface 
        {...defaultProps} 
        onBackToSelection={onBackToSelection}
        onShowHistory={onShowHistory}
      />
    )

    await user.click(screen.getByRole('button', { name: /back to selection/i }))
    expect(onBackToSelection).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /history/i }))
    expect(onShowHistory).toHaveBeenCalled()
  })

  it('enables send button when input has text', async () => {
    const user = userEvent.setup()

    render(<ChatInterface {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    expect(sendButton).toBeDisabled()

    await user.type(textarea, 'Test message')
    expect(sendButton).not.toBeDisabled()
  })

  it('sends message when send button is clicked', async () => {
    const user = userEvent.setup()
    mockFetchSuccess({ response: 'Test response', sources: [] })

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
        documentIds: ['doc-1'],
      }),
    })
  })

  it('shows loading state during message sending', async () => {
    const user = userEvent.setup()
    
    // Mock delayed response
    global.fetch = jest.fn(() => new Promise(resolve => 
      setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ response: 'Test response', sources: [] })
      }), 100)
    )) as jest.Mock

    render(<ChatInterface {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
    await user.type(textarea, 'Test message')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(screen.getByText('Thinking…')).toBeInTheDocument()
    expect(textarea).toBeDisabled()
  })

  it('displays messages correctly', () => {
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
        content: 'Assistant response',
        timestamp: Date.now(),
      },
    ]

    mockUseQuery
      .mockReturnValueOnce(mockConversation)
      .mockReturnValueOnce(mockMessages)

    render(<ChatInterface {...defaultProps} />)

    expect(screen.getByText('User message')).toBeInTheDocument()
    expect(screen.getByText('Assistant response')).toBeInTheDocument()
  })

  it('shows model information in accordion', () => {
    render(<ChatInterface {...defaultProps} />)

    expect(screen.getByText('Powered by all-MiniLM-L6-v2 embeddings + Llama 3.2 1B LLM')).toBeInTheDocument()
  })

  it('sends message on Enter key press', async () => {
    const user = userEvent.setup()
    mockFetchSuccess({ response: 'Test response', sources: [] })

    render(<ChatInterface {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
    await user.type(textarea, 'Test message')
    await user.keyboard('{Enter}')

    expect(global.fetch).toHaveBeenCalled()
  })

  it('does not send on Shift+Enter', async () => {
    const user = userEvent.setup()

    render(<ChatInterface {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
    await user.type(textarea, 'Test message')
    await user.keyboard('{Shift>}{Enter}{/Shift}')

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('clears input after sending message', async () => {
    const user = userEvent.setup()
    mockFetchSuccess({ response: 'Test response', sources: [] })

    render(<ChatInterface {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Ask a question about your documents...')
    await user.type(textarea, 'Test message')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(textarea).toHaveValue('')
    })
  })
})