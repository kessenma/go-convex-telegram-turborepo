"use client";

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// LLM Status Types
interface LLMStatus {
  status: 'healthy' | 'error' | 'loading' | 'starting' | 'connecting';
  ready: boolean;
  message: string;
  model?: string;
  details?: {
    service_status?: string;
    model_loaded?: boolean;
    model_loading?: boolean;
    uptime?: string;
    timestamp?: string;
    error?: string;
  };
}

// Convex Status Types
interface ConvexStatus {
  status: 'connected' | 'disconnected' | 'connecting';
  ready: boolean;
  message: string;
  uptime?: number;
  statistics?: {
    requestsPerHour?: number;
    requestsPerDay?: number;
    successRate?: number;
    avgResponseTime?: number;
    totalRequests?: number;
  };
  performance?: {
    processingTimeMs?: number;
    memoryUsage?: string;
    activeConnections?: string;
  };
  details?: {
    service_status?: string;
    database_status?: string;
    uptime?: string;
    timestamp?: string;
    error?: string;
    service?: string;
    version?: string;
    last_check?: string;
  };
}

// Combined Status Interface
interface SystemStatus {
  llm: LLMStatus;
  convex: ConvexStatus;
  lastUpdated: number;
  consecutiveErrors: {
    llm: number;
    convex: number;
  };
  pollingIntervals: {
    llm: number;
    convex: number;
  };
}

interface StatusStore {
  // State
  llmStatus: LLMStatus;
  convexStatus: ConvexStatus;
  loading: {
    llm: boolean;
    convex: boolean;
  };
  lastUpdated: {
    llm: number;
    convex: number;
  };
  consecutiveErrors: {
    llm: number;
    convex: number;
  };
  pollingIntervals: {
    llm: number;
    convex: number;
  };
  
  // Basic setters
  setLLMStatus: (status: LLMStatus) => void;
  setConvexStatus: (status: ConvexStatus) => void;
  setLLMLoading: (loading: boolean) => void;
  setConvexLoading: (loading: boolean) => void;
  
  // Error tracking
  incrementLLMErrors: () => void;
  incrementConvexErrors: () => void;
  resetLLMErrors: () => void;
  resetConvexErrors: () => void;
  
  // Polling interval management
  updateLLMPollingInterval: () => void;
  updateConvexPollingInterval: () => void;
  
  // Optimistic updates
  optimisticLLMUpdate: (partialStatus: Partial<LLMStatus>) => void;
  optimisticConvexUpdate: (partialStatus: Partial<ConvexStatus>) => void;
  
  // API actions
  checkLLMStatus: () => Promise<boolean>;
  checkConvexStatus: () => Promise<boolean>;
  checkAllStatus: () => Promise<{ llm: boolean; convex: boolean }>;
  
  // Utility getters
  getSystemHealth: () => 'healthy' | 'degraded' | 'critical';
  isSystemReady: () => boolean;
}

const initialLLMStatus: LLMStatus = {
  status: 'connecting',
  ready: false,
  message: 'Checking LLM service...'
};

const initialConvexStatus: ConvexStatus = {
  status: 'connecting',
  ready: false,
  message: 'Checking Convex connection...'
};

