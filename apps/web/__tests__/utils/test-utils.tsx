import React from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock the NotificationsContext hook
jest.mock('../../contexts/NotificationsContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    openNotifications: jest.fn(),
    closeNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    addNotification: jest.fn(),
    refreshNotifications: jest.fn(),
  }),
  NotificationsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-notifications-provider">{children}</div>
  ),
}))

const MockNotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="mock-notifications-provider">
      {children}
    </div>
  )
}

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockNotificationsProvider>
      {children}
    </MockNotificationsProvider>
  )
}

const customRender: (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => ReturnType<typeof render> = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test utilities
export const createMockFile = (
  name: string = 'test.txt',
  content: string = 'test content',
  type: string = 'text/plain'
): File => {
  const file = new File([content], name, { type })
  return file
}

export const createMockDocument = (overrides = {}) => ({
  _id: 'test-doc-123',
  _creationTime: Date.now(),
  title: 'Test Document',
  content: 'This is test content',
  contentType: 'text',
  fileSize: 1024,
  wordCount: 10,
  uploadedAt: Date.now(),
  lastModified: Date.now(),
  isActive: true,
  hasEmbedding: true,
  summary: 'Test summary',
  ...overrides,
})

export const createMockEmbedding = (overrides = {}) => ({
  _id: 'test-embedding-123',
  documentId: 'test-doc-123',
  embedding: Array(384).fill(0).map(() => Math.random()),
  embeddingModel: 'sentence-transformers/all-distilroberta-v1',
  embeddingDimensions: 384,
  chunkIndex: 0,
  chunkText: 'Test chunk text',
  createdAt: Date.now(),
  processingTimeMs: 1500,
  isActive: true,
  ...overrides,
})

export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Mock fetch responses
export const mockFetchSuccess = (data: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  ) as jest.Mock
}

export const mockFetchError = (error: string, status: number = 500) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ error }),
    })
  ) as jest.Mock
}