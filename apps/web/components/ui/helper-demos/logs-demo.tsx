"use client";

import { motion } from "framer-motion";
import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import { CommandLine, Loading, OutputLine, Terminal } from "../terminal";

interface LogsDemoProps {
  className?: string;
  autoStart?: boolean;
  isVisible?: boolean;
}

type CommandStep = {
  type: "command";
  content: string;
  delay: number;
};

type OutputStep = {
  type: "output";
  content: string;
  delay: number;
  outputType?: "success" | "error" | "warning" | "info";
};

type LoadingStep = {
  type: "loading";
  loadingMessage: string;
  completeMessage: string;
  duration: number;
  delay: number;
};

type Step = CommandStep | OutputStep | LoadingStep;

export function LogsDemo({
  className,
  autoStart = false,
  isVisible = false,
}: LogsDemoProps) {
  const [executedSteps, setExecutedSteps] = useState<
    Array<{ type: string; content: string; outputType?: string }>
  >([]);
  const [currentStep, setCurrentStep] = useState(autoStart ? 0 : -1);
  const [isComplete, setIsComplete] = useState(false);

  const addToHistory = (step: {
    type: string;
    content: string;
    outputType?: string;
  }) => {
    setExecutedSteps((prev) => [...prev, step]);
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const startDemo = () => {
    setCurrentStep(0);
    setIsComplete(false);
    setExecutedSteps([]);
  };

  const steps: Step[] = [
    {
      type: "command",
      content: "pnpm docker:logs-all",
      delay: 0,
    },
    {
      type: "output",
      content: "📊 Collecting logs from all services...",
      delay: 800,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "",
      delay: 1000,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "🌐 Web Dashboard Logs:",
      delay: 1200,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:30:52] ▲ Next.js 14.2.5",
      delay: 1300,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:30:52] - Local:        http://localhost:3000",
      delay: 1400,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:30:53] ✓ Ready in 1.2s",
      delay: 1500,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "",
      delay: 1600,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "🗄️ Convex Backend Logs:",
      delay: 1700,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:30:45] Convex backend started on port 3210",
      delay: 1800,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:30:46] Database connection established",
      delay: 1900,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:30:47] Functions deployed successfully",
      delay: 2000,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "",
      delay: 2100,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "🧠 Vector Convert LLM Logs:",
      delay: 2200,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:30:55] Loading sentence-transformers model...",
      delay: 2300,
      outputType: "warning" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:31:12] Model loaded: all-distilroberta-v1",
      delay: 2400,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:31:13] Flask server running on port 7999",
      delay: 2500,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "",
      delay: 2600,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "🤖 Lightweight LLM Logs:",
      delay: 2700,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:31:05] Loading DistilGPT2 model...",
      delay: 2800,
      outputType: "warning" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:31:18] Model loaded successfully",
      delay: 2900,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "[2024-12-19 14:31:19] FastAPI server running on port 8082",
      delay: 3000,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "",
      delay: 3100,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "✅ All services are running healthy",
      delay: 3200,
      outputType: "success" as const,
    },
  ];

  // Auto-advance output steps after their delay + a small buffer
  React.useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      if (step && step.type === "output") {
        const timer = setTimeout(() => {
          // Add completed step to history
          addToHistory({
            type: "output",
            content: step.content,
            outputType: step.outputType,
          });
          nextStep();
        }, step.delay + 500); // Add 500ms buffer for the animation

        return () => clearTimeout(timer);
      }
    }
  }, [
    currentStep, // Add completed step to history
    addToHistory,
    nextStep,
    steps.length,
    steps[currentStep],
  ]);

  const renderStep = (step: Step, index: number) => {
    if (index > currentStep) return null;

    const handleStepComplete = () => {
      if (step.type === "command") {
        addToHistory({ type: "command", content: step.content });
      } else if (step.type === "loading") {
        addToHistory({
          type: "output",
          content: `✅ ${step.completeMessage}`,
          outputType: "success",
        });
      }
      nextStep();
    };

    switch (step.type) {
      case "command":
        return (
          <CommandLine
            key={index}
            command={step.content}
            delay={step.delay}
            onComplete={handleStepComplete}
          />
        );

      case "output":
        return (
          <OutputLine key={index} delay={step.delay} type={step.outputType}>
            {step.content}
          </OutputLine>
        );

      case "loading":
        return (
          <div key={index} className="ml-4 mb-2">
            <Loading
              loadingMessage={step.loadingMessage}
              completeMessage={step.completeMessage}
              duration={step.duration}
              delay={step.delay}
              onComplete={handleStepComplete}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Auto-start when visible
  React.useEffect(() => {
    if (isVisible && currentStep === -1) {
      setTimeout(() => startDemo(), 500); // Small delay for smooth transition
    }
  }, [isVisible, currentStep, startDemo]);

  React.useEffect(() => {
    if (currentStep >= steps.length - 1 && currentStep !== -1) {
      setTimeout(() => setIsComplete(true), 2000);
    }
  }, [currentStep, steps.length]);

  return (
    <div className={className}>
      <Terminal className="w-full">
        {currentStep === -1 ? (
          <div className="text-center py-8">
            <motion.button
              onClick={startDemo}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📊 View All Logs
            </motion.button>
            <p className="text-gray-400 text-xs mt-2">
              Monitor all Docker container logs in one command
            </p>
          </div>
        ) : (
          <div>
            {/* Show completed steps in history */}
            {executedSteps.map((step, index) => (
              <div key={`history-${index}`} className="mb-1">
                {step.type === "command" ? (
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-400 shrink-0">$</span>
                    <span className="text-white">{step.content}</span>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "ml-4",
                      step.outputType === "success"
                        ? "text-green-400"
                        : step.outputType === "error"
                          ? "text-red-400"
                          : step.outputType === "warning"
                            ? "text-yellow-400"
                            : "text-blue-400"
                    )}
                  >
                    {step.content}
                  </div>
                )}
              </div>
            ))}

            {/* Show current step */}
            {currentStep < steps.length &&
              steps[currentStep] &&
              renderStep(steps[currentStep], currentStep)}

            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-emerald-900/30 border border-emerald-700 rounded text-emerald-400 text-sm"
              >
                <div className="font-medium mb-1">
                  📊 Log Monitoring Benefits:
                </div>
                <ul className="text-xs space-y-1 text-emerald-300">
                  <li>• Centralized logging from all services</li>
                  <li>• Real-time health monitoring</li>
                  <li>• Easy troubleshooting and debugging</li>
                  <li>• Performance metrics and status updates</li>
                </ul>
                <motion.button
                  onClick={() => {
                    setCurrentStep(-1);
                    setIsComplete(false);
                    setExecutedSteps([]);
                  }}
                  className="mt-2 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 Run Again
                </motion.button>
              </motion.div>
            )}
          </div>
        )}
      </Terminal>
    </div>
  );
}

export default LogsDemo;
