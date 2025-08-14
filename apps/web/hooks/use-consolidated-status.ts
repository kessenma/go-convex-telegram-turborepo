"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStatusStore } from "../stores/status-store";
import type {
  LLMStatus,
  LightweightLLMStatus,
  ConsolidatedLLMMetrics,
  ConvexStatus,

  DockerStatus,
} from "../stores/status-store";

/**
 * Consolidated hook that manages all status polling and provides unified access
 * to system health data. Replaces use-consolidated-health-check, use-llm-metrics,
 * and use-status-operations with a single, efficient implementation.
 */
export function useConsolidatedStatus() {
  const {
    llmStatus,
    lightweightLlmStatus,
    consolidatedLLMMetrics,
    convexStatus,

    dockerStatus,
    checkLLMStatus,
    checkLightweightLlmStatus,
    checkConsolidatedLLMMetrics,
    checkConvexStatus,

    checkDockerStatus,
    checkAllStatus,
  } = useStatusStore();

  const [isPolling, setIsPolling] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  // Calculate optimal polling interval based on system state
  const getPollingInterval = useCallback(() => {
    const hasErrors = [
      llmStatus.status === "error",
      lightweightLlmStatus.status === "error",
      convexStatus.status === "disconnected",
      dockerStatus.status === "critical",
    ].some(Boolean);

    const isLoading = [
      llmStatus.status === "loading" || llmStatus.status === "starting",
      lightweightLlmStatus.status === "loading" || lightweightLlmStatus.status === "starting",
      convexStatus.status === "connecting",
    ].some(Boolean);

    if (hasErrors) return 10000; // 10s for errors
    if (isLoading) return 5000;  // 5s for loading states
    return 30000; // 30s for healthy states
  }, [llmStatus.status, lightweightLlmStatus.status, convexStatus.status, dockerStatus.status]);

  // Perform all health checks in parallel
  const performHealthChecks = useCallback(async () => {
    if (isCheckingRef.current) return;
    
    isCheckingRef.current = true;
    setIsPolling(true);

    try {
      await Promise.allSettled([
        checkLLMStatus(),
        checkLightweightLlmStatus(),
        checkConsolidatedLLMMetrics(),
        checkConvexStatus(),
        checkDockerStatus(),
    
      ]);
      setLastCheck(new Date());
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      isCheckingRef.current = false;
      setIsPolling(false);
    }
  }, [
    checkLLMStatus,
    checkLightweightLlmStatus,
    checkConsolidatedLLMMetrics,
    checkConvexStatus,
    checkDockerStatus,

  ]);

  // Set up polling with dynamic intervals
  useEffect(() => {
    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const interval = getPollingInterval();
      intervalRef.current = setInterval(performHealthChecks, interval);
    };

    // Initial check
    performHealthChecks();
    
    // Start polling
    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [performHealthChecks, getPollingInterval]);

  // Manual refresh function
  const refreshAll = useCallback(async () => {
    await performHealthChecks();
  }, [performHealthChecks]);

  // Individual service refresh functions
  const refreshLLM = useCallback(async () => {
    try {
      await checkLLMStatus();
    } catch (error) {
      console.warn("LLM status refresh failed:", error);
    }
  }, [checkLLMStatus]);

  const refreshLightweightLLM = useCallback(async () => {
    try {
      await checkLightweightLlmStatus();
    } catch (error) {
      console.warn("Lightweight LLM status refresh failed:", error);
    }
  }, [checkLightweightLlmStatus]);

  const refreshConvex = useCallback(async () => {
    try {
      await checkConvexStatus();
    } catch (error) {
      console.warn("Convex status refresh failed:", error);
    }
  }, [checkConvexStatus]);

  const refreshDocker = useCallback(async () => {
    try {
      await checkDockerStatus();
    } catch (error) {
      console.warn("Docker status refresh failed:", error);
    }
  }, [checkDockerStatus]);

  // LLM Metrics helpers (from use-llm-metrics)
  const llmMetrics = useMemo(() => {
    if (!consolidatedLLMMetrics) {
      return {
        isHealthy: false,
        totalServices: 0,
        healthyServices: 0,
        totalMemoryMB: 0,
        averageCPU: 0,
        services: {},
      };
    }

    return {
      isHealthy: consolidatedLLMMetrics.summary?.healthyServices === consolidatedLLMMetrics.summary?.totalServices,
      totalServices: consolidatedLLMMetrics.summary?.totalServices || 0,
      healthyServices: consolidatedLLMMetrics.summary?.healthyServices || 0,
      totalMemoryMB: consolidatedLLMMetrics.summary?.totalMemoryMB || 0,
      averageCPU: consolidatedLLMMetrics.summary?.averageCPU || 0,
      services: consolidatedLLMMetrics.services || {},
    };
  }, [consolidatedLLMMetrics]);

  // Overall system health
  const systemHealth = useMemo(() => {
    const services = [
      { name: 'LLM', status: llmStatus.status, ready: llmStatus.ready, isHealthy: llmStatus.status === 'healthy' },
      { name: 'Lightweight LLM', status: lightweightLlmStatus.status, ready: lightweightLlmStatus.ready, isHealthy: lightweightLlmStatus.status === 'healthy' },
      { name: 'Convex', status: convexStatus.status, ready: convexStatus.ready, isHealthy: convexStatus.status === 'connected' },
      { name: 'Docker', status: dockerStatus.status, ready: dockerStatus.ready, isHealthy: dockerStatus.status === 'healthy' },
    ];

    const healthyCount = services.filter(s => s.isHealthy && s.ready).length;
    const totalCount = services.length;
    const hasErrors = [
      llmStatus.status === 'error',
      lightweightLlmStatus.status === 'error',
      convexStatus.status === 'disconnected',
      dockerStatus.status === 'critical',
    ].some(Boolean);
    const isLoading = [
      llmStatus.status === 'loading' || llmStatus.status === 'starting',
      lightweightLlmStatus.status === 'loading' || lightweightLlmStatus.status === 'starting',
      convexStatus.status === 'connecting',
    ].some(Boolean);

    return {
      healthyCount,
      totalCount,
      healthPercentage: (healthyCount / totalCount) * 100,
      hasErrors,
      isLoading,
      overallStatus: hasErrors ? 'error' : isLoading ? 'loading' : healthyCount === totalCount ? 'healthy' : 'warning',
    };
  }, [llmStatus, lightweightLlmStatus, convexStatus, dockerStatus]);

  return {
    // Status data
    llmStatus,
    lightweightLlmStatus,
    consolidatedLLMMetrics,
    convexStatus,

    dockerStatus,
    
    // LLM metrics
    llmMetrics,
    
    // System health
    systemHealth,
    
    // Polling state
    isPolling,
    lastCheck,
    
    // Refresh functions
    refreshAll,
    refreshLLM,
    refreshLightweightLLM,
    refreshConvex,
    refreshDocker,
    
    // Legacy compatibility
    performHealthChecks,
  };
}

