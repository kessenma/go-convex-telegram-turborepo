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
    lightweightLlmStatus,
    convexStatus,
    dockerStatus,
    loading,
    lastUpdated,
    consecutiveErrors,
    pollingIntervals,
    setLLMStatus,
    setLightweightLlmStatus,
    setConvexStatus,
    setDockerStatus,
    checkLLMStatus,
    checkLightweightLlmStatus,
    checkConvexStatus,
    checkDockerStatus,
    checkAllStatus,
    getSystemHealth,
    isSystemReady,
    optimisticLLMUpdate,
    optimisticLightweightLlmUpdate,
    optimisticConvexUpdate,
    optimisticDockerUpdate
  } = useStatusStore();
  
  // Memoized status check functions
  const handleCheckLLMStatus = useCallback(async () => {
    return await checkLLMStatus();
  }, [checkLLMStatus]);
  
  const handleCheckLightweightLlmStatus = useCallback(async () => {
    return await checkLightweightLlmStatus();
  }, [checkLightweightLlmStatus]);
  
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
  
  const updateLightweightLlmStatusOptimistically = useCallback((partialStatus: Partial<typeof lightweightLlmStatus>) => {
    optimisticLightweightLlmUpdate(partialStatus);
  }, [optimisticLightweightLlmUpdate]);
  
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
  
  // Auto-polling effect for Lightweight LLM status
  useEffect(() => {
    // Initial check
    handleCheckLightweightLlmStatus();
    
    // Set up polling with dynamic interval
    const interval = setInterval(() => {
      handleCheckLightweightLlmStatus();
    }, pollingIntervals.lightweightLlm);
    
    return () => clearInterval(interval);
  }, [handleCheckLightweightLlmStatus, pollingIntervals.lightweightLlm]);
  
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
    lightweightLlm: {
      ...lightweightLlmStatus,
      lastUpdated: lastUpdated.lightweightLlm,
      consecutiveErrors: consecutiveErrors.lightweightLlm,
      pollingInterval: pollingIntervals.lightweightLlm,
      loading: loading.lightweightLlm
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
      overallLoading: loading.llm || loading.lightweightLlm || loading.convex || loading.docker
    }
  };
  
  return {
    // Status data
    llmStatus,
    lightweightLlmStatus,
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
    checkLightweightLlmStatus: handleCheckLightweightLlmStatus,
    checkConvexStatus: handleCheckConvexStatus,
    checkDockerStatus: handleCheckDockerStatus,
    checkAllStatus: handleCheckAllStatus,
    
    // Optimistic updates
    updateLLMStatusOptimistically,
    updateLightweightLlmStatusOptimistically,
    updateConvexStatusOptimistically,
    updateDockerStatusOptimistically,
    
    // Direct store actions (for advanced usage)
    setLLMStatus,
    setLightweightLlmStatus,
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
 * Hook specifically for Lightweight LLM status monitoring
 */
export function useLightweightLlmStatus() {
  const {
    lightweightLlmStatus,
    loading,
    checkLightweightLlmStatus,
    updateLightweightLlmStatusOptimistically,
    lastUpdated,
    consecutiveErrors,
    pollingIntervals
  } = useStatusOperations();
  
  return {
    status: lightweightLlmStatus,
    loading: loading.lightweightLlm,
    lastUpdated: lastUpdated.lightweightLlm,
    consecutiveErrors: consecutiveErrors.lightweightLlm,
    pollingInterval: pollingIntervals.lightweightLlm,
    checkStatus: checkLightweightLlmStatus,
    updateOptimistically: updateLightweightLlmStatusOptimistically
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