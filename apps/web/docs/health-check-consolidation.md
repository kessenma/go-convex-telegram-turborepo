# Health Check Consolidation

This document explains the consolidated health check system implemented to reduce API call spam and improve performance.

## Problem

Previously, multiple components were making individual health check calls to various status endpoints:

- `/api/llm/status`
- `/api/lightweight-llm/status`
- `/api/convex/status`
- `/api/docker/status`
- `/api/users/active-count`

This resulted in:

- Excessive console logging
- Multiple concurrent API calls
- Inefficient resource usage
- Difficult to manage polling intervals

## Solution

### 1. Centralized Health Check Provider

**File**: `components/providers/health-check-provider.tsx`

A React context provider that manages all health checking from a single location. This provider:

- Runs at the application root level
- Coordinates all status polling
- Prevents duplicate API calls
- Uses optimized polling intervals

### 2. Consolidated Health Check Hook

**File**: `hooks/use-consolidated-health-check.ts`

A custom hook that:

- Calculates optimal polling intervals using GCD (Greatest Common Divisor)
- Tracks last check times for each service
- Only polls services when they're due for a check
- Executes all due checks in parallel
- Handles errors gracefully

### 3. Read-Only Status Data Hook

**File**: `hooks/use-consolidated-health-check.ts` (useStatusData)

A hook for components that need status data but don't want to trigger polling:

- Provides read-only access to centralized status
- No side effects or polling
- Optimized for performance

### 4. Updated Individual Status Hooks

**File**: `hooks/use-status-operations.ts`

Existing hooks (`useLLMStatus`, `useConvexStatus`, etc.) have been updated to:

- Use centralized data instead of individual polling
- Maintain the same API for backward compatibility
- Marked as deprecated where appropriate

## Polling Intervals

New conservative polling intervals to reduce console spam:

- **LLM Status**: 2 minutes (5 minutes when stable)
- **Lightweight LLM**: 2 minutes (5 minutes when stable)
- **Convex Status**: 3 minutes
- **Docker Status**: 2.5 minutes
- **User Count**: 1.5 minutes

## Integration

The `HealthCheckProvider` is integrated at the root level in `app/layout.tsx`:

```tsx
<HealthCheckProvider>
  <Navigation />
  <main>{children}</main>
</HealthCheckProvider>
```

## Benefits

1. **Reduced Console Spam**: Fewer API calls mean fewer log entries
2. **Better Performance**: Coordinated polling reduces server load
3. **Easier Maintenance**: Centralized configuration and management
4. **Backward Compatibility**: Existing components continue to work
5. **Flexible Polling**: Adaptive intervals based on service health

## Migration Guide

### For New Components

Use `useStatusData()` for read-only access to status information.

### For Existing Components

No changes required - existing hooks continue to work but now use centralized data.

### For High-Frequency Updates

Components like `LLMUsageBarChart` can still make direct API calls for real-time data (≤5 seconds intervals) while benefiting from centralized status for general health information.

## Files Modified

- `app/layout.tsx` - Added HealthCheckProvider
- `hooks/use-status-operations.ts` - Updated to use centralized data
- `components/rag/llm-usage-bar-chart.tsx` - Updated to use centralized status
- `stores/status-store.ts` - Increased default polling intervals

## Files Added

- `hooks/use-consolidated-health-check.ts` - Centralized health checking logic
- `components/providers/health-check-provider.tsx` - React context provider
- `docs/health-check-consolidation.md` - This documentation
