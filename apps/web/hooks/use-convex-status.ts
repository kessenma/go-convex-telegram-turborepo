"use client";

import { useState, useEffect } from 'react';

interface ConvexStatus {
  status: 'connected' | 'disconnected' | 'connecting';
  ready: boolean;
  message: string;
  details?: {
    uptime?: string;
    timestamp?: string;
    error?: string;
  };
}

export function useConvexStatus() {
  const [convexStatus, setConvexStatus] = useState<ConvexStatus>({
    status: 'connecting',
    ready: false,
    message: 'Checking Convex connection...'
  });

  const checkStatus = async () => {
    try {
      // Use our internal API endpoint to avoid CORS issues
      const response = await fetch('/api/convex/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        setConvexStatus({
          status: 'disconnected',
          ready: false,
          message: `Convex service unavailable (${response.status})`,
          details: {
            error: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const data = await response.json();
      
      // Use the status from our API response
      setConvexStatus({
        status: data.status || 'disconnected',
        ready: data.ready || false,
        message: data.message || 'Convex status unknown',
        details: data.details || {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cannot connect to Convex';
      setConvexStatus({
        status: 'disconnected',
        ready: false,
        message: 'Cannot connect to Convex database',
        details: {
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkStatus();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return { convexStatus, checkStatus };
}