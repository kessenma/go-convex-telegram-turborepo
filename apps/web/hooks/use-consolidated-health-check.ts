"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStatusStore } from "../stores/status-store";

/**
 * Consolidated health check hook that manages all status polling from a single source
 * This reduces the number of concurrent API calls and console spam
 */
export function useConsolidatedHealthCheck() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const {
    checkLLMStatus,
    checkLightweightLlmStatus,
    checkConvexStatus,
    checkDockerStatus,
    checkUserCountStatus,
    pollingIntervals,
    consecutiveErrors,
  } = useStatusStore();

  // Calculate the greatest common divisor to find optimal polling interval
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const findOptimalInterval = useCallback(() => {
    const intervals = Object.values(pollingIntervals);
    return intervals.reduce((acc, curr) => gcd(acc, curr));
  }, [pollingIntervals, gcd]);

  // Track last check times for each service
  const lastCheckTimes = useRef({
    llm: 0,
    lightweightLlm: 0,
    convex: 0,
    docker: 0,
    userCount: 0,
  });

  const performHealthChecks = useCallback(async () => {
    if (isPollingRef.current) return; // Prevent overlapping calls

    isPollingRef.current = true;
    const now = Date.now();
    const checks: Promise<any>[] = [];

    // Only check services that are due for a check
    if (now - lastCheckTimes.current.llm >= pollingIntervals.llm) {
      lastCheckTimes.current.llm = now;
      checks.push(checkLLMStatus().catch(() => false));
    }

    if (
      now - lastCheckTimes.current.lightweightLlm >=
      pollingIntervals.lightweightLlm
    ) {
      lastCheckTimes.current.lightweightLlm = now;
      checks.push(checkLightweightLlmStatus().catch(() => false));
    }

    if (now - lastCheckTimes.current.convex >= pollingIntervals.convex) {
      lastCheckTimes.current.convex = now;
      checks.push(checkConvexStatus().catch(() => false));
    }

    if (now - lastCheckTimes.current.docker >= pollingIntervals.docker) {
      lastCheckTimes.current.docker = now;
      checks.push(checkDockerStatus().catch(() => false));
    }

    if (now - lastCheckTimes.current.userCount >= pollingIntervals.userCount) {
      lastCheckTimes.current.userCount = now;
      checks.push(checkUserCountStatus().catch(() => false));

      // Trigger session cleanup when checking user count (every 75 seconds)
      // This provides additional cleanup beyond the cron job
      checks.push(
        fetch("/api/users/active-count/cleanup", { method: "POST" })
          .then(() => true)
          .catch((error) => {
            console.debug("Session cleanup request failed:", error);
            return false;
          })
      );
    }

    // Execute all due checks in parallel
    if (checks.length > 0) {
      try {
        await Promise.allSettled(checks);
      } catch (_error) {
        // Silently handle errors as individual status checks handle their own error states
      }
    }

    isPollingRef.current = false;
  }, [
    checkLLMStatus,
    checkLightweightLlmStatus,
    checkConvexStatus,
    checkDockerStatus,
    checkUserCountStatus,
    pollingIntervals,
  ]);

  // Start consolidated polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // Already polling

    // Use a base interval that's the GCD of all polling intervals
    // This ensures we check each service at its required frequency
    const baseInterval = Math.max(findOptimalInterval(), 5000); // Minimum 5 seconds

    // Perform initial check
    performHealthChecks();

    intervalRef.current = setInterval(performHealthChecks, baseInterval);
  }, [performHealthChecks, findOptimalInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-start polling on mount
  useEffect(() => {
    startPolling();

    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // Restart polling when intervals change
  useEffect(() => {
    stopPolling();
    startPolling();
  }, [startPolling, stopPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling: !!intervalRef.current,
    performHealthChecks,
  };
}

/**
 * Hook for components that need status data but don't want to trigger polling
 * This is a read-only hook that consumes the centralized status
 */
export function useStatusData() {
  const {
    llmStatus,
    lightweightLlmStatus,
    convexStatus,
    dockerStatus,
    userCountStatus,
    loading,
    lastUpdated,
    consecutiveErrors,
    pollingIntervals,
    getSystemHealth,
    isSystemReady,
  } = useStatusStore();

  return {
    llmStatus,
    lightweightLlmStatus,
    convexStatus,
    dockerStatus,
    userCountStatus,
    loading,
    lastUpdated,
    consecutiveErrors,
    pollingIntervals,
    systemHealth: getSystemHealth(),
    systemReady: isSystemReady(),
    statusSummary: {
      llm: {
        ...llmStatus,
        lastUpdated: lastUpdated.llm,
        consecutiveErrors: consecutiveErrors.llm,
        pollingInterval: pollingIntervals.llm,
        loading: loading.llm,
      },
      lightweightLlm: {
        ...lightweightLlmStatus,
        lastUpdated: lastUpdated.lightweightLlm,
        consecutiveErrors: consecutiveErrors.lightweightLlm,
        pollingInterval: pollingIntervals.lightweightLlm,
        loading: loading.lightweightLlm,
      },
      convex: {
        ...convexStatus,
        lastUpdated: lastUpdated.convex,
        consecutiveErrors: consecutiveErrors.convex,
        pollingInterval: pollingIntervals.convex,
        loading: loading.convex,
      },
      docker: {
        ...dockerStatus,
        lastUpdated: lastUpdated.docker,
        consecutiveErrors: consecutiveErrors.docker,
        pollingInterval: pollingIntervals.docker,
        loading: loading.docker,
      },
      userCount: {
        ...userCountStatus,
        lastUpdated: lastUpdated.userCount,
        consecutiveErrors: consecutiveErrors.userCount,
        pollingInterval: pollingIntervals.userCount,
        loading: loading.userCount,
      },
    },
  };
}
