"use client";

import { motion, AnimatePresence } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import { BackgroundGradient } from "../backgrounds/background-gradient";

interface BauhausLoaderProps {
  isVisible: boolean;
  message?: string;
  progress?: number; // 0-100, if provided shows progress bar
  variant?: "thinking" | "processing" | "generating";
}

export function BauhausLoader({
  isVisible,
  message = "Thinking",
  progress,
  variant = "thinking",
}: BauhausLoaderProps): React.ReactElement {
  const [dots, setDots] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  // Animated dots for message
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return "";
        return prev + "•";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Simulate processing steps if no progress provided
  useEffect(() => {
    if (!isVisible || progress !== undefined) return;

    const steps = [
      "Analyzing context",
      "Processing documents",
      "Generating response",
      "Finalizing output"
    ];

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [isVisible, progress]);

  const getVariantConfig = () => {
    switch (variant) {
      case "processing":
        return {
          primaryColor: "#06B6D4", // cyan-500
          secondaryColor: "#0891B2", // cyan-600
          accentColor: "#22D3EE", // cyan-400
          gradientColor: "cyan",
        };
      case "generating":
        return {
          primaryColor: "#10B981", // emerald-500
          secondaryColor: "#059669", // emerald-600
          accentColor: "#34D399", // emerald-400
          gradientColor: "green",
        };
      default: // thinking
        return {
          primaryColor: "#8B5CF6", // violet-500
          secondaryColor: "#7C3AED", // violet-600
          accentColor: "#A78BFA", // violet-400
          gradientColor: "purple",
        };
    }
  };

  const config = getVariantConfig();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-start gap-4"
        >
          <BackgroundGradient color={config.gradientColor as any} containerClassName="p-0">
            <div className="flex items-start gap-4 p-5 bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-600/30">
              {/* Tron-inspired geometric loader */}
              <div className="relative flex-shrink-0">
                {/* Main rotating hexagon */}
                <motion.div
                  className="w-10 h-10 rounded-xl border-2 flex items-center justify-center"
                  style={{
                    borderColor: config.primaryColor,
                    backgroundColor: `${config.primaryColor}20`,
                  }}
                  animate={{
                    rotate: [0, 120, 240, 360],
                    scale: [1, 1.05, 1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {/* Inner core */}
                  <motion.div
                    className="w-4 h-4 rounded-lg"
                    style={{ backgroundColor: config.primaryColor }}
                    animate={{
                      opacity: [0.6, 1, 0.6],
                      scale: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>

                {/* Orbiting circuit nodes */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <div
                    className="absolute w-2 h-2 rounded-full -top-1 left-1/2 transform -translate-x-1/2 shadow-lg"
                    style={{
                      backgroundColor: config.accentColor,
                      boxShadow: `0 0 8px ${config.accentColor}50`,
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 rounded-full top-1/2 -right-1 transform -translate-y-1/2 shadow-lg"
                    style={{
                      backgroundColor: config.accentColor,
                      boxShadow: `0 0 8px ${config.accentColor}50`,
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 rounded-full -bottom-1 left-1/2 transform -translate-x-1/2 shadow-lg"
                    style={{
                      backgroundColor: config.accentColor,
                      boxShadow: `0 0 8px ${config.accentColor}50`,
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 rounded-full top-1/2 -left-1 transform -translate-y-1/2 shadow-lg"
                    style={{
                      backgroundColor: config.accentColor,
                      boxShadow: `0 0 8px ${config.accentColor}50`,
                    }}
                  />
                </motion.div>

                {/* Pulsing outer ring */}
                <motion.div
                  className="absolute inset-0 rounded-xl border"
                  style={{ borderColor: `${config.accentColor}40` }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Inner diamond */}
                <motion.div
                  className="absolute inset-3 flex items-center justify-center"
                  animate={{ rotate: [0, -90, -180, -270, -360] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                >
                  <div
                    className="w-2 h-2 rotate-45 border"
                    style={{ borderColor: config.secondaryColor }}
                  />
                </motion.div>
              </div>

              {/* Tron-style text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: config.primaryColor }}
                  >
                    {message}{dots}
                  </span>
                </div>

                {/* Progress bar or step indicator */}
                {progress !== undefined ? (
                  <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden border border-slate-600/30">
                    <motion.div
                      className="h-full rounded-full relative"
                      style={{ backgroundColor: config.primaryColor }}
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="text-xs text-slate-300 bg-slate-700/30 px-2 py-1 rounded border border-slate-600/30"
                  >
                    {variant === "thinking" && "Analyzing your question"}
                    {variant === "processing" && "Processing document context"}
                    {variant === "generating" && "Crafting response"}
                  </motion.div>
                )}
              </div>

              {/* Circuit-style pulse indicator */}
              <div className="flex-shrink-0 flex items-center">
                <motion.div
                  className="w-3 h-3 rounded-full border-2"
                  style={{
                    borderColor: config.accentColor,
                    backgroundColor: `${config.accentColor}20`,
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <motion.div
                    className="w-1 h-1 rounded-full mx-auto mt-0.5"
                    style={{ backgroundColor: config.accentColor }}
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </BackgroundGradient>
        </motion.div>
      )}
    </AnimatePresence>
  );
}