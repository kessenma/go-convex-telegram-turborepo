"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook to manage user sessions for tracking active users
 * Automatically creates and maintains a session when the user visits the site
 * Uses cookies to cache session data and prevent excessive API calls
 * @param enabled - Whether to enable session tracking (defaults to true)
 */
export function useUserSession(enabled: boolean = true) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCreatedRef = useRef(false);
  const lastHeartbeatRef = useRef<number>(0);

  // Cookie utilities
  const setCookie = (name: string, value: string, minutes: number) => {
    const expires = new Date(Date.now() + minutes * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict`;
  };

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue || null;
    }
    return null;
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  // Generate a unique session ID
  const generateSessionId = () => {
    return `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get or create session ID from cookie
  const getOrCreateSessionId = (): string => {
    const existingSessionId = getCookie('user-session-id');
    const lastActivity = getCookie('user-session-activity');
    
    // Check if existing session is still valid (within 3 minutes)
    if (existingSessionId && lastActivity) {
      const lastActivityTime = parseInt(lastActivity, 10);
      const now = Date.now();
      const sessionTimeout = 3 * 60 * 1000; // 3 minutes
      
      if (now - lastActivityTime < sessionTimeout) {
        // Update activity timestamp
        setCookie('user-session-activity', now.toString(), 5);
        return existingSessionId;
      }
    }
    
    // Create new session
    const newSessionId = generateSessionId();
    setCookie('user-session-id', newSessionId, 5); // 5 minutes
    setCookie('user-session-activity', Date.now().toString(), 5);
    return newSessionId;
  };

  // Create or update session
  const createSession = async (sessionId: string) => {
    try {
      const response = await fetch("/api/users/active-count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          source: "web",
          userAgent: navigator.userAgent,
          metadata: JSON.stringify({
            url: window.location.href,
            timestamp: Date.now(),
          }),
        }),
      });

      if (response.ok) {
        setIsActive(true);
        return true;
      } else {
        console.error("Failed to create session:", response.statusText);
        return false;
      }
    } catch (error) {
      console.error("Error creating session:", error);
      return false;
    }
  };

  // Send heartbeat to keep session alive
  const sendHeartbeat = async (sessionId: string) => {
    try {
      const response = await fetch("/api/users/active-count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          source: "web",
          userAgent: navigator.userAgent,
          metadata: JSON.stringify({
            url: window.location.href,
            timestamp: Date.now(),
            heartbeat: true,
          }),
        }),
      });

      if (!response.ok) {
        console.error("Failed to send heartbeat:", response.statusText);
        setIsActive(false);
      }
    } catch (error) {
      console.error("Error sending heartbeat:", error);
      setIsActive(false);
    }
  };

  // End session
  const _endSession = async (_sessionId: string) => {
    try {
      // Note: We would need to add an endpoint to end sessions
      // For now, we'll just stop the heartbeat and let it expire naturally
      setIsActive(false);
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  // Start heartbeat with throttling
  const startHeartbeat = (sessionId: string) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      const now = Date.now();
      // Throttle heartbeats to prevent excessive API calls (minimum 30 seconds between calls)
      if (now - lastHeartbeatRef.current >= 30000) {
        sendHeartbeat(sessionId);
        lastHeartbeatRef.current = now;
        // Update activity timestamp in cookie
        setCookie('user-session-activity', now.toString(), 5);
      }
    }, 60 * 1000); // Check every minute, but only send if 30+ seconds have passed
  };

  // Cleanup function
  const cleanup = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Main effect to handle session lifecycle
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const initSession = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        setSessionId(sessionId);
        
        // Check if we need to create a new session (not in cookie or expired)
        const existingSessionId = getCookie('user-session-id');
        const sessionExists = getCookie('user-session-exists');
        
        if (!sessionExists || existingSessionId !== sessionId) {
          await createSession(sessionId);
          setCookie('user-session-exists', 'true', 5);
          sessionCreatedRef.current = true;
        }
        
        setIsActive(true);
        
        // Start heartbeat with throttling
        startHeartbeat(sessionId);
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };

    initSession();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [enabled]);

  // Handle page visibility changes
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Only send heartbeat if enough time has passed (throttling)
        if (now - lastHeartbeatRef.current >= 30000) {
          sendHeartbeat(sessionId);
          lastHeartbeatRef.current = now;
          // Update activity timestamp in cookie
          setCookie('user-session-activity', now.toString(), 5);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, sessionId]);

  // Handle page unload
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const handleBeforeUnload = () => {
      // Clean up cookies on page unload
      deleteCookie('user-session-exists');
      
      // Send final heartbeat before leaving
      // Use sendBeacon for reliability during page unload
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          sessionId,
          timestamp: Date.now(),
          action: 'heartbeat',
        });
        navigator.sendBeacon('/api/users/active-count', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, sessionId]);

  return {
    sessionId,
    isActive,
  };
}
