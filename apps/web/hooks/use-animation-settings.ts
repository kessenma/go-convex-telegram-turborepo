"use client";

import { useState, useEffect } from "react";
import { getCookie } from "../lib/utils";

export function useAnimationSettings() {
  const [animationLightMode, setAnimationLightMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedSetting = getCookie('animationLightMode');
    if (savedSetting !== null) {
      setAnimationLightMode(savedSetting === 'true');
    }
    setIsLoaded(true);
  }, []);

  // Add polling to detect cookie changes from other components
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSetting = getCookie('animationLightMode');
      const currentValue = currentSetting === 'true';
      if (currentValue !== animationLightMode) {
        setAnimationLightMode(currentValue);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [animationLightMode]);

  const animationEnabled = !animationLightMode;

  return {
    animationLightMode,
    animationEnabled,
    isLoaded
  };
}