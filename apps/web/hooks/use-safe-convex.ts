"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReference, OptionalRestArgs } from "convex/server";
import { useCallback, useEffect, useState } from "react";

/**
 * Safe wrapper around useQuery that handles Convex connection failures gracefully
 */
export function useSafeQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...args: OptionalRestArgs<Query>
): {
  data: Query["_returnType"] | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
} {
  const [error, setError] = useState<Error | null>(null);
  const [_retryKey, setRetryKey] = useState(0);

  let data: Query["_returnType"] | undefined;
  let convexError: Error | null = null;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    data = useQuery(query, ...args);
  } catch (err) {
    convexError =
      err instanceof Error ? err : new Error("Unknown Convex error");
  }

  useEffect(() => {
    if (convexError) {
      setError(convexError);
    } else {
      setError(null);
    }
  }, [convexError]);

  const retry = () => {
    setError(null);
    setRetryKey((prev) => prev + 1);
  };

  return {
    data,
    error,
    isLoading: data === undefined && !error,
    isError: !!error,
    retry,
  };
}

/**
 * Safe wrapper around useMutation that handles Convex connection failures gracefully
 */
export function useSafeMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation
): {
  mutate: (
    ...args: OptionalRestArgs<Mutation>
  ) => Promise<Mutation["_returnType"] | null>;
  isLoading: boolean;
  error: Error | null;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  let convexMutation:
    | ((
        ...args: OptionalRestArgs<Mutation>
      ) => Promise<Mutation["_returnType"]>)
    | null = null;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    convexMutation = useMutation(mutation);
  } catch (err) {
    console.error("Failed to initialize Convex mutation:", err);
  }

  const mutate = async (
    ...args: OptionalRestArgs<Mutation>
  ): Promise<Mutation["_returnType"] | null> => {
    if (!convexMutation) {
      const error = new Error(
        "Convex mutation not available - database may be down"
      );
      setError(error);
      throw error;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await convexMutation(...args);
      setIsLoading(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Mutation failed");
      setError(error);
      setIsLoading(false);
      throw error;
    }
  };

  return {
    mutate,
    isLoading,
    error,
  };
}

/**
 * Hook to check if Convex is available and connected
 * Note: This now uses the centralized status from HealthCheckProvider
 * to avoid duplicate API calls
 */
export function useConvexConnection(): {
  isConnected: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  checkConnection: () => void;
} {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      // Try to make a simple query to test connection
      // This is a basic connectivity test
      const response = await fetch("/api/convex/status");
      setIsConnected(response.ok);
    } catch (error) {
      console.error("Convex connection check failed:", error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    // Only do an initial check, don't set up polling
    // The HealthCheckProvider handles regular status checks
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    isChecking,
    lastChecked,
    checkConnection,
  };
}
