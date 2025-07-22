"use client";

import type React from "react";
import { createContext, useContext, useEffect } from "react";
import { useConsolidatedHealthCheck } from "../../hooks/use-consolidated-health-check";

interface HealthCheckContextType {
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
  performHealthChecks: () => Promise<void>;
}

const HealthCheckContext = createContext<HealthCheckContextType | null>(null);

interface HealthCheckProviderProps {
  children: React.ReactNode;
  autoStart?: boolean;
}

/**
 * Provider component that manages centralized health checking for the entire application
 * This ensures only one polling mechanism is active at a time, reducing API call spam
 */
export function HealthCheckProvider({
  children,
  autoStart = true,
}: HealthCheckProviderProps) {
  const healthCheck = useConsolidatedHealthCheck();

  useEffect(() => {
    if (autoStart) {
      healthCheck.startPolling();
    }

    return () => {
      healthCheck.stopPolling();
    };
  }, [autoStart, healthCheck]);

  return (
    <HealthCheckContext.Provider value={healthCheck}>
      {children}
    </HealthCheckContext.Provider>
  );
}

/**
 * Hook to access the centralized health check controls
 */
export function useHealthCheckContext() {
  const context = useContext(HealthCheckContext);
  if (!context) {
    // During prerendering, return a default context instead of throwing
    if (typeof window === 'undefined') {
      return {
        startPolling: () => {},
        stopPolling: () => {},
        isPolling: false,
        performHealthChecks: async () => {},
      };
    }
    throw new Error(
      "useHealthCheckContext must be used within a HealthCheckProvider"
    );
  }
  return context;
}
