# Session Management System

This document describes the simple session management system implemented to prevent concurrent usage of Python services.

## Overview

The session management system ensures that only one user can use each Python service at a time:

- **Chat Service** (`lightweight-llm`): Used for LLM chat interactions
- **Document Conversion Service** (`vector-convert`): Used for converting documents to vector embeddings

## How It Works

### Session Manager (`apps/web/lib/session-manager.ts`)

- In-memory session tracking using a singleton pattern
- Automatic cleanup of expired sessions (5-minute timeout)
- Service acquisition and release with unique session IDs

### API Routes with Session Management

1. **`/api/lightweight-llm/chat`** - Direct LLM chat
2. **`/api/RAG/chat`** - RAG-enabled chat with documents
3. **`/api/vector-convert-llm/process-document`** - Document vector conversion

### User Experience

- When a service is busy, users see a friendly message: "Someone else is using the [service] right now. Please try again in a minute or two."
- Toast notifications inform users when services are unavailable
- Error messages are displayed in chat interfaces and document viewer

## Service Status

Check real-time service availability:

```
GET /api/services/status
```

Returns:

```json
{
  "services": {
    "chat": {
      "id": "lightweight-llm",
      "name": "Chat Service",
      "available": true,
      "message": null
    },
    "vectorConvert": {
      "id": "vector-convert",
      "name": "Document Conversion Service",
      "available": false,
      "message": "Someone else is using the document conversion service right now..."
    }
  },
  "activeSessions": [...],
  "timestamp": 1642123456789
}
```

## Implementation Details

### Session Lifecycle

1. **Acquire**: Service attempts to acquire a session before processing
2. **Process**: Service processes the request while holding the session
3. **Release**: Session is automatically released in `finally` block

### Error Handling

- HTTP 503 (Service Unavailable) returned when service is busy
- `serviceUnavailable: true` flag in response for client-side handling
- Automatic session cleanup prevents stuck sessions

### Timeout Management

- Sessions expire after 5 minutes of inactivity
- Automatic cleanup runs on each service acquisition attempt
- Prevents services from being permanently locked

## Files Modified

### Core Session Management

- `apps/web/lib/session-manager.ts` - Main session manager class

### API Routes

- `apps/web/app/api/lightweight-llm/chat/route.ts` - Direct LLM chat
- `apps/web/app/api/RAG/chat/route.ts` - RAG chat with session management
- `apps/web/app/api/vector-convert-llm/process-document/route.ts` - Document processing
- `apps/web/app/api/services/status/route.ts` - Service status endpoint

### UI Components

- `apps/web/app/RAG-chat/components/ChatInterface.tsx` - Chat error handling
- `apps/web/components/rag/DocumentViewer.tsx` - Document conversion error handling

## Usage Examples

### Checking Service Status

```typescript
const response = await fetch("/api/services/status");
const status = await response.json();
console.log("Chat available:", status.services.chat.available);
```

### Handling Service Unavailable

```typescript
const response = await fetch('/api/RAG/chat', { ... });
if (response.status === 503) {
  const result = await response.json();
  if (result.serviceUnavailable) {
    toast.error(result.error); // Show user-friendly message
  }
}
```

## Benefits

1. **Prevents Resource Conflicts**: Only one user per service at a time
2. **User-Friendly**: Clear messaging when services are busy
3. **Automatic Recovery**: Sessions expire automatically
4. **Simple Implementation**: In-memory solution, no external dependencies
5. **Real-time Status**: API endpoint for checking service availability

## Limitations

1. **In-Memory Only**: Sessions don't persist across server restarts
2. **Single Server**: Won't work across multiple server instances
3. **No Queuing**: Users must retry manually when services are busy

For production use with multiple servers, consider implementing with Redis or a database-backed solution.
