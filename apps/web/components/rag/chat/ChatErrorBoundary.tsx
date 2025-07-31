"use client";

import React from "react";
import { Home, RefreshCcwDot, RefreshCw } from "lucide-react";
import { BackgroundGradient } from "../../ui/backgrounds/background-gradient";
import { AnimatedBotIcon } from "../../ui/icons/AnimatedBotIcon";
import GlitchText from "../../ui/text-animations/glitch-text";
import { motion } from "framer-motion";

interface ChatErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ChatErrorBoundaryProps {
  children: React.ReactNode;
}

export class ChatErrorBoundary extends React.Component<ChatErrorBoundaryProps, ChatErrorBoundaryState> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChatErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ChatErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[600px] bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl border border-purple-500/20 flex items-center justify-center p-8">
          <ChatErrorFallbackWithHooks error={this.state.error} resetError={this.resetError} />
        </div>
      );
    }

    return this.props.children;
  }
}

function ChatErrorFallbackWithHooks({ error, resetError }: { error?: Error; resetError: () => void }) {
  const goHome = () => {
    window.location.href = '/';
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="max-w-md w-full">
      <BackgroundGradient
        color="red"
        containerClassName="w-full"
        tronMode={true}
        intensity="normal"
      >
        <div className="p-8 rounded-2xl shadow-2xl backdrop-blur-xl bg-gradient-to-br from-slate-800/40 via-slate-700/60 to-slate-800/40">
          {/* Custom CSS for 360 rotation */}
          <style jsx>{`
            .group:hover .group-hover\\:rotate-360 {
              transform: rotate(360deg);
            }
          `}</style>

          {/* Tron-style accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 animate-pulse"></div>

          {/* Header with Bot Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <motion.div
                className="flex justify-center items-center w-16 h-16 rounded-2xl"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <AnimatedBotIcon
                  className="w-10 h-10 text-white"
                  state="idle"
                />
              </motion.div>

              {/* Orbiting error indicators */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute w-2 h-2 bg-red-300/60 rounded-full -top-1 left-1/2 transform -translate-x-1/2 shadow-lg shadow-red-300/50" />
                <div className="absolute w-2 h-2 bg-red-400/70 rounded-full top-1/2 -right-1 transform -translate-y-1/2 shadow-lg shadow-red-400/50" />
                <div className="absolute w-2 h-2 bg-red-500/80 rounded-full -bottom-1 left-1/2 transform -translate-x-1/2 shadow-lg shadow-red-500/50" />
                <div className="absolute w-2 h-2 bg-red-600/90 rounded-full top-1/2 -left-1 transform -translate-y-1/2 shadow-lg shadow-red-600/50" />
              </motion.div>

              {/* Inner pulsing ring */}
              <motion.div
                className="absolute inset-2 border border-red-400/40 rounded-xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.0, 0.9, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Glitch Text Title */}
            <div className="mb-4">
              <GlitchText
                className="text-2xl font-bold text-red-100"
                speed={0.8}
                enableShadows={true}
                isInView={true}
                backgroundColor="rgb(30 41 59 / 0.8)"
              >
                Chat Error
              </GlitchText>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed text-center">
              Something went wrong with the RAG chat interface. This might be due to a connection issue or a problem loading your documents.
            </p>
          </div>

          {/* Error Details (in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-red-700/30 text-left">
              <h3 className="text-sm font-medium text-red-300 mb-2 flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400/20 rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                </div>
                Error Details
              </h3>
              <div className="bg-slate-900/50 rounded p-3 border border-red-600/20">
                <p className="text-xs text-slate-300 font-mono break-all">
                  {error.message || 'Unknown error occurred'}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="subtle">
              <button
                onClick={resetError}
                className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-slate-800/30 via-slate-700/40 to-slate-800/30 backdrop-blur-md rounded-2xl border border-cyan-500/20 hover:border-cyan-400/40 hover:from-slate-700/40 hover:via-slate-600/50 hover:to-slate-700/40 text-white transition-all duration-300 hover:scale-[1.02] font-medium"
              >
                <RefreshCcwDot className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180" />
                Try Again
              </button>
            </BackgroundGradient>

            <BackgroundGradient color="white" containerClassName="w-full" tronMode={true} intensity="subtle">
              <button
                onClick={reloadPage}
                className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-slate-800/30 via-slate-700/40 to-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-500/20 hover:border-slate-400/40 hover:from-slate-700/40 hover:via-slate-600/50 hover:to-slate-700/40 text-white transition-all duration-300 hover:scale-[1.02] font-medium"
              >
                <RefreshCw className="w-5 h-5 transition-transform duration-500 group-hover:rotate-360" />
                Reload Page
              </button>
            </BackgroundGradient>

            <BackgroundGradient color="purple" containerClassName="w-full" tronMode={true} intensity="subtle">
              <button
                onClick={goHome}
                className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-slate-800/30 via-slate-700/40 to-slate-800/30 backdrop-blur-md rounded-2xl border border-purple-500/20 hover:border-purple-400/40 hover:from-slate-700/40 hover:via-slate-600/50 hover:to-slate-700/40 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 font-medium"
              >
                <Home className="w-5 h-5 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] group-hover:text-purple-300" />
                Go Home
              </button>
            </BackgroundGradient>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              Try refreshing the page or go home to start over.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-red-600/60">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span>Component Error Boundary</span>
            </div>
          </div>
        </div>
      </BackgroundGradient>
    </div>
  );
}