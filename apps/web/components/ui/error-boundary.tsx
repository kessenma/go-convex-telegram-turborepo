"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="pt-20 pb-8 min-h-screen">
      <div className="px-4 mx-auto max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 text-red-500">⚠️</div>
            <h2 className="text-xl font-semibold text-red-400 mb-2">Something went wrong</h2>
            <p className="text-slate-500 text-sm mb-4">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <div className="space-x-4">
              <button
                onClick={resetError}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}