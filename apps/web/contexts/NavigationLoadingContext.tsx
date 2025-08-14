"use client";

import { usePathname } from "next/navigation";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface NavigationLoadingContextType {
  isLoading: boolean;
  loadingPath: string | null;
  hasError: boolean;
  startLoading: (path: string) => void;
  stopLoading: () => void;
  setError: (error: boolean) => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType | undefined>(undefined);

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const pathname = usePathname();

  const startLoading = (path: string) => {
    setIsLoading(true);
    setLoadingPath(path);
    setHasError(false); // Reset error state when starting new navigation
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadingPath(null);
    setHasError(false);
  };

  const setError = (error: boolean) => {
    setHasError(error);
  };

  // Auto-stop loading when pathname changes (navigation complete)
  useEffect(() => {
    if (isLoading && pathname === loadingPath) {
      // Add a small delay to ensure the page has rendered
      const timer = setTimeout(() => {
        stopLoading();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, isLoading, loadingPath]);

  return (
    <NavigationLoadingContext.Provider value={{ isLoading, loadingPath, hasError, startLoading, stopLoading, setError }}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);
  if (context === undefined) {
    throw new Error("useNavigationLoading must be used within a NavigationLoadingProvider");
  }
  return context;
}