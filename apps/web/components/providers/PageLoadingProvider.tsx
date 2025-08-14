"use client";

import { AnimatePresence } from "framer-motion";
import type React from "react";
import { useNavigationLoading } from "../../contexts/NavigationLoadingContext";
import { PageLoadingOverlay } from "../ui/loading-spinner";

export function PageLoadingProvider(): React.ReactElement {
  const { isLoading, loadingPath, hasError } = useNavigationLoading();

  // Get loading message based on the path
  const getLoadingMessage = (path: string | null): string => {
    if (!path) return "Loading...";
    
    if (path.includes("RAG")) return "Loading RAG interface...";
    if (path.includes("messages")) return "Loading messages...";
    if (path.includes("threads")) return "Loading threads...";
    if (path.includes("upload")) return "Loading upload interface...";
    if (path.includes("chat")) return "Loading chat interface...";
    if (path.includes("architecture")) return "Loading 3D architecture...";
    if (path.includes("about")) return "Loading about page...";
    if (path === "/") return "Loading dashboard...";
    
    return "Loading page...";
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <PageLoadingOverlay 
          isVisible={isLoading} 
          message={hasError ? "Error loading page..." : getLoadingMessage(loadingPath)}
          errorMode={hasError}
        />
      )}
    </AnimatePresence>
  );
}