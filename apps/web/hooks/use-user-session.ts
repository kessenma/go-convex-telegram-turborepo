"use client";

import { useEffect, useRef, useState } from 'react';

/**
 * Hook to manage user sessions for tracking active users
 * Automatically creates and maintains a session when the user visits the site
 */
export function useUserSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCreatedRef = useRef(false);

  // Generate a unique session ID
  const generateSessionId = () => {
    return `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create or update session
  const createSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/users/active-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          source: 'web',
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
        console.error('Failed to create session:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error creating session:', error);
      return false;
    }
  };

  // Send heartbeat to keep session alive
  const sendHeartbeat = async (sessionId: string) => {
    try {
      const response = await fetch('/api/users/active-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          source: 'web',
          userAgent: navigator.userAgent,
          metadata: JSON.stringify({
            url: window.location.href,
            timestamp: Date.now(),
            heartbeat: true,
          }),
        }),
      });

      if (!response.ok) {
        console.error('Failed to send heartbeat:', response.statusText);
        setIsActive(false);
      }
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      setIsActive(false);
    }
  };

  // End session
  const endSession = async (sessionId: string) => {
    try {
      // Note: We would need to add an endpoint to end sessions
      // For now, we'll just stop the heartbeat and let it expire naturally
      setIsActive(false);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Initialize session on mount
  useEffect(() => {
    if (sessionCreatedRef.current) return;
    
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    
    // Create session
    createSession(newSessionId).then((success) => {
      if (success) {
        sessionCreatedRef.current = true;
        
        // Start heartbeat interval (every 2 minutes)
        heartbeatIntervalRef.current = setInterval(() => {
          sendHeartbeat(newSessionId);
        }, 2 * 60 * 1000); // 2 minutes
      }
    });

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (newSessionId && isActive) {
        endSession(newSessionId);
      }
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      } else {
        // Page is visible, resume heartbeat
        if (sessionId && isActive && !heartbeatIntervalRef.current) {
          heartbeatIntervalRef.current = setInterval(() => {
            sendHeartbeat(sessionId);
          }, 2 * 60 * 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, isActive]);

  // Handle beforeunload to end session
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId && isActive) {
        // Use navigator.sendBeacon for reliable cleanup
        navigator.sendBeacon('/api/users/active-count', JSON.stringify({
          sessionId,
          source: 'web',
          action: 'end'
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId, isActive]);

  return {
    sessionId,
    isActive,
  };
}