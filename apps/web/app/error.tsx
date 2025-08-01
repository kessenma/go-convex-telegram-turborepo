'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Home, ArrowLeft, Copy, Check } from 'lucide-react'
import { renderIcon } from '../lib/icon-utils'
import { BackgroundGradient } from '../components/ui/backgrounds/background-gradient'
import { AnimatedBotIcon } from '../components/ui/icons/AnimatedBotIcon'
import GlitchText from '../components/ui/text-animations/glitch-text'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const goHome = () => {
    window.location.href = '/'
  }

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      goHome()
    }
  }

  const handleRetry = async () => {
    setIsRefreshing(true)
    try {
      reset()
    } finally {
      setIsRefreshing(false)
    }
  }

  const copyError = async () => {
    if (!error) return
    
    const errorText = `Error: ${error.message}\nStack: ${error.stack || 'No stack trace available'}`
    try {
      await navigator.clipboard.writeText(errorText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy error:', err)
    }
  }

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex justify-center items-center p-4 mt-20 min-h-screen">
      <div className="w-full max-w-md">
        <BackgroundGradient 
          color="red" 
          containerClassName="w-full"
          tronMode={true}
          intensity="normal"
        >
          <div className="p-8 rounded-2xl border shadow-2xl backdrop-blur-xl border-red-500/20">
            {/* Custom CSS for 360 rotation */}
            <style jsx>{`
              .group:hover .group-hover\:rotate-360 {
                transform: rotate(360deg);
              }
            `}</style>
            
            {/* Tron-style accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"></div>

            {/* Header with Bot Icon */}
            <div className="flex flex-col items-center -mt-16 -mb-10">
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
                  <div className="absolute -top-1 left-1/2 w-2 h-2 rounded-full shadow-lg transform -translate-x-1/2 bg-red-300/60 shadow-red-300/50" />
                  <div className="absolute -right-1 top-1/2 w-2 h-2 rounded-full shadow-lg transform -translate-y-1/2 bg-red-400/70 shadow-red-400/50" />
                  <div className="absolute -bottom-1 left-1/2 w-2 h-2 rounded-full shadow-lg transform -translate-x-1/2 bg-red-500/80 shadow-red-500/50" />
                  <div className="absolute -left-1 top-1/2 w-2 h-2 rounded-full shadow-lg transform -translate-y-1/2 bg-red-600/90 shadow-red-600/50" />
                </motion.div>
              </div>

          
            </div>

            {/* Error Details with Copy Button */}
            {isDev && error && (
              <div className="p-4 mb-6 rounded-lg border bg-slate-950 border-red-700/30">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="flex gap-2 items-center text-sm font-medium text-red-300">
                    <div className="flex justify-center items-center w-4 h-4 rounded bg-red-400/20">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
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
              Error Details
                </GlitchText>
              </div>
                  </h3>
                  <button
                    onClick={copyError}
                    className="flex gap-1 items-center px-2 py-1 text-xs rounded transition-colors bg-slate-700 hover:bg-slate-600"
                  >
                    {renderIcon(copied ? Check : Copy, { 
                      className: `w-3 h-3 ${copied ? 'text-green-400' : 'text-slate-400'}` 
                    })}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="p-3 rounded border bg-slate-900/50 border-red-600/20">
                  <p className="font-mono text-xs break-all text-slate-300">
                    {error.message || 'Unknown error occurred'}
                  </p>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-slate-500 hover:text-slate-400">
                        Show stack trace
                      </summary>
                      <pre className="mt-2 font-mono text-xs whitespace-pre-wrap break-all text-slate-400">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="subtle">
                <button
                  onClick={handleRetry}
                  disabled={isRefreshing}
                  className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-slate-800/30 via-slate-700/40 to-slate-800/30 backdrop-blur-md rounded-2xl border border-cyan-500/20 hover:border-cyan-400/40 hover:from-slate-700/40 hover:via-slate-600/50 hover:to-slate-700/40 text-white transition-all duration-300 hover:scale-[1.02] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {renderIcon(RefreshCw, { 
                    className: `w-5 h-5 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-360'}` 
                  })}
                  {isRefreshing ? 'Retrying...' : 'Try Again'}
                </button>
              </BackgroundGradient>
              
              <BackgroundGradient color="white" containerClassName="w-full" tronMode={true} intensity="subtle">
                <button
                  onClick={goBack}
                  className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-slate-800/30 via-slate-700/40 to-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-500/20 hover:border-slate-400/40 hover:from-slate-700/40 hover:via-slate-600/50 hover:to-slate-700/40 text-white transition-all duration-300 hover:scale-[1.02] font-medium"
                >
                  {renderIcon(ArrowLeft, { 
                    className: "w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" 
                  })}
                  Go Back
                </button>
              </BackgroundGradient>

              <BackgroundGradient color="purple" containerClassName="w-full" tronMode={true} intensity="subtle">
                <button
                  onClick={goHome}
                  className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-slate-800/30 via-slate-700/40 to-slate-800/30 backdrop-blur-md rounded-2xl border border-purple-500/20 hover:border-purple-400/40 hover:from-slate-700/40 hover:via-slate-600/50 hover:to-slate-700/40 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 font-medium"
                >
                  {renderIcon(Home, { 
                    className: "w-5 h-5 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] group-hover:text-purple-300" 
                  })}
                  Go Home
                </button>
              </BackgroundGradient>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-xs leading-relaxed text-slate-500">
                If this problem persists, please refresh the page or contact support.
              </p>
              <div className="flex gap-2 justify-center items-center mt-3 text-xs text-red-600/60">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span>System Error Detected</span>
              </div>
            </div>
          </div>
        </BackgroundGradient>
      </div>
    </div>
  )
}