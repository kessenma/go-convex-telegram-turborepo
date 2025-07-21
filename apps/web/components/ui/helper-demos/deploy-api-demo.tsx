"use client";

import { motion } from "framer-motion";
import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import { CommandLine, Loading, OutputLine, Terminal } from "../terminal";

interface DeployApiDemoProps {
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

export function DeployApiDemo({
  className,
  autoStart = false,
  isVisible = false,
}: DeployApiDemoProps) {
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
      content: "pnpm convex:deploy-api",
      delay: 0,
    },
    {
      type: "output",
      content: "🚀 Starting Convex API generation and deployment...",
      delay: 800,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "📁 Navigating to docker-convex directory...",
      delay: 1000,
      outputType: "info" as const,
    },
    {
      type: "loading",
      loadingMessage: "📦 Installing convex-helpers",
      completeMessage: "convex-helpers installed",
      duration: 2000,
      delay: 1200,
    },
    {
      type: "loading",
      loadingMessage: "🔧 Generating Convex API specification",
      completeMessage: "API specification generated successfully",
      duration: 3000,
      delay: 500,
    },
    {
      type: "output",
      content: "📋 Copying generated API to web application...",
      delay: 800,
      outputType: "info" as const,
    },
    {
      type: "output",
      content:
        "✅ API file successfully deployed to apps/web/generated-convex.ts",
      delay: 1000,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "",
      delay: 1200,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "📊 Generated API file statistics:",
      delay: 1400,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "   📄 File: apps/web/generated-convex.ts",
      delay: 1500,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "   📏 Size: 2,847 bytes",
      delay: 1600,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "   📝 Lines: 89",
      delay: 1700,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "",
      delay: 1800,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "🎉 Convex API deployment complete!",
      delay: 1900,
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
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔧 Run API Deployment
            </motion.button>
            <p className="text-gray-400 text-xs mt-2">
              Generate TypeScript API definitions from Convex backend
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
                className="mt-4 p-3 bg-cyan-900/30 border border-cyan-700 rounded text-cyan-400 text-sm"
              >
                <div className="font-medium mb-1">
                  🎯 API Generation Benefits:
                </div>
                <ul className="text-xs space-y-1 text-cyan-300">
                  <li>• Type-safe API calls with full IntelliSense</li>
                  <li>• Automatic synchronization with backend schema</li>
                  <li>• Eliminates manual API definition maintenance</li>
                  <li>• Catches breaking changes at compile time</li>
                </ul>
                <motion.button
                  onClick={() => {
                    setCurrentStep(-1);
                    setIsComplete(false);
                    setExecutedSteps([]);
                  }}
                  className="mt-2 px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs transition-colors"
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

export default DeployApiDemo;
