"use client";

import { useEffect, useState } from "react";

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

  // Note: Presence tracking is now handled directly in components that need it
  // This provider is kept for future session management features

  return <>{children}</>;
}