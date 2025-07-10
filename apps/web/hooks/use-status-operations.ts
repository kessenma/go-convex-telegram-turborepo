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
    dockerStatus,
    loading,
    lastUpdated,
    consecutiveErrors,
    pollingIntervals,
    setLLMStatus,
    setConvexStatus,
    setDockerStatus,
    checkLLMStatus,
    checkConvexStatus,
    checkDockerStatus,
    checkAllStatus,
    getSystemHealth,
    isSystemReady,
    optimisticLLMUpdate,
    optimisticConvexUpdate,
    optimisticDockerUpdate
  } = useStatusStore();
  
  // Memoized status check functions
  const handleCheckLLMStatus = useCallback(async () => {
    return await checkLLMStatus();
  }, [checkLLMStatus]);
  
  const handleCheckConvexStatus = useCallback(async () => {
    return await checkConvexStatus();
  }, [checkConvexStatus]);
  
  const handleCheckDockerStatus = useCallback(async () => {
    return await checkDockerStatus();
  }, [checkDockerStatus]);
  
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
  
  const updateDockerStatusOptimistically = useCallback((partialStatus: Partial<typeof dockerStatus>) => {
    optimisticDockerUpdate(partialStatus);
  }, [optimisticDockerUpdate]);
  
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
  
  // Auto-polling effect for Docker status
  useEffect(() => {
    if (!pollingIntervals.docker) return;
    
    const interval = setInterval(() => {
      handleCheckDockerStatus();
    }, pollingIntervals.docker);
    
    return () => clearInterval(interval);
  }, [pollingIntervals.docker, handleCheckDockerStatus]);
  
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
    docker: {
      ...dockerStatus,
      lastUpdated: lastUpdated.docker,
      consecutiveErrors: consecutiveErrors.docker,
      pollingInterval: pollingIntervals.docker,
      loading: loading.docker
    },
    system: {
      health: systemHealth,
      ready: systemReady,
      overallLoading: loading.llm || loading.convex || loading.docker
    }
  };
  
  return {
    // Status data
    llmStatus,
    convexStatus,
    dockerStatus,
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
    checkDockerStatus: handleCheckDockerStatus,
    checkAllStatus: handleCheckAllStatus,
    
    // Optimistic updates
    updateLLMStatusOptimistically,
    updateConvexStatusOptimistically,
    updateDockerStatusOptimistically,
    
    // Direct store actions (for advanced usage)
    setLLMStatus,
    setConvexStatus,
    setDockerStatus
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