export const useStatusStore = create<StatusStore>()(devtools(
  (set, get) => ({
    // Initial state
    llmStatus: initialLLMStatus,
    convexStatus: initialConvexStatus,
    loading: {
      llm: false,
      convex: false
    },
    lastUpdated: {
      llm: 0,
      convex: 0
    },
    consecutiveErrors: {
      llm: 0,
      convex: 0
    },
    pollingIntervals: {
      llm: 15000, // 15 seconds default
      convex: 15000 // 15 seconds default
    },
    
    // Basic setters
    setLLMStatus: (status) => set(
      (state) => ({
        llmStatus: status,
        lastUpdated: { ...state.lastUpdated, llm: Date.now() }
      }),
      false,
      'setLLMStatus'
    ),
    
    setConvexStatus: (status) => set(
      (state) => ({
        convexStatus: status,
        lastUpdated: { ...state.lastUpdated, convex: Date.now() }
      }),
      false,
      'setConvexStatus'
    ),
    
    setLLMLoading: (loading) => set(
      (state) => ({ loading: { ...state.loading, llm: loading } }),
      false,
      'setLLMLoading'
    ),
    
    setConvexLoading: (loading) => set(
      (state) => ({ loading: { ...state.loading, convex: loading } }),
      false,
      'setConvexLoading'
    ),
    
    // Error tracking
    incrementLLMErrors: () => set(
      (state) => ({
        consecutiveErrors: { ...state.consecutiveErrors, llm: state.consecutiveErrors.llm + 1 }
      }),
      false,
      'incrementLLMErrors'
    ),
    
    incrementConvexErrors: () => set(
      (state) => ({
        consecutiveErrors: { ...state.consecutiveErrors, convex: state.consecutiveErrors.convex + 1 }
      }),
      false,
      'incrementConvexErrors'
    ),
    
    resetLLMErrors: () => set(
      (state) => ({
        consecutiveErrors: { ...state.consecutiveErrors, llm: 0 }
      }),
      false,
      'resetLLMErrors'
    ),
    
    resetConvexErrors: () => set(
      (state) => ({
        consecutiveErrors: { ...state.consecutiveErrors, convex: 0 }
      }),
      false,
      'resetConvexErrors'
    ),
    
    // Polling interval management
    updateLLMPollingInterval: () => {
      const { llmStatus, consecutiveErrors } = get();
      let interval = 15000; // Default 15 seconds
      
      if (llmStatus.status === 'healthy' && llmStatus.ready && consecutiveErrors.llm === 0) {
        interval = 30000; // 30 seconds for stable connections
      } else if (consecutiveErrors.llm > 0) {
        interval = 5000; // 5 seconds when there are issues
      }
      
      set(
        (state) => ({ pollingIntervals: { ...state.pollingIntervals, llm: interval } }),
        false,
        'updateLLMPollingInterval'
      );
    },
    
    updateConvexPollingInterval: () => {
      const { convexStatus, consecutiveErrors } = get();
      let interval = 15000; // Default 15 seconds
      
      if (convexStatus.status === 'connected' && convexStatus.ready && consecutiveErrors.convex === 0) {
        interval = 30000; // 30 seconds for stable connections
      } else if (consecutiveErrors.convex > 0) {
        interval = 5000; // 5 seconds when there are issues
      }
      
      set(
        (state) => ({ pollingIntervals: { ...state.pollingIntervals, convex: interval } }),
        false,
        'updateConvexPollingInterval'
      );
    },
    
    // Optimistic updates
    optimisticLLMUpdate: (partialStatus) => {
      const { llmStatus } = get();
      const updatedStatus = { ...llmStatus, ...partialStatus };
      
      set(
        (state) => ({
          llmStatus: updatedStatus,
          lastUpdated: { ...state.lastUpdated, llm: Date.now() }
        }),
        false,
        'optimisticLLMUpdate'
      );
    },
    
    optimisticConvexUpdate: (partialStatus) => {
      const { convexStatus } = get();
      const updatedStatus = { ...convexStatus, ...partialStatus };
      
      set(
        (state) => ({
          convexStatus: updatedStatus,
          lastUpdated: { ...state.lastUpdated, convex: Date.now() }
        }),
        false,
        'optimisticConvexUpdate'
      );
    },
    
    // API actions
    checkLLMStatus: async () => {
      const { setLLMLoading, setLLMStatus, incrementLLMErrors, resetLLMErrors, updateLLMPollingInterval } = get();
      
      setLLMLoading(true);
      
      try {
        const response = await fetch('/api/llm/status', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
          incrementLLMErrors();
          setLLMStatus({
            status: 'error',
            ready: false,
            message: `LLM service unavailable (${response.status})`,
            details: {
              error: `HTTP ${response.status}: ${response.statusText}`,
              timestamp: new Date().toISOString()
            }
          });
          updateLLMPollingInterval();
          return false;
        }
        
        const data = await response.json();
        resetLLMErrors();
        setLLMStatus({
          status: data.status || 'error',
          ready: data.ready || false,
          message: data.message || 'LLM status unknown',
          model: data.model,
          details: data.details || { timestamp: new Date().toISOString() }
        });
        updateLLMPollingInterval();
        return true;
      } catch (error) {
        incrementLLMErrors();
        const errorMessage = error instanceof Error ? error.message : 'Cannot connect to LLM service';
        setLLMStatus({
          status: 'error',
          ready: false,
          message: 'Cannot connect to LLM service',
          details: {
            error: errorMessage,
            timestamp: new Date().toISOString()
          }
        });
        updateLLMPollingInterval();
        return false;
      } finally {
        setLLMLoading(false);
      }
    },
    
    checkConvexStatus: async () => {
      const { setConvexLoading, setConvexStatus, incrementConvexErrors, resetConvexErrors, updateConvexPollingInterval } = get();
      
      setConvexLoading(true);
      
      try {
        const response = await fetch('/api/convex/status', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
          incrementConvexErrors();
          setConvexStatus({
            status: 'disconnected',
            ready: false,
            message: `Convex service unavailable (${response.status})`,
            details: {
              error: `HTTP ${response.status}: ${response.statusText}`,
              timestamp: new Date().toISOString()
            }
          });
          updateConvexPollingInterval();
          return false;
        }
        
        const data = await response.json();
        resetConvexErrors();
        setConvexStatus({
          status: data.status || 'disconnected',
          ready: data.ready || false,
          message: data.message || 'Convex status unknown',
          uptime: data.uptime,
          statistics: data.statistics,
          performance: data.performance,
          details: data.details || { timestamp: new Date().toISOString() }
        });
        updateConvexPollingInterval();
        return true;
      } catch (error) {
        incrementConvexErrors();
        const errorMessage = error instanceof Error ? error.message : 'Cannot connect to Convex';
        setConvexStatus({
          status: 'disconnected',
          ready: false,
          message: 'Cannot connect to Convex database',
          details: {
            error: errorMessage,
            timestamp: new Date().toISOString()
          }
        });
        updateConvexPollingInterval();
        return false;
      } finally {
        setConvexLoading(false);
      }
    },
    
    checkAllStatus: async () => {
      const { checkLLMStatus, checkConvexStatus } = get();
      
      const [llmResult, convexResult] = await Promise.allSettled([
        checkLLMStatus(),
        checkConvexStatus()
      ]);
      
      return {
        llm: llmResult.status === 'fulfilled' ? llmResult.value : false,
        convex: convexResult.status === 'fulfilled' ? convexResult.value : false
      };
    },
    
    // Utility getters
    getSystemHealth: () => {
      const { llmStatus, convexStatus } = get();
      
      const llmHealthy = llmStatus.status === 'healthy' && llmStatus.ready;
      const convexHealthy = convexStatus.status === 'connected' && convexStatus.ready;
      
      if (llmHealthy && convexHealthy) return 'healthy';
      if (llmHealthy || convexHealthy) return 'degraded';
      return 'critical';
    },
    
    isSystemReady: () => {
      const { llmStatus, convexStatus } = get();
      return llmStatus.ready && convexStatus.ready;
    }
  }),
  {
    name: 'status-store',
  }
));

export type { LLMStatus, ConvexStatus, SystemStatus };