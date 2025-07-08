"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "../hooks/use-outside-clicks";
import { useLLMStatus } from "../hooks/use-llm-status";
import { useConvexStatus } from "../hooks/use-convex-status";
import { Settings as SettingsIcon, X } from "lucide-react";
import { cn, getCookie, setCookie } from "../lib/utils";
import { renderIcon } from "../lib/icon-utils";
import { LLMStatusIndicator } from "./rag/llm-status-indicator";
import { StatusIndicator } from "./ui/status-indicator";

interface SettingsProps {
  className?: string;
}

export function Settings({ className }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animationLightMode, setAnimationLightMode] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  
  // Status hooks
  const { llmStatus } = useLLMStatus();
  const { convexStatus } = useConvexStatus();

  // Load animation setting from cookie on mount
  useEffect(() => {
    const savedSetting = getCookie('animationLightMode');
    if (savedSetting !== null) {
      setAnimationLightMode(savedSetting === 'true');
    }
  }, []);

  // Update button position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleToggleAnimationMode = () => {
    const newValue = !animationLightMode;
    setAnimationLightMode(newValue);
    setCookie('animationLightMode', newValue.toString());
  };

  useOutsideClick(ref, (event: MouseEvent | TouchEvent) => setIsOpen(false));

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {renderIcon(SettingsIcon, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" })}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 backdrop-blur-sm bg-black/20"
            />
            <motion.div
              ref={ref}
              layoutId={`card-${id}`}
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              style={{
                position: 'fixed',
                top: buttonPosition.top,
                right: buttonPosition.right,
                zIndex: 60
              }}
              className="w-96 bg-white rounded-xl border border-gray-200 shadow-2xl dark:bg-gray-900 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Settings
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {renderIcon(X, { className: "w-5 h-5 text-gray-500 dark:text-gray-400" })}
                  </button>
                </div>

                <div className="space-y-6">
                  {/* System Status Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      System Status
                    </h3>
                    <div className="space-y-3">
                      {/* LLM Status */}
                      <LLMStatusIndicator
                        status={llmStatus.status}
                        ready={llmStatus.ready}
                        message={llmStatus.message}
                        model={llmStatus.model}
                        details={llmStatus.details}
                        size="sm"
                        showLogs={false}
                        className="bg-gray-50 dark:bg-gray-800/30"
                      />
                      
                      {/* Convex Status */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <StatusIndicator 
                            status={convexStatus.status}
                            size="sm"
                            showLabel={false}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              Convex Database
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {convexStatus.message}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Settings Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Preferences
                    </h3>
                    <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Animation Light Mode
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enable lighter animations for better performance
                      </p>
                    </div>
                    <button
                      onClick={handleToggleAnimationMode}
                      className={cn(
                        "inline-flex relative items-center w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
                        animationLightMode
                          ? "bg-cyan-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block w-4 h-4 bg-white rounded-full transition-transform transform",
                          animationLightMode ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}