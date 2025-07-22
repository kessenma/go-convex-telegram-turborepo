"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console or error reporting service
    console.error("Global Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Return fallback UI or the provided fallback
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
              <p className="text-gray-400 mb-4">
                An error occurred while loading the application.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}