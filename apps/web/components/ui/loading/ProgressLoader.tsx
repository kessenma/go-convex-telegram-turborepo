"use client";

import { motion, AnimatePresence } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import { BackgroundGradient } from "../backgrounds/background-gradient";

interface ProgressLoaderProps {
  isVisible: boolean;
  message?: string;
  steps?: string[];
  currentStep?: number;
  progress?: number; // 0-100
  estimatedTime?: number; // in seconds
}

export function ProgressLoader({
  isVisible,
  message = "Processing",
  steps = ["Analyzing", "Processing", "Generating", "Finalizing"],
  currentStep = 0,
  progress,
  estimatedTime,
}: ProgressLoaderProps): React.ReactElement {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Track elapsed time
  useEffect(() => {
    if (!isVisible) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Animate progress
  useEffect(() => {
    if (progress !== undefined) {
      setAnimatedProgress(progress);
    } else {
      // Simulate progress based on current step
      const stepProgress = ((currentStep + 1) / steps.length) * 100;
      setAnimatedProgress(stepProgress);
    }
  }, [progress, currentStep, steps.length]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };



  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md mx-auto"
        >
          <BackgroundGradient color="cyan" containerClassName="w-full">
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-6 shadow-2xl shadow-cyan-500/10">
              {/* Tron-style accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse rounded-t-3xl"></div>

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* Tron-inspired animated icon */}
                  <div className="relative">
                    <motion.div
                      className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center border border-cyan-400/30"
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                      }}
                    >
                      <motion.div
                        className="w-5 h-5 bg-white rounded-lg"
                        animate={{
                          opacity: [0.7, 1, 0.7],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>

                    {/* Orbiting circuit elements */}
                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="absolute w-2 h-2 bg-cyan-400 rounded-full -top-1 left-1/2 transform -translate-x-1/2 shadow-lg shadow-cyan-400/50" />
                      <div className="absolute w-2 h-2 bg-blue-400 rounded-full top-1/2 -right-1 transform -translate-y-1/2 shadow-lg shadow-blue-400/50" />
                      <div className="absolute w-2 h-2 bg-purple-400 rounded-full -bottom-1 left-1/2 transform -translate-x-1/2 shadow-lg shadow-purple-400/50" />
                      <div className="absolute w-2 h-2 bg-emerald-400 rounded-full top-1/2 -left-1 transform -translate-y-1/2 shadow-lg shadow-emerald-400/50" />
                    </motion.div>

                    {/* Inner pulsing ring */}
                    <motion.div
                      className="absolute inset-2 border border-cyan-400/30 rounded-xl"
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

                  <div>
                    <h3 className="text-cyan-100 font-semibold text-lg">{message}</h3>
                    <p className="text-cyan-300/70 text-sm">
                      {steps[currentStep] || "Processing..."}
                    </p>
                  </div>
                </div>

                {/* Time display with Tron styling */}
                <div className="text-right">
                  <div className="text-cyan-200 text-sm font-medium bg-slate-700/50 px-3 py-1 rounded-lg border border-cyan-500/20">
                    {formatTime(elapsedTime)}
                  </div>
                  {estimatedTime && (
                    <div className="text-cyan-300/60 text-xs mt-1">
                      ~{formatTime(estimatedTime)} total
                    </div>
                  )}
                </div>
              </div>

              {/* Tron-style progress bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-cyan-200 text-sm font-medium">Progress</span>
                  <span className="text-cyan-200 text-sm font-medium bg-slate-700/50 px-2 py-1 rounded border border-cyan-500/20">
                    {Math.round(animatedProgress)}%
                  </span>
                </div>

                <div className="relative">
                  <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden border border-slate-600/30">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full relative"
                      initial={{ width: "0%" }}
                      animate={{ width: `${animatedProgress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      {/* Tron-style shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />

                      {/* Glowing edge effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full shadow-lg shadow-cyan-500/30" />
                    </motion.div>
                  </div>

                  {/* Circuit-like progress indicators */}
                  <div className="absolute -top-1 -bottom-1 left-0 right-0 flex justify-between items-center pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-1 h-6 rounded-full ${(i + 1) * 20 <= animatedProgress
                          ? "bg-cyan-400 shadow-lg shadow-cyan-400/50"
                          : "bg-slate-600/50"
                          }`}
                        animate={{
                          opacity: (i + 1) * 20 <= animatedProgress ? [0.5, 1, 0.5] : 0.3,
                        }}
                        transition={{
                          duration: 1,
                          repeat: (i + 1) * 20 <= animatedProgress ? Infinity : 0,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Tron-style step indicators */}
              <div className="relative">
                <div className="flex justify-between items-center">
                  {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 relative">
                      <motion.div
                        className={`w-4 h-4 rounded-lg mb-3 border-2 ${index < currentStep
                          ? "bg-emerald-400 border-emerald-400 shadow-lg shadow-emerald-400/50"
                          : index === currentStep
                            ? "bg-cyan-400 border-cyan-400 shadow-lg shadow-cyan-400/50"
                            : "bg-slate-600/50 border-slate-500/50"
                          }`}
                        animate={{
                          scale: index === currentStep ? [1, 1.2, 1] : 1,
                          rotate: index === currentStep ? [0, 180, 360] : 0,
                        }}
                        transition={{
                          scale: {
                            duration: 1,
                            repeat: index === currentStep ? Infinity : 0,
                            ease: "easeInOut",
                          },
                          rotate: {
                            duration: 2,
                            repeat: index === currentStep ? Infinity : 0,
                            ease: "linear",
                          },
                        }}
                      />
                      <span
                        className={`text-xs text-center font-medium ${index <= currentStep ? "text-cyan-200" : "text-slate-400"
                          }`}
                      >
                        {step}
                      </span>

                      {/* Tron-style connecting lines */}
                      {index < steps.length - 1 && (
                        <div className="absolute top-2 left-1/2 w-full h-0.5 bg-slate-600/30 -z-10">
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-sm shadow-cyan-400/30"
                            initial={{ width: "0%" }}
                            animate={{
                              width: index < currentStep ? "100%" : "0%",
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </BackgroundGradient>
        </motion.div>
      )}
    </AnimatePresence>
  );
}