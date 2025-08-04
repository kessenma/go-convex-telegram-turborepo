"use client";

import { useCallback } from "react";
import { useStatusStore } from "../stores/status-store";
import { useStatusData } from "./use-consolidated-health-check";

/**
 * Custom hook for status operations with optimized data fetching and state management
 * Now uses centralized health checking to avoid polling conflicts
 * @deprecated Consider using useStatusData for read-only access or individual status hooks
 */
export function useStatusOperations() {
  // Get status data from centralized source
  const statusData = useStatusData();

  // Get store actions (but not the polling logic)
  const {
    setLLMStatus,
    setLightweightLlmStatus,
    setConvexStatus,
    setDockerStatus,

    checkLLMStatus,
    checkLightweightLlmStatus,
    checkConvexStatus,
    checkDockerStatus,

    checkAllStatus,
    optimisticLLMUpdate,
    optimisticLightweightLlmUpdate,
    optimisticConvexUpdate,
    optimisticDockerUpdate,

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
  const updateLLMStatusOptimistically = useCallback(
    (partialStatus: Partial<typeof statusData.llmStatus>) => {
      optimisticLLMUpdate(partialStatus);
    },
    [optimisticLLMUpdate]
  );

  const updateLightweightLlmStatusOptimistically = useCallback(
    (partialStatus: Partial<typeof statusData.lightweightLlmStatus>) => {
      optimisticLightweightLlmUpdate(partialStatus);
    },
    [optimisticLightweightLlmUpdate]
  );

  const updateConvexStatusOptimistically = useCallback(
    (partialStatus: Partial<typeof statusData.convexStatus>) => {
      optimisticConvexUpdate(partialStatus);
    },
    [optimisticConvexUpdate]
  );

  const updateDockerStatusOptimistically = useCallback(
    (partialStatus: Partial<typeof statusData.dockerStatus>) => {
      optimisticDockerUpdate(partialStatus);
    },
    [optimisticDockerUpdate]
  );



  // Note: Polling is now handled by the centralized HealthCheckProvider
  // Individual components should use the specific status hooks instead

  // Use centralized status data
  const { systemHealth, systemReady, statusSummary } = statusData;

  return {
    // Status data from centralized source
    ...statusData,
    statusSummary,

    // Operations (manual triggers only - polling is centralized)
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
    setDockerStatus,

  };
}

/**
 * Hook specifically for LLM status monitoring
 * Now uses centralized data source without individual polling
 */
export function useLLMStatus() {
  const {
    llmStatus,
    loading,
    lastUpdated,
    consecutiveErrors,
    pollingIntervals,
  } = useStatusData();
  const { checkLLMStatus, optimisticLLMUpdate } = useStatusStore();

  return {
    status: llmStatus,
    loading: loading.llm,
    lastUpdated: lastUpdated.llm,
    consecutiveErrors: consecutiveErrors.llm,
    pollingInterval: pollingIntervals.llm,
    checkStatus: checkLLMStatus,
    updateOptimistically: optimisticLLMUpdate,
  };
}

/**
 * Hook specifically for Lightweight LLM status monitoring
 * Now uses centralized data source without individual polling
 */
export function useLightweightLlmStatus() {
  const {
    lightweightLlmStatus,
    loading,
    lastUpdated,
    consecutiveErrors,
    pollingIntervals,
  } = useStatusData();
  const { checkLightweightLlmStatus, optimisticLightweightLlmUpdate } =
    useStatusStore();

  return {
    status: lightweightLlmStatus,
    loading: loading.lightweightLlm,
    lastUpdated: lastUpdated.lightweightLlm,
    consecutiveErrors: consecutiveErrors.lightweightLlm,
    pollingInterval: pollingIntervals.lightweightLlm,
    checkStatus: checkLightweightLlmStatus,
    updateOptimistically: optimisticLightweightLlmUpdate,
  };
}

/**
 * Hook specifically for Convex status monitoring
 * Now uses centralized data source without individual polling
 */
export function useConvexStatus() {
  const {
    convexStatus,
    loading,
    lastUpdated,
    consecutiveErrors,
    pollingIntervals,
  } = useStatusData();
  const { checkConvexStatus, optimisticConvexUpdate } = useStatusStore();

  return {
    status: convexStatus,
    loading: loading.convex,
    lastUpdated: lastUpdated.convex,
    consecutiveErrors: consecutiveErrors.convex,
    pollingInterval: pollingIntervals.convex,
    checkStatus: checkConvexStatus,
    updateOptimistically: optimisticConvexUpdate,
  };
}

/**
 * Hook specifically for User Count status monitoring
 * Now uses centralized data source without individual polling
 */
