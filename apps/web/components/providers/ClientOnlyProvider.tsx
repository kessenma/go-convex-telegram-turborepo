"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface ClientOnlyProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnlyProvider({
  children,
  fallback = null,
}: ClientOnlyProviderProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Dynamic import for ConvexClientProvider to prevent SSR issues
export const DynamicConvexProvider = dynamic(
  () => import("../../providers/ConvexClientProvider").then((mod) => ({
    default: mod.ConvexClientProvider,
  })),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-b-2 border-white animate-spin"></div>
      </div>
    ),
  }
);

// Dynamic import for Navigation to prevent SSR issues with Convex queries
export const DynamicNavigation = dynamic(
  () => import("../topNav/Navigation"),
  {
    ssr: false,
    loading: () => (
      <nav className="h-16 border-b backdrop-blur-sm bg-slate-900/50 border-slate-800">
        <div className="flex justify-center items-center h-full">
          <div className="animate-pulse text-slate-400">Loading...</div>
        </div>
      </nav>
    ),
  }
);