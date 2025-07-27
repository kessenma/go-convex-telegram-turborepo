import { useEffect, useRef, useState } from 'react';
import { MMKV } from 'react-native-mmkv';
import { useMutation } from 'convex/react';
import { api } from '../generated-convex';

// Create MMKV storage instance
const storage = new MMKV();

/**
 * Hook to manage user sessions for tracking active users in React Native
 * Automatically creates and maintains a session when the user visits the app
 * Uses MMKV to cache session data and prevent excessive API calls
 * @param enabled - Whether to enable session tracking (defaults to true)
 */
export function useUserSession(enabled: boolean = true) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCreatedRef = useRef(false);
  const lastHeartbeatRef = useRef<number>(0);

  // Convex mutations
  const upsertSession = useMutation(api.userSessions.upsertSession);
  const heartbeat = useMutation(api.userSessions.heartbeat);
  const endSession = useMutation(api.userSessions.endSession);

  // MMKV utilities
  const setStorageItem = (key: string, value: string) => {
    try {
      storage.set(key, value);
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
    }
  };

  const getStorageItem = (key: string): string | null => {
    try {
      return storage.getString(key) || null;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  };

  const removeStorageItem = (key: string) => {
    try {
      storage.delete(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  };

  // Generate a unique session ID
  const generateSessionId = () => {
    return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get or create session ID from storage
  const getOrCreateSessionId = (): string => {
    const existingSessionId = getStorageItem('user-session-id');
    const lastActivity = getStorageItem('user-session-activity');
    
    // Check if existing session is still valid (within 3 minutes)
    if (existingSessionId && lastActivity) {
      const lastActivityTime = parseInt(lastActivity, 10);
      const now = Date.now();
      const sessionTimeout = 3 * 60 * 1000; // 3 minutes
      
      if (now - lastActivityTime < sessionTimeout) {
        // Update activity timestamp
        setStorageItem('user-session-activity', now.toString());
        return existingSessionId;
      }
    }
    
    // Create new session
    const newSessionId = generateSessionId();
    setStorageItem('user-session-id', newSessionId);
    setStorageItem('user-session-activity', Date.now().toString());
    return newSessionId;
  };

  // Create or update session
  const createSession = async (sessionId: string) => {
    try {
      const userAgent = 'React Native Mobile App';
      
      await upsertSession({
        sessionId,
        userAgent,
        source: 'mobile',
        metadata: JSON.stringify({
          platform: 'react-native',
          timestamp: Date.now(),
        }),
      });
      
      setIsActive(true);
      sessionCreatedRef.current = true;
      
      // Update storage with successful session creation
      setStorageItem('user-session-activity', Date.now().toString());
      
      console.log('Mobile session created successfully:', sessionId);
    } catch (error) {
      console.error('Failed to create mobile session:', error);
      setIsActive(false);
    }
  };

  // Send heartbeat to keep session alive
  const sendHeartbeat = async (sessionId: string) => {
    const now = Date.now();
    
    // Throttle heartbeats to once per 30 seconds
    if (now - lastHeartbeatRef.current < 30000) {
      return;
    }
    
    try {
      const success = await heartbeat({ sessionId });
      if (success) {
        lastHeartbeatRef.current = now;
        setStorageItem('user-session-activity', now.toString());
      }
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  };

  // End session
  const terminateSession = async (sessionId: string) => {
    try {
      await endSession({ sessionId });
      setIsActive(false);
      sessionCreatedRef.current = false;
      
      // Clean up storage
      removeStorageItem('user-session-id');
      removeStorageItem('user-session-activity');
      
      console.log('Mobile session ended:', sessionId);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  // Initialize session when enabled
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const currentSessionId = getOrCreateSessionId();
    setSessionId(currentSessionId);

    // Create session if not already created
    if (!sessionCreatedRef.current) {
      createSession(currentSessionId);
    }

    // Set up heartbeat interval (every 60 seconds)
    heartbeatIntervalRef.current = setInterval(() => {
      if (sessionCreatedRef.current) {
        sendHeartbeat(currentSessionId);
      }
    }, 60000);

    // Cleanup function
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [enabled]);

  // Handle app state changes (when app goes to background/foreground)
  useEffect(() => {
    if (!enabled || !sessionId) {
      return;
    }

    // Note: In a real React Native app, you might want to listen to AppState changes
    // and end the session when the app goes to background for an extended period
    
    return () => {
      // End session on unmount
      if (sessionId && sessionCreatedRef.current) {
        terminateSession(sessionId);
      }
    };
  }, [enabled, sessionId]);

  return {
    sessionId,
    isActive,
    createSession: () => sessionId && createSession(sessionId),
    endSession: () => sessionId && terminateSession(sessionId),
  };
}