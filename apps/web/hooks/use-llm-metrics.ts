"use client";

import { useCallback } from "react";
import { useStatusData } from "./use-consolidated-health-check";
import { useStatusStore } from "../stores/status-store";

/**
 * Hook specifically for LLM metrics that provides consolidated data
 * from both Vector Convert and Chat services
 */
export function useLLMMetrics() {
  const { consolidatedLLMMetrics, loading, lastUpdated, consecutiveErrors, pollingIntervals } = useStatusData();
  const { checkConsolidatedLLMMetrics, optimisticConsolidatedLLMUpdate } = useStatusStore();

  // Ensure we have safe defaults
  const safeMetrics = consolidatedLLMMetrics || null;

  // Extract individual service data with safe defaults
  const vectorService = safeMetrics?.services?.vector || null;
  const chatService = safeMetrics?.services?.chat || null;
  const summary = safeMetrics?.summary || null;

  // Service status helpers
  const isVectorHealthy = vectorService?.status === 'healthy' && vectorService?.ready;
  const isChatHealthy = chatService?.status === 'healthy' && chatService?.ready;
  const isAnyServiceHealthy = isVectorHealthy || isChatHealthy;
  const areBothServicesHealthy = isVectorHealthy && isChatHealthy;

  // Memory and CPU data
  const vectorMemory = (vectorService?.memory_usage?.process_memory_mb as number) || 0;
  const vectorCPU = (vectorService?.memory_usage?.process_cpu_percent as number) || 0;
  const chatMemory = (chatService?.memory_usage?.rss_mb as number) || 0;
  const chatCPU = (chatService?.memory_usage?.percent as number) || 0;

  // Refresh metrics manually
  const refreshMetrics = useCallback(async () => {
    return await checkConsolidatedLLMMetrics();
  }, [checkConsolidatedLLMMetrics]);

  // Update metrics optimistically
  const updateMetricsOptimistically = useCallback((partialMetrics: any) => {
    optimisticConsolidatedLLMUpdate(partialMetrics);
  }, [optimisticConsolidatedLLMUpdate]);

  return {
    // Raw data
    consolidatedMetrics: safeMetrics,
    vectorService,
    chatService,
    summary,

    // Status flags
    isVectorHealthy,
    isChatHealthy,
    isAnyServiceHealthy,
    areBothServicesHealthy,
    isLoading: loading.consolidatedLLM,
    hasError: consecutiveErrors.consolidatedLLM > 0,

    // Memory and CPU data
    vectorMemory,
    vectorCPU,
    chatMemory,
    chatCPU,
    totalMemory: (summary?.totalMemoryMB as number) || 0,
    averageCPU: (summary?.averageCPU as number) || 0,
    healthyServices: (summary?.healthyServices as number) || 0,

    // Metadata
    lastUpdated: lastUpdated.consolidatedLLM,
    consecutiveErrors: consecutiveErrors.consolidatedLLM,
    pollingInterval: pollingIntervals.consolidatedLLM,
    timestamp: safeMetrics?.timestamp,

    // Actions
    refreshMetrics,
    updateMetricsOptimistically,

    // Helper functions
    getServiceStatus: (service: 'vector' | 'chat') => {
      const serviceData = service === 'vector' ? vectorService : chatService;
      return {
        status: serviceData?.status || 'unknown',
        ready: serviceData?.ready || false,
        message: serviceData?.message || 'No data available',
        memory: service === 'vector' ? vectorMemory : chatMemory,
        cpu: service === 'vector' ? vectorCPU : chatCPU,
      };
    },

    getStatusColor: (service: 'vector' | 'chat') => {
      const serviceData = service === 'vector' ? vectorService : chatService;
      if (!serviceData?.ready) return "#64748b"; // slate-500
      switch (serviceData.status) {
        case 'healthy': return "#10b981"; // emerald-500
        case 'loading': return "#f59e0b"; // amber-500
        case 'error': return "#ef4444"; // red-500
        default: return "#64748b"; // slate-500
      }
    },
  };
}

/**
 * Hook for components that only need basic LLM status without metrics
 */
export function useLLMStatus() {
  const { vectorService, chatService, isAnyServiceHealthy, areBothServicesHealthy, isLoading } = useLLMMetrics();

  return {
    vectorStatus: vectorService?.status || 'unknown',
    chatStatus: chatService?.status || 'unknown',
    vectorReady: vectorService?.ready || false,
    chatReady: chatService?.ready || false,
    isAnyServiceHealthy,
    areBothServicesHealthy,
    isLoading,
    overallStatus: areBothServicesHealthy ? 'healthy' : isAnyServiceHealthy ? 'degraded' : 'error',
  };
}