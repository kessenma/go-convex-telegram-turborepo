"use client";

import { useUserSession } from '../hooks/use-user-session';

/**
 * Client component that manages user sessions
 * This component should be included in the root layout to ensure
 * user sessions are tracked on every page
 */
export function SessionProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  // Initialize user session tracking
  const { sessionId, isActive } = useUserSession();

  // Optional: You can expose session info via context if needed
  // For now, we just need the hook to run

  return <>{children}</>;
}