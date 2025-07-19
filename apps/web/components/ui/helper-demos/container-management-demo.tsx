'use client';

import React, { useState } from 'react';
import { Terminal, CommandLine, OutputLine, Loading } from '../terminal';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface ContainerManagementDemoProps {
  className?: string;
  autoStart?: boolean;
  isVisible?: boolean;
}

type CommandStep = {
  type: 'command';
  content: string;
  delay: number;
};

type OutputStep = {
  type: 'output';
  content: string;
  delay: number;
  outputType?: 'success' | 'error' | 'warning' | 'info';
};

type LoadingStep = {
  type: 'loading';
  loadingMessage: string;
  completeMessage: string;
  duration: number;
  delay: number;
};

type Step = CommandStep | OutputStep | LoadingStep;

export function ContainerManagementDemo({ className, autoStart = false, isVisible = false }: ContainerManagementDemoProps) {
  const [executedSteps, setExecutedSteps] = useState<Array<{type: string, content: string, outputType?: string}>>([]);
  const [currentStep, setCurrentStep] = useState(autoStart ? 0 : -1);
  const [isComplete, setIsComplete] = useState(false);

  const addToHistory = (step: {type: string, content: string, outputType?: string}) => {
    setExecutedSteps(prev => [...prev, step]);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const startDemo = () => {
    setCurrentStep(0);
    setIsComplete(false);
    setExecutedSteps([]);
  };

  const steps: Step[] = [
    {
      type: 'command',
      content: 'pnpm docker:manage',
      delay: 0
    },
    {
      type: 'output',
      content: '🐳 Docker Container Management',
      delay: 1000,
      outputType: 'info' as const
    },
    {
      type: 'output',
      content: '============================',
      delay: 1200,
      outputType: 'info' as const
    },
    {
      type: 'loading',
      loadingMessage: '📊 Checking container status',
      completeMessage: 'Container status retrieved',
      duration: 2000,
      delay: 1500
    },
    {
      type: 'output',
      content: '📦 Active Containers:',
      delay: 500,
      outputType: 'success' as const
    },
    {
      type: 'output',
      content: '  ✅ convex-backend (healthy)',
      delay: 700,
      outputType: 'success' as const
    },
    {
      type: 'output',
      content: '  ✅ telegram-bot (running)',
      delay: 900,
      outputType: 'success' as const
    },
    {
      type: 'output',
      content: '  ✅ web-dashboard (running)',
      delay: 1100,
      outputType: 'success' as const
    },
    {
      type: 'output',
      content: '  ✅ vector-convert-llm (running)',
      delay: 1300,
      outputType: 'success' as const
    },
    {
      type: 'output',
      content: '',
      delay: 1500,
      outputType: 'info' as const
    },
    {
      type: 'output',
      content: '🔧 Available Commands:',
      delay: 1700,
      outputType: 'info' as const
    },
    {
      type: 'output',
      content: '  • docker compose logs -f (view logs)',
      delay: 1900,
      outputType: 'info' as const
    },
    {
      type: 'output',
      content: '  • docker compose restart <service>',
      delay: 2100,
      outputType: 'info' as const
    },
    {
      type: 'output',
      content: '  • docker compose down (stop all)',
      delay: 2300,
      outputType: 'info' as const
    },
    {
      type: 'output',
      content: '',
      delay: 2500,
      outputType: 'info' as const
    },
    {
      type: 'output',
      content: '🌐 Service URLs:',
      delay: 2700,
      outputType: 'success' as const
    },
    {
      type: 'output',
      content: '  • Web Dashboard: http://localhost:3000',
      delay: 2900,
      outputType: 'info' as const
    },
    {
      type: 'output',
      content: '  • Convex Admin: http://localhost:6791',
      delay: 3100,
      outputType: 'info' as const
    },
    {
      type: 'output',
      content: '  • Vector API: http://localhost:8081',
      delay: 3300,
      outputType: 'info' as const
    }
  ];

  // Auto-advance output steps after their delay + a small buffer
  React.useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      if (step && step.type === 'output') {
        const timer = setTimeout(() => {
          // Add completed step to history
          addToHistory({ type: 'output', content: step.content, outputType: step.outputType });
          nextStep();
        }, step.delay + 500); // Add 500ms buffer for the animation
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentStep]);

  const renderStep = (step: Step, index: number) => {
    if (index > currentStep) return null;

    const handleStepComplete = () => {
      if (step.type === 'command') {
        addToHistory({ type: 'command', content: step.content });
      } else if (step.type === 'loading') {
        addToHistory({ type: 'output', content: `✅ ${step.completeMessage}`, outputType: 'success' });
      }
      nextStep();
    };

    switch (step.type) {
      case 'command':
        return (
          <CommandLine
            key={index}
            command={step.content}
            delay={step.delay}
            onComplete={handleStepComplete}
          />
        );
      
      case 'output':
        return (
          <OutputLine
            key={index}
            delay={step.delay}
            type={step.outputType}
          >
            {step.content}
          </OutputLine>
        );
      
      case 'loading':
        return (
          <div key={index} className="mb-2 ml-4">
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
  }, [isVisible]);

  React.useEffect(() => {
    if (currentStep >= steps.length - 1 && currentStep !== -1) {
      setTimeout(() => setIsComplete(true), 2000);
    }
  }, [currentStep, steps.length]);

  return (
    <div className={className}>
      <Terminal className="w-full">
        {currentStep === -1 ? (
          <div className="py-8 text-center">
            <motion.button
              onClick={startDemo}
              className="px-6 py-3 font-medium text-white bg-purple-600 rounded-lg transition-colors hover:bg-purple-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🐳 Run Container Management Demo
            </motion.button>
            <p className="mt-2 text-xs text-gray-400">
              See how easy it is to manage Docker containers
            </p>
          </div>
        ) : (
          <div>
            {/* Show completed steps in history */}
            {executedSteps.map((step, index) => (
              <div key={`history-${index}`} className="mb-1">
                {step.type === 'command' ? (
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-400 shrink-0">$</span>
                    <span className="text-white">{step.content}</span>
                  </div>
                ) : (
                  <div className={cn(
                    "ml-4",
                    step.outputType === 'success' ? 'text-green-400' :
                    step.outputType === 'error' ? 'text-red-400' :
                    step.outputType === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  )}>
                    {step.content}
                  </div>
                )}
              </div>
            ))}
            
            {/* Show current step */}
            {currentStep < steps.length && steps[currentStep] && renderStep(steps[currentStep], currentStep)}
            
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 mt-4 text-sm text-purple-400 rounded border border-purple-700 bg-purple-900/30"
              >
                <div className="mb-1 font-medium">🎯 Container Management Benefits:</div>
                <ul className="space-y-1 text-xs text-purple-300">
                  <li>• One command to check all services</li>
                  <li>• Easy restart and troubleshooting</li>
                  <li>• Centralized logging and monitoring</li>
                  <li>• Consistent development environment</li>
                  <li>• Simple deployment and scaling</li>
                </ul>
                <motion.button
                  onClick={() => {
                    setCurrentStep(-1);
                    setIsComplete(false);
                    setExecutedSteps([]);
                  }}
                  className="px-3 py-1 mt-2 text-xs text-white bg-purple-700 rounded transition-colors hover:bg-purple-600"
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

export default ContainerManagementDemo;