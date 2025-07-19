"use client";

import { useState, useEffect, useCallback } from "react";
import { getCookie } from "../lib/utils";

export function useAnimationSettings() {
  const [animationLightMode, setAnimationLightMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  // Check for cookie consent
  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    setHasConsented(consent === 'true');
  }, []);

  // Stable function to check and update cookie value
  const checkCookieValue = useCallback(() => {
    // Only access cookies if user has consented
    if (hasConsented !== true) {
      setAnimationLightMode(false); // Default to full animations
      return false;
    }
    
    const savedSetting = getCookie('animationLightMode');
    const currentValue = savedSetting === 'true';
    setAnimationLightMode(currentValue);
    return currentValue;
  }, [hasConsented]);

  // Initial load
  useEffect(() => {
    if (hasConsented !== null) {
      checkCookieValue();
      setIsLoaded(true);
    }
  }, [checkCookieValue, hasConsented]);

  // Listen for storage events (when cookies change in other tabs/components)
  useEffect(() => {
    if (hasConsented !== true) return;
    
    const handleStorageChange = () => {
      checkCookieValue();
    };

    // Listen for custom events when cookies are updated
    window.addEventListener('animationSettingsChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('animationSettingsChanged', handleStorageChange);
    };
  }, [checkCookieValue, hasConsented]);

  const animationEnabled = !animationLightMode;

  return {
    animationLightMode,
    animationEnabled,
    isLoaded
  };
}
