# Convex Backend for Telegram Bot

This directory contains the Convex backend functions and schema for a Telegram bot application. The backend provides real-time data synchronization, message storage, and API endpoints for both the Telegram bot and web dashboard.

## Architecture Overview

The system is built around three main data entities:
- **Messages**: Individual Telegram messages with metadata
- **Threads**: Conversation threads that group related messages
- **Documents**: RAG system documents with vector embeddings

## File Structure

### Core Schema and Configuration
- **`schema.ts`** - Defines the database schema with tables for messages, threads, documents, and logs
- **`tsconfig.json`** - TypeScript configuration for Convex functions

### Data Access Layer
- **`messages.ts`** - Mutations and queries for message operations
- **`threads.ts`** - Mutations and queries for thread management
- **`documents.ts`** - Document management and RAG system operations
- **`embeddings.ts`** - Vector embedding generation and similarity search
- **`requestLogs.ts`** - Request logging and statistics

### API Layer
- **`http.ts`** - Centralized HTTP router and API endpoint implementations
- **`messagesThread.ts`** - Thread-aware message handling logic

## Detailed File Descriptions

### `schema.ts`
Defines four main tables:
- `telegram_messages`: Stores individual messages with user info, content, and thread references
- `telegram_threads`: Manages conversation threads with metadata and message counts
- `rag_documents`: Stores documents with vector embeddings for semantic search


Key indexes support efficient queries by chat, user, thread, timestamp, and vector similarity.

### `http.ts`
Centralized HTTP router that exposes all API endpoints:

#### Health & Monitoring
- `GET /api/health`: Health check endpoint

#### Telegram Bot API
- `POST /api/telegram/messages`: Save incoming messages
- `POST /api/telegram/messages/thread`: Save messages to threads
- `GET /api/messages`: Retrieve messages with filtering

#### Thread Management
- `GET /api/threads`: Get active threads
- `GET /api/threads/stats`: Get thread statistics
- `GET /api/threads/by-id`: Get specific thread

#### Document Management (RAG System)
- `POST /api/documents`: Save new document
- `GET /api/documents`: List documents
- `GET /api/documents/stats`: Get document statistics

#### Embedding Operations
- `POST /api/embeddings`: Save document embeddings
- `POST /api/embeddings/generate`: Generate embeddings
- `POST /api/embeddings/search`: Vector similarity search
- `GET /api/embeddings/llm-status`: Check LLM service status

## Data Flow

### Incoming Messages (Telegram → Database)
1. Telegram bot receives message
2. Bot calls `POST /api/telegram/messages`
3. Message is validated and processed
4. Thread is auto-created or updated based on context

### Document Processing (RAG System)
1. Document is uploaded via `POST /api/documents`
2. Background job created for embedding generation
3. Vector embeddings are generated and stored
4. Document becomes available for semantic search

### Message Retrieval
1. Web dashboard queries messages via Convex queries
2. Real-time updates are pushed to connected clients
3. Messages can be filtered by chat, thread, or user

## Environment Variables

- `CONVEX_URL`: Convex deployment URL (configured in deployment)
- `TELEGRAM_BOT_TOKEN`: Required in Next.js app for sending messages

## Thread Management

The system automatically creates conversation threads based on:
- **User-based threads**: One thread per user per chat
- **Message thread ID**: Telegram's native thread support
- **Thread metadata**: Includes creator info, message counts, and timestamps

## Real-time Features

Convex provides real-time synchronization:
- Live message updates across all connected clients
- Automatic thread state updates
- Real-time message counts and timestamps
- Vector search results for document similarity

## Development Notes

### Performance Considerations
1. **Pagination**: All queries include limit parameters
2. **Indexing**: Database indexes optimize common query patterns
3. **Vector Search**: Optimized for semantic similarity queries
4. **Background Jobs**: Long-running tasks handled asynchronously

### Security
1. **Environment variables**: Sensitive tokens are stored securely
2. **Input validation**: All API endpoints validate required fields
3. **Error handling**: Structured error responses without internal details

## Usage Examples

### Querying Messages
```typescript
// Get recent messages in a chat
const messages = await ctx.runQuery(api.messages.getMessagesByChatId, {
  chatId: 12345,
  limit: 50
});

// Get messages in a specific thread
const threadMessages = await ctx.runQuery(api.messages.getMessagesByThread, {
  chatId: 12345,
  messageThreadId: 67890,
  limit: 20
});
```

### Managing Documents
```typescript
// Save a new document
const documentId = await ctx.runMutation(api.documents.saveDocument, {
  title: "Example Document",
  content: documentText,
  contentType: "markdown"
});

// Search documents by similarity
const results = await ctx.runAction(api.embeddings.searchDocumentsByVector, {
  queryText: "search query",
  limit: 5
});
```

This backend provides a robust foundation for a Telegram bot with real-time web dashboard capabilities and integrated RAG system for semantic document search.

## Core Schema Tables
- `rag_documents`: Stores documents with metadata for RAG system
- `document_embeddings`: Manages vector embeddings with chunking support
- `telegram_threads`: Conversation threads with message tracking
- `telegram_messages`: Individual message storage with thread relations
- `rag_conversations`: Chat sessions with document context
- `rag_chat_messages`: LLM-generated responses with sources

## Active API Endpoints
- `POST /api/documents` - Manage RAG documents
- `POST /api/embeddings` - Handle vector operations
- `GET /api/threads` - Conversation thread management
- `GET /api/health` - System status monitoring