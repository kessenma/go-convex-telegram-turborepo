"use client";

import { motion, AnimatePresence } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { BackgroundGradient } from "../backgrounds/background-gradient";
import { LoadingCube } from "../loading-cube";
import { AnimatedBotIcon } from "../icons/AnimatedBotIcon";

interface AISDKProgressLoaderProps {
  isVisible: boolean;
  message?: string;
  steps?: string[];
  currentStep?: number;
  progress?: number; // 0-100
  estimatedTime?: number; // in seconds
  chatMode?: 'general' | 'rag'; // New prop to determine chat mode
}

export function AISDKProgressLoader({
  isVisible,
  message = "Processing",
  steps = ["Analyzing query", "Connecting to LLM", "Generating response", "Finalizing"],
  currentStep = 0,
  progress,
  estimatedTime,
  chatMode = 'general',
}: AISDKProgressLoaderProps): React.ReactElement | null {
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

  // Get default steps based on chat mode
  const getDefaultSteps = () => {
    if (chatMode === 'general') {
      return ["Processing query", "Connecting to LLM", "Generating response", "Finalizing"];
    } else {
      return ["Analyzing documents", "Connecting to LLM", "Generating response", "Finalizing"];
    }
  };

  // Use provided steps or default based on chat mode
  const displaySteps = steps.length === 4 && steps[0] === "Analyzing query" ? getDefaultSteps() : steps;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };



  if (!isVisible) return null;
  
  const getBorderClass = () => {
    switch (currentStep) {
      case 0: return "border-cyan-400/20 shadow-cyan-400/10";
      case 1: return "border-cyan-400/30 shadow-cyan-400/15";
      case 2: return "border-cyan-500/40 shadow-cyan-500/20";
      case 3: return "border-cyan-500/50 shadow-cyan-500/25";
      default: return "border-cyan-400/20 shadow-cyan-400/10";
    }
  };

  const getAccentLineClass = () => {
    switch (currentStep) {
      case 0: return "bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50";
      case 1: return "bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60";
      case 2: return "bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-70";
      case 3: return "bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80";
      default: return "bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50";
    }
  };

  const getBackgroundGradientColor = (): "cyan" | "white" => {
    // Use cyan for active steps, white for subtle variation
    return currentStep >= 2 ? "cyan" : "cyan";
  };

  const getBotIconState = (): "analyzing" | "processing" | "generating" | "finalizing" | "idle" => {
    switch (currentStep) {
      case 0: return "analyzing";
      case 1: return "processing";
      case 2: return "generating";
      case 3: return "finalizing";
      default: return "idle";
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <BackgroundGradient 
        color={getBackgroundGradientColor()} 
        containerClassName="w-full"
      >
        <div className={`p-6 rounded-3xl border shadow-2xl backdrop-blur-xl bg-slate-800/80 ${getBorderClass()}`}>
          {/* Tron-style accent line that changes color based on step */}
          <div className={`absolute top-0 left-0 right-0 h-0.5 animate-pulse rounded-t-3xl ${getAccentLineClass()}`}></div>

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 items-center">
              {/* Combined Loading Elements */}
               <div className="relative flex gap-3 items-center">
                 {/* Animated Bot Icon */}
                 <motion.div
                   className="flex justify-center items-center w-8 h-8"
                   animate={{
                     scale: [1, 1.1, 1],
                   }}
                   transition={{
                     scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                   }}
                 >
                   <AnimatedBotIcon 
                     className="w-full h-full text-cyan-400"
                     state={getBotIconState()}
                   />
                 </motion.div>

                 {/* 3D Loading Cube with phase-based colors */}
                 <div className="relative">
                   <motion.div
                     className="flex justify-center items-center"
                     animate={{
                       scale: [1, 1.05, 1],
                     }}
                     transition={{
                       scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                     }}
                   >
                     <LoadingCube 
                       size="lg"
                       phase={getBotIconState()}
                       errorMode={false}
                     />
                   </motion.div>

                   {/* Orbiting circuit elements around the loading cube */}
                   <motion.div
                     className="absolute inset-0 w-24 h-24 -m-6"
                     animate={{ rotate: -360 }}
                     transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                   >
                     {/* Top dot */}
                     <div className={`absolute w-2 h-2 rounded-full top-0 left-1/2 transform -translate-x-1/2 shadow-lg ${
                       currentStep === 0 ? "bg-cyan-300/60 shadow-cyan-300/50" :
                       currentStep === 1 ? "bg-cyan-400/70 shadow-cyan-400/50" :
                       currentStep === 2 ? "bg-cyan-500/80 shadow-cyan-500/50" :
                       currentStep === 3 ? "bg-cyan-600/90 shadow-cyan-600/50" :
                       "bg-cyan-400 shadow-cyan-400/50"
                     }`} />
                     {/* Right dot */}
                     <div className={`absolute w-2 h-2 rounded-full top-1/2 right-0 transform -translate-y-1/2 shadow-lg ${
                       currentStep === 0 ? "bg-slate-400/60 shadow-slate-400/50" :
                       currentStep === 1 ? "bg-cyan-300/70 shadow-cyan-300/50" :
                       currentStep === 2 ? "bg-cyan-400/80 shadow-cyan-400/50" :
                       currentStep === 3 ? "bg-cyan-500/90 shadow-cyan-500/50" :
                       "bg-cyan-400 shadow-cyan-400/50"
                     }`} />
                     {/* Bottom dot */}
                     <div className={`absolute w-2 h-2 rounded-full bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg ${
                       currentStep === 0 ? "bg-slate-300/60 shadow-slate-300/50" :
                       currentStep === 1 ? "bg-slate-400/70 shadow-slate-400/50" :
                       currentStep === 2 ? "bg-cyan-300/80 shadow-cyan-300/50" :
                       currentStep === 3 ? "bg-cyan-400/90 shadow-cyan-400/50" :
                       "bg-slate-400 shadow-slate-400/50"
                     }`} />
                     {/* Left dot */}
                     <div className={`absolute w-2 h-2 rounded-full top-1/2 left-0 transform -translate-y-1/2 shadow-lg ${
                       currentStep === 0 ? "bg-slate-500/60 shadow-slate-500/50" :
                       currentStep === 1 ? "bg-slate-300/70 shadow-slate-300/50" :
                       currentStep === 2 ? "bg-slate-400/80 shadow-slate-400/50" :
                       currentStep === 3 ? "bg-cyan-300/90 shadow-cyan-300/50" :
                       "bg-slate-400 shadow-slate-400/50"
                     }`} />
                   </motion.div>

                   {/* Outer pulsing ring around the loading cube */}
                   <motion.div
                     className={`absolute inset-0 w-28 h-28 -m-8 border rounded-full ${
                       currentStep === 0 ? "border-cyan-400/20" :
                       currentStep === 1 ? "border-cyan-400/40" :
                       currentStep === 2 ? "border-cyan-500/60" :
                       currentStep === 3 ? "border-cyan-500/80" :
                       "border-cyan-400/30"
                     }`}
                     animate={{
                       scale: [1, 1.1, 1],
                       opacity: [0.3, 0.6, 0.3],
                     }}
                     transition={{
                       duration: 3,
                       repeat: Infinity,
                       ease: "easeInOut",
                     }}
                   />
                 </div>
               </div>

               <div>
                 <h3 className="text-lg font-semibold text-cyan-100">{message}</h3>
                 <p className="text-sm text-cyan-300/70">
                   {displaySteps[currentStep] || "Processing..."}
                 </p>
               </div>
             </div>

             {/* Time display with Tron styling */}
             <div className="text-right">
               <div className="px-3 py-1 text-sm font-medium text-cyan-200 rounded-lg border bg-slate-700/50 border-cyan-500/20">
                 {formatTime(elapsedTime)}
               </div>
               {estimatedTime && (
                 <div className="mt-1 text-xs text-cyan-300/60">
                   ~{formatTime(estimatedTime)} total
                 </div>
               )}
             </div>
           </div>

              {/* Tron-style progress bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-cyan-200">Progress</span>
                  <span className="px-2 py-1 text-sm font-medium text-cyan-200 rounded border bg-slate-700/50 border-cyan-500/20">
                    {Math.round(animatedProgress)}%
                  </span>
                </div>

                <div className="relative">
                  <div className="overflow-hidden w-full h-4 rounded-full border bg-slate-700/50 border-slate-600/30">
                    <motion.div
                      className="relative h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${animatedProgress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      {/* Tron-style shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent via-white/40"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />

                      {/* Glowing edge effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full shadow-lg shadow-cyan-500/30" />
                    </motion.div>
                  </div>

                  {/* Circuit-like progress indicators */}
                  <div className="flex absolute right-0 left-0 -top-1 -bottom-1 justify-between items-center pointer-events-none">
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
                  {displaySteps.map((step, index) => (
                    <div key={index} className="flex relative flex-col flex-1 items-center">
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
                      {index < displaySteps.length - 1 && (
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
    </div>
  );
}