/**
 * Read-only hook for accessing status data without triggering polling
 * Useful for components that only need to display data
 */
export function useStatusData() {
  const {
    llmStatus,
    lightweightLlmStatus,
    consolidatedLLMMetrics,
    convexStatus,

    dockerStatus,
  } = useStatusStore();

  return {
    llmStatus,
    lightweightLlmStatus,
    consolidatedLLMMetrics,
    convexStatus,

    dockerStatus,
  };
}

/**
 * Individual service hooks for backward compatibility
 */
export function useLLMStatus() {
  const { llmStatus } = useStatusStore();
  return { status: llmStatus, loading: llmStatus.status === 'loading' };
}

export function useLightweightLlmStatus() {
  const { lightweightLlmStatus } = useStatusStore();
  return { status: lightweightLlmStatus, loading: lightweightLlmStatus.status === 'loading' };
}

export function useConvexStatus() {
  const { convexStatus } = useStatusStore();
  return { status: convexStatus, loading: convexStatus.status === 'connecting' };
}

export function useDockerStatus() {
  const { dockerStatus } = useStatusStore();
  return { status: dockerStatus, loading: dockerStatus.status === 'connecting' };
}

export function useLLMMetrics() {
  const { consolidatedLLMMetrics } = useStatusStore();
  
  const metrics = useMemo(() => {
    if (!consolidatedLLMMetrics) {
      return {
        isHealthy: false,
        totalServices: 0,
        healthyServices: 0,
        totalMemoryMB: 0,
        averageCPU: 0,
        services: {},
        summary: null,
      };
    }

    return {
      isHealthy: consolidatedLLMMetrics.summary?.healthyServices === consolidatedLLMMetrics.summary?.totalServices,
      totalServices: consolidatedLLMMetrics.summary?.totalServices || 0,
      healthyServices: consolidatedLLMMetrics.summary?.healthyServices || 0,
      totalMemoryMB: consolidatedLLMMetrics.summary?.totalMemoryMB || 0,
      averageCPU: consolidatedLLMMetrics.summary?.averageCPU || 0,
      services: consolidatedLLMMetrics.services || {},
      summary: consolidatedLLMMetrics.summary,
    };
  }, [consolidatedLLMMetrics]);

  return metrics;
}