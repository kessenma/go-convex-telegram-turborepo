"use client";

import { motion, AnimatePresence } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { BackgroundGradient } from "../backgrounds/background-gradient";
import { TextShimmer } from "../text-animations/text-shimmer";
import DecryptedText from "../text-animations/decrypted-text";

interface TitleGenerationLoaderProps {
  isVisible: boolean;
  message?: string;
  progress?: number; // 0-100
  estimatedTime?: number; // in seconds
  generatedTitle?: string; // The final title that will be displayed with the DecryptedText effect
  titleGenerated?: boolean; // Whether the title has been generated
}

export function TitleGenerationLoader({
  isVisible,
  message = "Generating conversation title",
  progress = 50,
  estimatedTime = 3,
  generatedTitle = "",
  titleGenerated = false,
}: TitleGenerationLoaderProps): React.ReactElement | null {
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
    }
  }, [progress]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="mx-auto w-full max-w-sm mb-4"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <BackgroundGradient 
          color="cyan" 
          containerClassName="w-full"
        >
          <div className="p-4 rounded-2xl border border-purple-400/20 shadow-2xl backdrop-blur-xl bg-slate-800/80 shadow-purple-400/10">
            {/* Accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 animate-pulse rounded-t-2xl bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-60"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-3 items-center">

                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {titleGenerated ? (
                      <motion.div
                        key="title-reveal"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="mb-1"
                      >
                        <h3 className="text-sm font-semibold text-purple-100">Title Generated</h3>
                        <DecryptedText
                          text={generatedTitle}
                          speed={30}
                          maxIterations={15}
                          sequential={true}
                          className="text-purple-100 font-medium"
                          encryptedClassName="text-purple-300/70"
                          animateOn="view"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="title-generating"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                      >
                        <TextShimmer
                          className="text-sm font-semibold text-purple-100 mb-1"
                          duration={2}
                        >
                          {message}
                        </TextShimmer>
                        <p className="text-xs text-purple-300/70">
                          Creating a meaningful title...
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Time display */}
              <div className="text-right">
                <div className="px-2 py-1 text-xs font-medium text-purple-200 rounded border bg-slate-700/50 border-purple-500/20">
                  {formatTime(elapsedTime)}
                </div>
                {estimatedTime && !titleGenerated && (
                  <div className="mt-1 text-xs text-purple-300/60">
                    ~{formatTime(estimatedTime)}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar - only show when title is being generated */}
            {!titleGenerated && (
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-purple-200">Progress</span>
                  <span className="px-2 py-0.5 text-xs font-medium text-purple-200 rounded border bg-slate-700/50 border-purple-500/20">
                    {Math.round(animatedProgress)}%
                  </span>
                </div>

                <div className="relative">
                  <div className="overflow-hidden w-full h-2 rounded-full border bg-slate-700/50 border-slate-600/30">
                    <motion.div
                      className="relative h-full bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${animatedProgress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent via-white/40"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />

                      {/* Glowing edge effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 rounded-full shadow-lg shadow-purple-500/30" />
                    </motion.div>
                  </div>
                </div>
              </div>
            )}

            {/* Status indicator */}
            <div className="flex justify-center items-center">
              <AnimatePresence mode="wait">
                {titleGenerated ? (
                  <motion.div
                    key="status-complete"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="flex gap-1 items-center px-3 py-1 text-xs font-medium text-green-200 rounded-full border bg-slate-700/50 border-green-500/20"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    Title generation complete
                  </motion.div>
                ) : (
                  <motion.div
                    key="status-analyzing"
                    className="flex gap-1 items-center px-3 py-1 text-xs font-medium text-purple-200 rounded-full border bg-slate-700/50 border-purple-500/20"
                    animate={{ opacity: 0.7 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    Analyzing conversation context
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </BackgroundGradient>
      </motion.div>
    </AnimatePresence>
  );
}