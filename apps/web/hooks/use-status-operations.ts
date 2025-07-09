"use client";

import { useCallback, useEffect } from 'react';
import { useStatusStore } from '../stores/status-store';

/**
 * Custom hook for status operations with optimized data fetching and state management
 * Centralizes LLM and Convex status monitoring with automatic polling
 */
export function useStatusOperations() {
  // Zustand store
  const {
    llmStatus,
    convexStatus,
    loading,
    lastUpdated,
    consecutiveErrors,
    pollingIntervals,
    setLLMStatus,
    setConvexStatus,
    checkLLMStatus,
    checkConvexStatus,
    checkAllStatus,
    getSystemHealth,
    isSystemReady,
    optimisticLLMUpdate,
    optimisticConvexUpdate
  } = useStatusStore();
  
  // Memoized status check functions
  const handleCheckLLMStatus = useCallback(async () => {
    return await checkLLMStatus();
  }, [checkLLMStatus]);
  
  const handleCheckConvexStatus = useCallback(async () => {
    return await checkConvexStatus();
  }, [checkConvexStatus]);
  
  const handleCheckAllStatus = useCallback(async () => {
    return await checkAllStatus();
  }, [checkAllStatus]);
  
  // Optimistic update functions
  const updateLLMStatusOptimistically = useCallback((partialStatus: Partial<typeof llmStatus>) => {
    optimisticLLMUpdate(partialStatus);
  }, [optimisticLLMUpdate]);
  
  const updateConvexStatusOptimistically = useCallback((partialStatus: Partial<typeof convexStatus>) => {
    optimisticConvexUpdate(partialStatus);
  }, [optimisticConvexUpdate]);
  
  // Auto-polling effect for LLM status
  useEffect(() => {
    // Initial check
    handleCheckLLMStatus();
    
    // Set up polling with dynamic interval
    const interval = setInterval(() => {
      handleCheckLLMStatus();
    }, pollingIntervals.llm);
    
    return () => clearInterval(interval);
  }, [handleCheckLLMStatus, pollingIntervals.llm]);
  
  // Auto-polling effect for Convex status
  useEffect(() => {
    // Initial check
    handleCheckConvexStatus();
    
    // Set up polling with dynamic interval
    const interval = setInterval(() => {
      handleCheckConvexStatus();
    }, pollingIntervals.convex);
    
    return () => clearInterval(interval);
  }, [handleCheckConvexStatus, pollingIntervals.convex]);
  
  // Derived state
  const systemHealth = getSystemHealth();
  const systemReady = isSystemReady();
  
  // Status summary for easy consumption
  const statusSummary = {
    llm: {
      ...llmStatus,
      lastUpdated: lastUpdated.llm,
      consecutiveErrors: consecutiveErrors.llm,
      pollingInterval: pollingIntervals.llm,
      loading: loading.llm
    },
    convex: {
      ...convexStatus,
      lastUpdated: lastUpdated.convex,
      consecutiveErrors: consecutiveErrors.convex,
      pollingInterval: pollingIntervals.convex,
      loading: loading.convex
    },
    system: {
      health: systemHealth,
      ready: systemReady,
      overallLoading: loading.llm || loading.convex
    }
  };
  
  return {
    // Status data
    llmStatus,
    convexStatus,
    statusSummary,
    
    // Loading states
    loading,
    
    // System state
    systemHealth,
    systemReady,
    
    // Metadata
    lastUpdated,
    consecutiveErrors,
    pollingIntervals,
    
    // Operations
    checkLLMStatus: handleCheckLLMStatus,
    checkConvexStatus: handleCheckConvexStatus,
    checkAllStatus: handleCheckAllStatus,
    
    // Optimistic updates
    updateLLMStatusOptimistically,
    updateConvexStatusOptimistically,
    
    // Direct store actions (for advanced usage)
    setLLMStatus,
    setConvexStatus
  };
}

/**
 * Hook specifically for LLM status monitoring
 */
export function useLLMStatus() {
  const {
    llmStatus,
    loading,
    checkLLMStatus,
    updateLLMStatusOptimistically,
    lastUpdated,
    consecutiveErrors,
    pollingIntervals
  } = useStatusOperations();
  
  return {
    status: llmStatus,
    loading: loading.llm,
    lastUpdated: lastUpdated.llm,
    consecutiveErrors: consecutiveErrors.llm,
    pollingInterval: pollingIntervals.llm,
    checkStatus: checkLLMStatus,
    updateOptimistically: updateLLMStatusOptimistically
  };
}

/**
 * Hook specifically for Convex status monitoring
 */
export function useConvexStatus() {
  const {
    convexStatus,
    loading,
    checkConvexStatus,
    updateConvexStatusOptimistically,
    lastUpdated,
    consecutiveErrors,
    pollingIntervals
  } = useStatusOperations();
  
  return {
    status: convexStatus,
    loading: loading.convex,
    lastUpdated: lastUpdated.convex,
    consecutiveErrors: consecutiveErrors.convex,
    pollingInterval: pollingIntervals.convex,
    checkStatus: checkConvexStatus,
    updateOptimistically: updateConvexStatusOptimistically
  };
}