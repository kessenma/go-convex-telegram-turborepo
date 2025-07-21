// Simple script to monitor API calls
// Run this in the browser console to see the frequency of status calls

let statusCallCount = 0;
let lastLogTime = Date.now();

// Override fetch to monitor API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('/api/convex/status')) {
    statusCallCount++;
    const now = Date.now();
    const timeSinceLastLog = now - lastLogTime;
    
    if (timeSinceLastLog >= 10000) { // Log every 10 seconds
      console.log(`🔍 Convex status calls in last ${timeSinceLastLog/1000}s: ${statusCallCount}`);
      console.log(`📊 Average calls per second: ${(statusCallCount / (timeSinceLastLog/1000)).toFixed(2)}`);
      statusCallCount = 0;
      lastLogTime = now;
    }
  }
  
  return originalFetch.apply(this, args);
};

console.log('🚀 Polling monitor started. Check console for status call frequency.');