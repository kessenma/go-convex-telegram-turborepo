# Testing Guide

This document explains how to run and understand the test suite for the document upload and embedding workflow.

## Overview

The test suite covers the complete document upload and embedding workflow:

1. **User uploads document** - File or text upload via UploadForm
2. **Document gets uploaded** - API saves document to database
3. **Document converts to vector format** - Embedding generation starts automatically
4. **Upload notification appears** - Toast and notification system alerts user
5. **Embedding completion notification** - User notified when document is ready for chat
6. **DocumentViewer shows embedded documents** - Only embedded documents appear in viewer
7. **Document viewer functionality** - View document details and embeddings

## Test Structure

### Frontend Tests (`apps/web/__tests__/`)

- **Component Tests**: Individual component functionality
  - `UploadForm.test.tsx` - File upload, text upload, validation, notifications
  - `DocumentViewer.test.tsx` - Document display, embedding viewer, actions
  - `DocumentSelector.test.tsx` - Document selection, filtering embedded docs

- **Integration Tests**: Complete workflow testing
  - `document-upload-workflow.test.tsx` - End-to-end upload and embedding flow

- **Test Utilities**: 
  - `utils/test-utils.tsx` - Custom render functions, mock data creators
  - `mocks/handlers.js` - MSW API mocks for realistic API responses
  - `mocks/server.js` - Mock server setup

### Backend Tests (`apps/docker-convex/__tests__/`)

- **API Tests**: HTTP endpoint contract testing
  - `api/documents.test.ts` - Document CRUD operations
  - `api/embeddings.test.ts` - Embedding generation and search

## Running Tests

### Install Dependencies

```bash
# Install test dependencies for web app
cd apps/web
pnpm install

# Install test dependencies for convex backend
cd apps/docker-convex
pnpm install
```

### Run All Tests

```bash
# From project root
pnpm test
```

### Run Specific Test Suites

```bash
# Web app tests only
pnpm test:web

# Convex backend tests only
pnpm test:convex

# Watch mode for development
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Run Individual Test Files

```bash
# Web app - specific component
cd apps/web
pnpm test UploadForm.test.tsx

# Web app - integration tests
cd apps/web
pnpm test document-upload-workflow.test.tsx

# Backend - API tests
cd apps/docker-convex
pnpm test documents.test.ts
```

## Test Scenarios Covered

### 1. Document Upload Flow

**File Upload:**
- ✅ Single file upload with automatic title extraction
- ✅ Multiple file batch upload
- ✅ File validation (size, type)
- ✅ Upload progress and loading states
- ✅ Success/error notifications

**Text Upload:**
- ✅ Text content validation
- ✅ Required field validation (title, content)
- ✅ Upload button state management

### 2. Embedding Generation

**Automatic Embedding:**
- ✅ Embedding starts automatically after upload
- ✅ Loading states during embedding generation
- ✅ Success notification when embedding completes
- ✅ Error handling for embedding failures
- ✅ Retry functionality for failed embeddings

### 3. Document Viewer Behavior

**Conditional Display:**
- ✅ Only shows documents with embeddings
- ✅ Filters out non-embedded documents
- ✅ Shows embedding status indicators

**Document Details:**
- ✅ Document metadata display
- ✅ Embedding information viewer
- ✅ Vector data preview
- ✅ Document actions (delete, retry embedding)

### 4. Notification System

**Toast Notifications:**
- ✅ Upload success/failure messages
- ✅ Embedding completion notifications
- ✅ Error handling notifications

**System Notifications:**
- ✅ Document upload events
- ✅ Embedding completion events
- ✅ Notification creation and management

### 5. API Contract Testing

**Document Endpoints:**
- ✅ POST /api/documents - Single document upload
- ✅ POST /api/documents/batch - Batch document upload
- ✅ GET /api/documents/:id - Document retrieval
- ✅ DELETE /api/documents/:id - Document deletion
- ✅ GET /api/documents/stats - Document statistics

**Embedding Endpoints:**
- ✅ POST /api/RAG/embeddings - Start embedding generation
- ✅ GET /api/embeddings/document - Get document embeddings
- ✅ POST /api/embeddings/search - Vector search
- ✅ GET /api/embeddings/llm-status - LLM service status

## Mock Data and API Responses

The test suite uses MSW (Mock Service Worker) to provide realistic API responses:

- **Successful upload responses** with document IDs
- **Embedding generation simulation** with processing delays
- **Error scenarios** for testing error handling
- **Notification creation** for testing notification flow

## Key Testing Libraries

- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **MSW** - API mocking for realistic HTTP responses
- **User Event** - Realistic user interaction simulation

## Test Configuration

### Web App (`apps/web/jest.config.js`)
- Next.js integration with `next/jest`
- JSDOM environment for browser simulation
- Custom module mapping for imports
- Coverage thresholds set to 70%

### Backend (`apps/docker-convex/jest.config.js`)
- Node.js environment for server-side testing
- TypeScript support with ts-jest
- API endpoint testing focus

## Debugging Tests

### Common Issues

1. **Async Operations**: Use `waitFor` for async state changes
2. **Mock Timing**: Ensure mocks are set up before components render
3. **API Responses**: Check MSW handlers match expected request format

### Debug Commands

```bash
# Run tests with verbose output
pnpm test --verbose

# Run specific test with debug info
pnpm test UploadForm.test.tsx --verbose

# Run tests without coverage (faster)
pnpm test --no-coverage
```

## Continuous Integration

Tests are designed to run in CI environments:
- No external dependencies required
- All APIs mocked with MSW
- Deterministic test results
- Fast execution (< 30 seconds total)

## Future Test Enhancements

1. **E2E Tests**: Add Playwright tests for full browser testing
2. **Performance Tests**: Add tests for large file uploads
3. **Accessibility Tests**: Ensure components meet a11y standards
4. **Visual Regression**: Add screenshot testing for UI components

## Contributing

When adding new features:

1. **Add component tests** for new UI components
2. **Update integration tests** if workflow changes
3. **Add API tests** for new endpoints
4. **Update mocks** to match new API contracts
5. **Maintain test coverage** above 70%

Run tests before submitting PRs:
```bash
pnpm test
```