"use client";

import { motion } from "framer-motion";
import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import { CommandLine, Loading, OutputLine, Terminal } from "../terminal";

interface SetupScriptDemoProps {
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

export function SetupScriptDemo({
  className,
  autoStart = false,
  isVisible = false,
}: SetupScriptDemoProps) {
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
      content: "./setup.sh",
      delay: 0,
    },
    {
      type: "output",
      content: "🚀 Starting Telegram Bot + Convex Backend Setup",
      delay: 800,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "================================================",
      delay: 900,
      outputType: "info" as const,
    },
    {
      type: "loading",
      loadingMessage: "📝 Creating .env file from template",
      completeMessage: ".env file created from template",
      duration: 1500,
      delay: 1000,
    },
    {
      type: "output",
      content: "🤖 Telegram Bot Token Setup",
      delay: 500,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "You need a Telegram bot token to continue.",
      delay: 600,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "Get one from @BotFather: https://t.me/botfather",
      delay: 700,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "Do you want to enter your Telegram bot token now? (y/n): y",
      delay: 800,
      outputType: "warning" as const,
    },
    {
      type: "output",
      content:
        "Enter your Telegram bot token: 7***************:AAH***************************",
      delay: 1200,
      outputType: "warning" as const,
    },
    {
      type: "output",
      content: "✅ Telegram token saved to .env file",
      delay: 1400,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "Enter your bot username: my_awesome_bot",
      delay: 1600,
      outputType: "warning" as const,
    },
    {
      type: "output",
      content: "✅ Telegram bot username saved to .env file",
      delay: 1800,
      outputType: "success" as const,
    },
    {
      type: "loading",
      loadingMessage: "🔧 Starting Convex backend",
      completeMessage: "Convex backend is healthy",
      duration: 2500,
      delay: 500,
    },
    {
      type: "loading",
      loadingMessage: "🔑 Generating Convex admin key",
      completeMessage: "Admin key generated and saved",
      duration: 1800,
      delay: 400,
    },
    {
      type: "loading",
      loadingMessage: "📦 Deploying Convex functions",
      completeMessage: "Convex functions deployed",
      duration: 3000,
      delay: 400,
    },
    {
      type: "loading",
      loadingMessage: "🌐 Building Next.js web dashboard",
      completeMessage: "Web dashboard prepared",
      duration: 2500,
      delay: 400,
    },
    {
      type: "loading",
      loadingMessage: "🧠 Setting up Vector Convert LLM Service",
      completeMessage: "Vector Convert LLM service configured",
      duration: 2000,
      delay: 400,
    },
    {
      type: "loading",
      loadingMessage: "🚀 Starting all services",
      completeMessage: "All services started successfully",
      duration: 2500,
      delay: 400,
    },
    {
      type: "output",
      content: "",
      delay: 800,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "🎉 Setup Complete!",
      delay: 900,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "==================",
      delay: 1000,
      outputType: "success" as const,
    },
    {
      type: "output",
      content: "🌐 Convex Dashboard: http://localhost:6791",
      delay: 1100,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "🖥️  Web Dashboard: http://localhost:3000",
      delay: 1200,
      outputType: "info" as const,
    },
    {
      type: "output",
      content: "🤖 Bot URL: https://t.me/my_awesome_bot",
      delay: 1300,
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
      // Add completed step to history
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
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ▶️ Run Setup Script Demo
            </motion.button>
            <p className="text-gray-400 text-xs mt-2">
              Watch the automated setup process in action
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
                className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-400 text-sm"
              >
                <div className="font-medium mb-1">🎯 What just happened?</div>
                <ul className="text-xs space-y-1 text-green-300">
                  <li>
                    • Configured environment variables with your bot credentials
                  </li>
                  <li>• Started self-hosted Convex database</li>
                  <li>• Deployed serverless functions</li>
                  <li>• Built and launched web dashboard</li>
                  <li>• Connected Telegram bot to backend</li>
                  <li>• Set up AI/ML vector services</li>
                </ul>
                <motion.button
                  onClick={() => {
                    setCurrentStep(-1);
                    setIsComplete(false);
                    setExecutedSteps([]);
                  }}
                  className="mt-2 px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-xs transition-colors"
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

export default SetupScriptDemo;
