"use client";

import { RefreshCw, Home } from "lucide-react";
import { renderIcon } from "../../../lib/icon-utils";
import { BackgroundGradient } from "../../ui/backgrounds/background-gradient";
import { AnimatedBotIcon } from "../../ui/icons/AnimatedBotIcon";
import GlitchText from "../../ui/text-animations/glitch-text";
import { motion } from "framer-motion";

export type ErrorType = 'network' | 'documents' | 'conversation' | 'general';

interface ChatErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  error?: Error;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  showDetails?: boolean;
}

export function ChatErrorState({
  type = 'general',
  title,
  message,
  error,
  onRetry,
  onGoHome,
  showDetails = false
}: ChatErrorStateProps) {
  const getErrorConfig = (errorType: ErrorType) => {
    switch (errorType) {
      case 'network':
        return {
          defaultTitle: 'Connection Error',
          defaultMessage: 'Unable to connect to the server. Check your connection and try again.',
          botState: 'idle' as const
        };
      case 'documents':
        return {
          defaultTitle: 'Document Loading Error',
          defaultMessage: 'Failed to load your documents. This might be a temporary issue.',
          botState: 'analyzing' as const
        };
      case 'conversation':
        return {
          defaultTitle: 'Conversation Error',
          defaultMessage: 'Unable to load conversation data. Your chat history might be unavailable.',
          botState: 'processing' as const
        };
      default:
        return {
          defaultTitle: 'System Error',
          defaultMessage: 'An unexpected error occurred. Please try again.',
          botState: 'idle' as const
        };
    }
  };

  const config = getErrorConfig(type);
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md w-full">
        <BackgroundGradient 
          color="red" 
          containerClassName="w-full"
          tronMode={true}
          intensity="normal"
        >
          <div className="p-8 rounded-2xl border border-red-500/20 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-slate-800/40 via-slate-700/60 to-slate-800/40">
            {/* Custom CSS for 360 rotation */}
            <style jsx>{`
              .group:hover .group-hover\\:rotate-360 {
                transform: rotate(360deg);
              }
            `}</style>
            
            {/* Tron-style accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-pulse rounded-t-2xl"></div>

            {/* Header with Bot Icon */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-6">
                <motion.div
                  className="flex justify-center items-center w-16 h-16 rounded-2xl border bg-gradient-to-br from-red-400 to-red-500 border-red-400/30"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                >
                  <AnimatedBotIcon 
                    className="w-10 h-10 text-white" 
                    state={config.botState}
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
                    opacity: [0.3, 0.6, 0.3],
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
                  {displayTitle}
                </GlitchText>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed text-center">
                {displayMessage}
              </p>
            </div>

            {/* Error Details (if enabled and in development) */}
            {showDetails && process.env.NODE_ENV === 'development' && error && (
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
              {onRetry && (
                <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="subtle">
                  <button
                    onClick={onRetry}
                    className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-slate-800/30 via-slate-700/40 to-slate-800/30 backdrop-blur-md rounded-2xl border border-cyan-500/20 hover:border-cyan-400/40 hover:from-slate-700/40 hover:via-slate-600/50 hover:to-slate-700/40 text-white transition-all duration-300 hover:scale-[1.02] font-medium"
                  >
                    {renderIcon(RefreshCw, { className: "w-5 h-5 transition-transform duration-500 group-hover:rotate-360" })}
                    Try Again
                  </button>
                </BackgroundGradient>
              )}
              
              <BackgroundGradient color="white" containerClassName="w-full" tronMode={true} intensity="subtle">
                <button
                  onClick={reloadPage}
                  className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-slate-800/30 via-slate-700/40 to-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-500/20 hover:border-slate-400/40 hover:from-slate-700/40 hover:via-slate-600/50 hover:to-slate-700/40 text-white transition-all duration-300 hover:scale-[1.02] font-medium"
                >
                  {renderIcon(RefreshCw, { className: "w-5 h-5 transition-transform duration-500 group-hover:rotate-360" })}
                  Reload Page
                </button>
              </BackgroundGradient>

              <BackgroundGradient color="purple" containerClassName="w-full" tronMode={true} intensity="subtle">
                <button
                  onClick={handleGoHome}
                  className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-slate-800/30 via-slate-700/40 to-slate-800/30 backdrop-blur-md rounded-2xl border border-purple-500/20 hover:border-purple-400/40 hover:from-slate-700/40 hover:via-slate-600/50 hover:to-slate-700/40 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 font-medium"
                >
                  {renderIcon(Home, { className: "w-5 h-5 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] group-hover:text-purple-300" })}
                  Go Home
                </button>
              </BackgroundGradient>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-xs text-slate-500 leading-relaxed">
                {type === 'network' && 'Check your internet connection and try refreshing the page.'}
                {type === 'documents' && 'Try refreshing the page to reload your documents.'}
                {type === 'conversation' && 'Your conversation data might be temporarily unavailable.'}
                {type === 'general' && 'If this problem persists, try refreshing the page.'}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-red-600/60">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span>System Error Detected</span>
              </div>
            </div>
          </div>
        </BackgroundGradient>
      </div>
    </div>
  );
}