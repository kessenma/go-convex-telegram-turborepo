"use client";

import { useState, useEffect, useCallback } from "react";

interface LLMProgressState {
  isProcessing: boolean;
  currentStep: number;
  progress: number;
  message: string;
  estimatedTime?: number;
  error?: string;
}

const PROCESSING_STEPS = [
  "Analyzing context",
  "Processing documents", 
  "Generating response",
  "Finalizing output"
];

export function useLLMProgress() {
  const [state, setState] = useState<LLMProgressState>({
    isProcessing: false,
    currentStep: 0,
    progress: 0,
    message: "Ready",
  });

  // Simulate progress tracking for LLM processing
  const startProcessing = useCallback((estimatedTime?: number) => {
    setState({
      isProcessing: true,
      currentStep: 0,
      progress: 0,
      message: "Starting analysis",
      estimatedTime,
    });

    // Simulate step progression
    let currentStep = 0;
    const stepDuration = (estimatedTime || 10) / PROCESSING_STEPS.length * 1000;
    
    const progressInterval = setInterval(() => {
      setState(prev => {
        if (!prev.isProcessing) {
          clearInterval(progressInterval);
          return prev;
        }

        const newProgress = Math.min(
          ((currentStep + 1) / PROCESSING_STEPS.length) * 100,
          95 // Never reach 100% until completion
        );

        return {
          ...prev,
          currentStep,
          progress: newProgress,
          message: PROCESSING_STEPS[currentStep] || "Processing",
        };
      });

      currentStep++;
      if (currentStep >= PROCESSING_STEPS.length) {
        clearInterval(progressInterval);
      }
    }, stepDuration);

    return () => clearInterval(progressInterval);
  }, []);

  const completeProcessing = useCallback(() => {
    setState(prev => ({
      ...prev,
      isProcessing: false,
      currentStep: PROCESSING_STEPS.length - 1,
      progress: 100,
      message: "Complete",
    }));

    // Reset after a brief delay
    setTimeout(() => {
      setState({
        isProcessing: false,
        currentStep: 0,
        progress: 0,
        message: "Ready",
      });
    }, 1000);
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      isProcessing: false,
      error,
      message: "Error occurred",
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      currentStep: 0,
      progress: 0,
      message: "Ready",
    });
  }, []);

  // Auto-reset error after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timeout = setTimeout(reset, 5000);
      return () => clearTimeout(timeout);
    }
  }, [state.error, reset]);

  return {
    ...state,
    steps: PROCESSING_STEPS,
    startProcessing,
    completeProcessing,
    setError,
    reset,
  };
}