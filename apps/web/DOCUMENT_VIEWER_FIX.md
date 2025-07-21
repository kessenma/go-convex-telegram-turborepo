# DocumentViewer API Spam Fix

## Problem
The `DocumentViewer` component was making continuous API calls to:
- `/api/documents/{id}` 
- `/api/documents/{id}/embeddings`

This caused the UI to glitch and prevented proper viewing of document embeddings.

## Root Cause
The `fetchEmbeddings` function was being recreated on every render and included in the `useEffect` dependency array, causing an infinite loop:

```typescript
// BEFORE (problematic)
const fetchEmbeddings = async (docId: string) => { ... }; // Recreated every render

useEffect(() => {
  // ... fetch document logic
  if (data.hasEmbedding) {
    await fetchEmbeddings(documentId); // Triggers re-render
  }
}, [documentId, isOpen, fetchEmbeddings]); // fetchEmbeddings changes every render
```

## Solution
1. **Memoized `fetchEmbeddings`** with `useCallback` to prevent recreation
2. **Memoized `generateEmbedding`** to prevent unnecessary re-renders
3. **Memoized `deleteDocument`** for consistency

```typescript
// AFTER (fixed)
const fetchEmbeddings = useCallback(async (docId: string) => {
  // ... implementation
}, []); // Empty dependency array - function is stable

const generateEmbedding = useCallback(async () => {
  // ... implementation  
}, [documentData, documentId, fetchEmbeddings]); // Proper dependencies

const deleteDocument = useCallback(async () => {
  // ... implementation
}, [documentId]); // Only depends on documentId
```

## Files Changed
- `apps/web/components/rag/DocumentViewer.tsx`

## Testing
Use the debug script `debug-document-viewer.js` in browser console to monitor API call patterns:

```javascript
// Should see only 1-2 calls when opening a document, not continuous spam
```

## Expected Behavior After Fix
- Opening a document: 1 call to `/api/documents/{id}`
- If document has embeddings: 1 additional call to `/api/documents/{id}/embeddings`
- No continuous polling or repeated calls
- Smooth UI interaction without glitching