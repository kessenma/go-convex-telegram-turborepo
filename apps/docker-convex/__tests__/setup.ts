// Test setup for Convex backend tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock fetch for HTTP tests
global.fetch = jest.fn()

// Mock environment variables
process.env.CONVEX_URL = 'http://localhost:3210'
process.env.NODE_ENV = 'test'

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})