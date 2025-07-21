// Debug script for DocumentViewer API calls
// Run this in the browser console before opening the DocumentViewer

let documentCalls = 0;
let embeddingCalls = 0;
let lastLogTime = Date.now();

// Override fetch to monitor DocumentViewer API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string') {
    if (url.includes('/api/documents/') && url.includes('/embeddings')) {
      embeddingCalls++;
      console.log(`🔍 Embedding API call #${embeddingCalls}: ${url}`);
    } else if (url.includes('/api/documents/') && !url.includes('/embeddings')) {
      documentCalls++;
      console.log(`📄 Document API call #${documentCalls}: ${url}`);
    }
    
    const now = Date.now();
    const timeSinceLastLog = now - lastLogTime;
    
    if (timeSinceLastLog >= 5000) { // Log every 5 seconds
      console.log(`📊 Last ${timeSinceLastLog/1000}s: ${documentCalls} document calls, ${embeddingCalls} embedding calls`);
      documentCalls = 0;
      embeddingCalls = 0;
      lastLogTime = now;
    }
  }
  
  return originalFetch.apply(this, args);
};

console.log('🚀 DocumentViewer API monitor started. Open a document to see call patterns.');