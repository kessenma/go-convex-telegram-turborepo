"use client";

import { motion, AnimatePresence } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";

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

  const getStepColor = (index: number) => {
    if (index < currentStep) return "#10b981"; // completed - green
    if (index === currentStep) return "#3b82f6"; // current - blue
    return "#d1d5db"; // pending - gray
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
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Animated icon */}
                <div className="relative">
                  <motion.div
                    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    }}
                  >
                    <div className="w-4 h-4 bg-white rounded-lg" />
                  </motion.div>
                  
                  {/* Orbiting dots */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="absolute w-2 h-2 bg-yellow-400 rounded-full -top-1 left-1/2 transform -translate-x-1/2" />
                    <div className="absolute w-2 h-2 bg-pink-400 rounded-full top-1/2 -right-1 transform -translate-y-1/2" />
                    <div className="absolute w-2 h-2 bg-green-400 rounded-full -bottom-1 left-1/2 transform -translate-x-1/2" />
                  </motion.div>
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg">{message}</h3>
                  <p className="text-white/70 text-sm">
                    {steps[currentStep] || "Processing..."}
                  </p>
                </div>
              </div>

              {/* Time display */}
              <div className="text-right">
                <div className="text-white/90 text-sm font-medium">
                  {formatTime(elapsedTime)}
                </div>
                {estimatedTime && (
                  <div className="text-white/60 text-xs">
                    ~{formatTime(estimatedTime)} total
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80 text-sm font-medium">Progress</span>
                <span className="text-white/80 text-sm font-medium">
                  {Math.round(animatedProgress)}%
                </span>
              </div>
              
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full relative"
                  initial={{ width: "0%" }}
                  animate={{ width: `${animatedProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <motion.div
                    className="w-3 h-3 rounded-full mb-2"
                    style={{ backgroundColor: getStepColor(index) }}
                    animate={{
                      scale: index === currentStep ? [1, 1.3, 1] : 1,
                    }}
                    transition={{
                      duration: 1,
                      repeat: index === currentStep ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                  />
                  <span
                    className={`text-xs text-center ${
                      index <= currentStep ? "text-white" : "text-white/50"
                    }`}
                  >
                    {step}
                  </span>
                  
                  {/* Connecting line */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-6 left-1/2 w-full h-0.5 bg-white/20 -z-10">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}