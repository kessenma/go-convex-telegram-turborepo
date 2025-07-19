"use client";

import { useCallback } from 'react';
import { useStatusStore } from '../stores/status-store';
import { useHealthCheckContext } from '../components/providers/health-check-provider';

/**
 * Hook for components that need to manually trigger health checks
 * without setting up their own polling mechanisms
 */
export function useManualHealthCheck() {
  const {
    checkLLMStatus,
    checkLightweightLlmStatus,
    checkConvexStatus,
    checkDockerStatus,
    checkUserCountStatus,
    checkAllStatus
  } = useStatusStore();

  const { performHealthChecks } = useHealthCheckContext();

  // Individual service checks
  const checkLLM = useCallback(async () => {
    try {
      return await checkLLMStatus();
    } catch (error) {
      console.warn('Manual LLM health check failed:', error);
      return false;
    }
  }, [checkLLMStatus]);

  const checkLightweightLLM = useCallback(async () => {
    try {
      return await checkLightweightLlmStatus();
    } catch (error) {
      console.warn('Manual Lightweight LLM health check failed:', error);
      return false;
    }
  }, [checkLightweightLlmStatus]);

  const checkConvex = useCallback(async () => {
    try {
      return await checkConvexStatus();
    } catch (error) {
      console.warn('Manual Convex health check failed:', error);
      return false;
    }
  }, [checkConvexStatus]);

  const checkDocker = useCallback(async () => {
    try {
      return await checkDockerStatus();
    } catch (error) {
      console.warn('Manual Docker health check failed:', error);
      return false;
    }
  }, [checkDockerStatus]);

  const checkUserCount = useCallback(async () => {
    try {
      return await checkUserCountStatus();
    } catch (error) {
      console.warn('Manual User Count check failed:', error);
      return false;
    }
  }, [checkUserCountStatus]);

  // Check all services
  const checkAll = useCallback(async () => {
    try {
      return await checkAllStatus();
    } catch (error) {
      console.warn('Manual all services health check failed:', error);
      return {
        llm: false,
        lightweightLlm: false,
        convex: false,
        docker: false,
        userCount: false
      };
    }
  }, [checkAllStatus]);

  // Trigger the centralized health check (respects timing constraints)
  const triggerCentralizedCheck = useCallback(async () => {
    try {
      await performHealthChecks();
    } catch (error) {
      console.warn('Manual centralized health check failed:', error);
    }
  }, [performHealthChecks]);

  return {
    // Individual service checks (bypass centralized timing)
    checkLLM,
    checkLightweightLLM,
    checkConvex,
    checkDocker,
    checkUserCount,
    checkAll,
    
    // Centralized check (respects timing constraints)
    triggerCentralizedCheck
  };
}

/**
 * Hook for components that need to refresh status on user interaction
 * This is useful for refresh buttons, pull-to-refresh, etc.
 */
export function useRefreshStatus() {
  const { checkAll } = useManualHealthCheck();
  
  const refreshAll = useCallback(async () => {
    console.log('Refreshing all status checks...');
    const results = await checkAll();
    console.log('Status refresh completed:', results);
    return results;
  }, [checkAll]);

  return {
    refreshAll,
    isRefreshing: false // Could be enhanced with loading state if needed
  };
}