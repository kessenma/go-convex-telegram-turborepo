"use client";

import { motion, AnimatePresence } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";

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
          primaryColor: "#3B82F6", // blue-500
          secondaryColor: "#1E40AF", // blue-700
          accentColor: "#60A5FA", // blue-400
        };
      case "generating":
        return {
          primaryColor: "#10B981", // emerald-500
          secondaryColor: "#047857", // emerald-700
          accentColor: "#34D399", // emerald-400
        };
      default: // thinking
        return {
          primaryColor: "#F59E0B", // amber-500
          secondaryColor: "#D97706", // amber-600
          accentColor: "#FCD34D", // amber-300
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
          className="flex items-start gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
        >
          {/* Geometric loader animation */}
          <div className="relative flex-shrink-0">
            {/* Main rotating square */}
            <motion.div
              className="w-8 h-8 rounded-lg"
              style={{ backgroundColor: config.primaryColor }}
              animate={{
                rotate: [0, 90, 180, 270, 360],
                scale: [1, 1.1, 1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Orbiting circles */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <div
                className="absolute w-2 h-2 rounded-full -top-1 left-1/2 transform -translate-x-1/2"
                style={{ backgroundColor: config.accentColor }}
              />
              <div
                className="absolute w-2 h-2 rounded-full top-1/2 -right-1 transform -translate-y-1/2"
                style={{ backgroundColor: config.accentColor }}
              />
              <div
                className="absolute w-2 h-2 rounded-full -bottom-1 left-1/2 transform -translate-x-1/2"
                style={{ backgroundColor: config.accentColor }}
              />
              <div
                className="absolute w-2 h-2 rounded-full top-1/2 -left-1 transform -translate-y-1/2"
                style={{ backgroundColor: config.accentColor }}
              />
            </motion.div>

            {/* Inner triangle */}
            <motion.div
              className="absolute inset-2 flex items-center justify-center"
              animate={{ rotate: [0, -180, -360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <div
                className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-transparent"
                style={{ borderBottomColor: config.secondaryColor }}
              />
            </motion.div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-white">
                {message}{dots}
              </span>
            </div>
            
            {/* Progress bar or step indicator */}
            {progress !== undefined ? (
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: config.primaryColor }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            ) : (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-xs text-white/70"
              >
                {variant === "thinking" && "Analyzing your question"}
                {variant === "processing" && "Processing document context"}
                {variant === "generating" && "Crafting response"}
              </motion.div>
            )}
          </div>

          {/* Pulse indicator */}
          <div className="flex-shrink-0 flex items-center">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: config.accentColor }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}