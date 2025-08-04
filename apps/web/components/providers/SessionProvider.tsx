"use client";

import { useEffect, useState } from "react";
import { usePresence } from "../../hooks/use-presence";

/**
 * Client component that manages user presence
 * This component should be included in the root layout to ensure
 * user presence is tracked on every page
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

  // Only initialize user presence tracking if user has consented
  const shouldTrack = hasConsented === true;
  const { userId, isActive } = usePresence(shouldTrack);

  // Optional: You can expose presence info via context if needed
  // For now, we just need the hook to run

  return <>{children}</>;
}
