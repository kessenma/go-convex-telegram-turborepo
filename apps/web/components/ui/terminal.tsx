"use client";

import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface TerminalProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  speed?: number;
  onComplete?: () => void;
}

interface TypingAnimationProps {
  children: string;
  className?: string;
  delay?: number;
  speed?: number;
  onComplete?: () => void;
}

interface LoadingProps {
  loadingMessage: string;
  completeMessage: string;
  duration?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

interface AnimatedSpanProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

// Terminal Root Component
export function Terminal({
  children,
  className,
  delay = 0,
  speed = 1,
  onComplete,
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  });

  return (
    <div
      className={cn(
        "bg-gray-900 rounded-lg border border-gray-700 overflow-hidden font-mono text-sm",
        className
      )}
    >
      {/* Terminal Header */}
      <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex-1 text-center text-gray-400 text-xs">Terminal</div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay / 1000 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

// Typewriter Animation Component
export function TypingAnimation({
  children,
  className,
  delay = 0,
  speed = 1,
  onComplete,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const startTyping = () => {
      let currentIndex = 0;
      const typeSpeed = 50 / speed; // Base speed of 50ms per character

      const typeNextCharacter = () => {
        if (currentIndex < children.length) {
          setDisplayedText(children.slice(0, currentIndex + 1));
          currentIndex++;
          timeoutRef.current = setTimeout(typeNextCharacter, typeSpeed);
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      };

      timeoutRef.current = setTimeout(typeNextCharacter, delay);
    };

    startTyping();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [children, delay, speed, onComplete]);

  return (
    <span className={cn("text-green-400", className)}>
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="text-green-400"
        >
          |
        </motion.span>
      )}
    </span>
  );
}

// Loading Animation Component
export function Loading({
  loadingMessage,
  completeMessage,
  duration = 3000,
  delay = 0,
  className,
  onComplete,
}: LoadingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const startDelay = setTimeout(() => {
      // Animate dots
      const dotsInterval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : `${prev}.`));
      }, 500);

      // Complete loading after duration
      const completeTimeout = setTimeout(() => {
        setIsLoading(false);
        clearInterval(dotsInterval);
        onComplete?.();
      }, duration);

      return () => {
        clearInterval(dotsInterval);
        clearTimeout(completeTimeout);
      };
    }, delay);

    return () => clearTimeout(startDelay);
  }, [duration, delay, onComplete]);

  return (
    <div className={cn("text-yellow-400", className)}>
      {isLoading ? (
        <span>
          {loadingMessage}
          {dots}
        </span>
      ) : (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-green-400"
        >
          ✅ {completeMessage}
        </motion.span>
      )}
    </div>
  );
}

// Animated Span Component
export function AnimatedSpan({
  children,
  className,
  delay = 0,
}: AnimatedSpanProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.span>
  );
}

// Command Line Component
export function CommandLine({
  command,
  delay = 0,
  speed = 1,
  onComplete,
}: {
  command: string;
  delay?: number;
  speed?: number;
  onComplete?: () => void;
}) {
  return (
    <div className="flex items-start space-x-2 mb-2">
      <span className="text-blue-400 shrink-0">$</span>
      <TypingAnimation
        delay={delay}
        speed={speed}
        onComplete={onComplete}
        className="text-white"
      >
        {command}
      </TypingAnimation>
    </div>
  );
}

// Output Line Component
export function OutputLine({
  children,
  delay = 0,
  className,
  type = "success",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  type?: "success" | "error" | "info" | "warning";
}) {
  const typeColors = {
    success: "text-green-400",
    error: "text-red-400",
    info: "text-blue-400",
    warning: "text-yellow-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay / 1000, duration: 0.2 }}
      className={cn(typeColors[type], "mb-1 ml-4", className)}
    >
      {children}
    </motion.div>
  );
}
