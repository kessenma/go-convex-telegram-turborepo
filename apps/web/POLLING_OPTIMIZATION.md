# Polling Optimization - API Spam Fix

## Problem
The `/api/convex/status` endpoint was being called excessively (multiple times per second), causing server overload.

## Root Causes Identified

### 1. useConvexConnection Hook (Primary Issue)
- **File**: `hooks/use-safe-convex.ts`
- **Issue**: `useEffect` dependency array included `checkConnection` function, causing infinite re-renders
- **Fix**: Used `useCallback` to memoize the function and removed the polling interval (relies on centralized health check)

### 2. Aggressive Polling Intervals
- **File**: `stores/status-store.ts`
- **Issue**: Default polling intervals were too aggressive
- **Changes**:
  - LLM: 120s → 300s (5 minutes)
  - Lightweight LLM: 120s → 300s (5 minutes)  
  - Convex: 180s → 600s (10 minutes)
  - Docker: 150s → 180s (3 minutes)
  - User Count: 90s → 120s (2 minutes)

### 3. LLM Usage Bar Chart Component
- **File**: `components/rag/llm-usage-bar-chart.tsx`
- **Issue**: Separate polling mechanism calling `/api/llm/status` every 2 seconds
- **Fix**: Removed additional polling, now relies entirely on centralized health check

### 4. LLM Logs Component
- **File**: `components/rag/LLMLogs.tsx`
- **Issue**: Polling `/api/llm/logs` every 5 seconds
- **Fix**: Increased interval to 30 seconds

### 5. Consolidated Health Check Base Interval
- **File**: `hooks/use-consolidated-health-check.ts`
- **Issue**: Base interval was too aggressive (5 seconds minimum)
- **Fix**: Increased minimum base interval to 30 seconds

## Results
- Reduced API calls from multiple per second to once every few minutes
- Maintained system monitoring functionality
- Improved server performance and reduced console spam

## Monitoring
Use the debug script `debug-polling.js` in browser console to monitor API call frequency:
```javascript
// Run in browser console
// Shows Convex status call frequency every 10 seconds
```

## Best Practices Going Forward
1. Always use the centralized `HealthCheckProvider` for status monitoring
2. Avoid creating separate polling mechanisms in individual components
3. Use conservative polling intervals (minutes, not seconds)
4. Consider using WebSockets or Server-Sent Events for real-time updates instead of polling
5. Test polling behavior in development to catch excessive API calls early