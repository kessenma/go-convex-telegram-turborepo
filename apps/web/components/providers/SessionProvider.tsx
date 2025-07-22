"use client";

import { useEffect, useState } from "react";
import { useUserSession } from "../../hooks/use-user-session";

/**
 * Client component that manages user sessions
 * This component should be included in the root layout to ensure
 * user sessions are tracked on every page
 * Only tracks users who have consented to cookies
 */
export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  // Check for cookie consent
  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    setHasConsented(consent === "true");
  }, []);

  // Only initialize user session tracking if user has consented
  const shouldTrack = hasConsented === true;
  const { sessionId, isActive } = useUserSession(shouldTrack);

  // Optional: You can expose session info via context if needed
  // For now, we just need the hook to run

  return <>{children}</>;
}
