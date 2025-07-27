import React, { useEffect, useState } from 'react';
import { useUserSession } from '../hooks/use-user-session';
import { MMKV } from 'react-native-mmkv';

// Create MMKV storage instance
const storage = new MMKV();

/**
 * Client component that manages user sessions for React Native
 * This component should be included in the root App component to ensure
 * user sessions are tracked on every screen
 * Only tracks users who have consented to data collection
 */
export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  // Check for data collection consent using MMKV
  useEffect(() => {
    try {
      const consent = storage.getString('data-consent');
      setHasConsented(consent === 'true');
    } catch (error) {
      console.error('Error checking consent:', error);
      setHasConsented(false);
    }
  }, []);

  // Only initialize user session tracking if user has consented
  const shouldTrack = hasConsented === true;
  const { sessionId, isActive } = useUserSession(shouldTrack);

  // Optional: You can expose session info via context if needed
  // For now, we just need the hook to run

  return <>{children}</>;
}