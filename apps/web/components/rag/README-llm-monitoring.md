# LLM Monitoring System

## Overview

This system provides consolidated monitoring for both LLM services (Vector Convert and Chat) with proper failsafes and reduced API calls.

## Components

### 1. Consolidated Metrics Endpoint
- **Path**: `/api/llm/metrics`
- **Purpose**: Single endpoint that fetches health and metrics from both services
- **Features**:
  - 30-second caching to prevent API spam
  - Concurrent health checks for both services
  - Failsafe handling when services are down
  - Normalized response format

### 2. LLM Usage Bar Chart
- **Component**: `LLMUsageBarChart`
- **Features**:
  - Displays memory and CPU usage for both services
  - Color-coded lines for each service
  - Status indicators
  - Reduced polling frequency (45 seconds)
  - Graceful handling of missing services

### 3. Status Summary
- **Component**: `LLMStatusSummary`
- **Features**:
  - Quick overview of service health
  - Memory usage display
  - Status badges
  - Aggregate metrics

## API Endpoints

### Primary Endpoints
- `/api/llm/metrics` - Consolidated metrics for both services
- `/api/services/status` - Enhanced service status with metrics

### Legacy Endpoints (now redirect to consolidated)
- `/api/llm/status` - Vector service status (redirects to metrics)
- `/api/lightweight-llm/status` - Chat service status (redirects to metrics)

## Service Health Format

```typescript
interface ServiceHealth {
  status: string;           // 'healthy', 'loading', 'error', 'disconnected'
  ready: boolean;          // true if service is ready to handle requests
  message: string;         // Human-readable status message
  memory_usage?: {
    process_memory_mb?: number;
    process_cpu_percent?: number;
    system_memory_used_percent?: number;
    system_memory_available_gb?: number;
  };
  model?: string;          // Model name if available
  uptime?: number;         // Service uptime in seconds
  error?: string;          // Error message if status is error
}
```

## Failsafe Features

1. **Service Unavailable**: Shows "disconnected" status with appropriate messaging
2. **Timeout Handling**: 8-second timeout for health checks
3. **Caching**: Prevents excessive API calls with 30-second cache
4. **Fallback**: Direct service health check if consolidated endpoint fails
5. **Graceful Degradation**: UI shows appropriate states for missing data

## Usage

```tsx
import { LLMUsageBarChart } from './llm-usage-bar-chart';
import { LLMStatusSummary } from './llm-status-summary';

// In your component
<LLMStatusSummary />
<LLMUsageBarChart pollIntervalMs={45000} maxSamples={30} />
```

## Configuration

Environment variables:
- `VECTOR_CONVERT_LLM_URL` - Vector service URL
- `LIGHTWEIGHT_LLM_URL` - Chat service URL
- `NEXT_PUBLIC_APP_URL` - App URL for internal API calls

## Monitoring Frequency

- **Chart Updates**: Every 45 seconds
- **Status Updates**: Every 30 seconds
- **Cache Duration**: 30 seconds
- **Health Check Timeout**: 8 seconds

This system significantly reduces the API call frequency while providing comprehensive monitoring of both LLM services with proper error handling.