"use client";

import { motion } from "framer-motion";
import { Settings as SettingsIcon, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ExpandableCard } from "../components/ui/expandable-card-reusable";
import { ScrollArea } from "../components/ui/scroll-area";
import { useOutsideClick } from "../hooks/use-outside-clicks";
import { renderIcon } from "../lib/icon-utils";
import { cn, getCookie, setCookie } from "../lib/utils";
import { ConvexStatusIndicator } from "./convex/convex-status-indicator";
import { DockerStatus } from "./docker-status";
import { LightweightLLMStatusIndicator } from "./rag/lightweight-llm-status-indicator";
import { LLMStatusIndicator } from "./rag/llm-status-indicator";
import { UserCountIndicator } from "./user-count/user-count-indicator";

interface SettingsProps {
  className?: string;
}

export function Settings({ className }: SettingsProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [animationLightMode, setAnimationLightMode] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{
    top: number | "auto";
    bottom?: number;
    right: number;
  }>({ top: 0, right: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  // Status hooks not needed anymore since components manage their own state

  // Load animation setting from cookie on mount
  useEffect(() => {
    const savedSetting = getCookie("animationLightMode");
    if (savedSetting !== null) {
      setAnimationLightMode(savedSetting === "true");
    }
  }, []);

  // Update button position when opening, with mobile responsiveness
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640; // sm breakpoint

      // Calculate available space below button
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      // Use top positioning if there's enough space, otherwise position from bottom
      const useTopPositioning = spaceBelow >= 300; // Minimum height needed

      if (isMobile) {
        // Center horizontally on mobile
        if (useTopPositioning) {
          setButtonPosition({
            top: rect.bottom + 8,
            right: Math.max(
              8,
              Math.min(window.innerWidth - 320, window.innerWidth / 2 - 160)
            ), // Center with min margin
          });
        } else {
          // Position from bottom of screen if not enough space below
          setButtonPosition({
            top: "auto",
            bottom: 16,
            right: Math.max(
              8,
              Math.min(window.innerWidth - 320, window.innerWidth / 2 - 160)
            ),
          });
        }
      } else {
        // Regular positioning for larger screens
        setButtonPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handleResize() {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const isMobile = window.innerWidth < 640; // sm breakpoint

        // Calculate available space below button
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        // Use top positioning if there's enough space, otherwise position from bottom
        const useTopPositioning = spaceBelow >= 300; // Minimum height needed

        if (isMobile) {
          // Center horizontally on mobile
          if (useTopPositioning) {
            setButtonPosition({
              top: rect.bottom + 8,
              right: Math.max(
                8,
                Math.min(window.innerWidth - 320, window.innerWidth / 2 - 160)
              ),
            });
          } else {
            // Position from bottom of screen if not enough space below
            setButtonPosition({
              top: "auto",
              bottom: 16,
              right: Math.max(
                8,
                Math.min(window.innerWidth - 320, window.innerWidth / 2 - 160)
              ),
            });
          }
        } else {
          // Regular positioning for larger screens
          setButtonPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
          });
        }
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const handleToggleAnimationMode = () => {
    const newValue = !animationLightMode;
    setAnimationLightMode(newValue);

    // Only set cookie if user has consented
    const hasConsented = localStorage.getItem("cookie-consent") === "true";
    if (hasConsented) {
      setCookie("animationLightMode", newValue.toString());

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("animationSettingsChanged"));
    }
  };

  useOutsideClick(ref, (_event: MouseEvent | TouchEvent) => setIsOpen(false));

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {renderIcon(SettingsIcon, {
          className: "w-5 h-5 text-gray-600 dark:text-gray-400",
        })}
      </button>

      <ExpandableCard
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonPosition={buttonPosition}
        liquidGlass={true}
        layoutId={`settings-card-${id}`}
      >
        <ScrollArea className="h-[calc(min(60vh,500px))] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Settings
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {renderIcon(X, {
                  className: "w-5 h-5 text-gray-500 dark:text-gray-400",
                })}
              </button>
            </div>

            <div className="space-y-6">
              {/* System Status Section */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                  System Status
                </h3>
                <motion.div
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.05,
                      },
                    },
                  }}
                >
                  {/* LLM Status */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 5 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <LightweightLLMStatusIndicator
                      size="sm"
                      showLogs={false}
                      className="bg-gray-50 dark:bg-gray-800/30"
                    />
                  </motion.div>

                  {/* LLM Transformer Status */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 5 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <LLMStatusIndicator
                      size="sm"
                      showLogs={false}
                      className="bg-gray-50 dark:bg-gray-800/30"
                    />
                  </motion.div>

                  {/* Convex Status */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 5 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <ConvexStatusIndicator
                      size="sm"
                      showLogs={false}
                      className="bg-gray-50 dark:bg-gray-800/30"
                    />
                  </motion.div>

                  {/* Docker Status */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 5 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <DockerStatus
                      size="sm"
                      showLogs={false}
                      className="bg-gray-50 dark:bg-gray-800/30"
                    />
                  </motion.div>

                  {/* User Count Status */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 5 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <UserCountIndicator
                      size="sm"
                      showLogs={false}
                      className="bg-gray-50 dark:bg-gray-800/30"
                    />
                  </motion.div>
                </motion.div>
              </div>

              {/* Settings Section */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                  Preferences
                </h3>
                <motion.div
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        delay: 0.1,
                        staggerChildren: 0.05,
                      },
                    },
                  }}
                >
                  <motion.div
                    className="flex justify-between items-center"
                    variants={{
                      hidden: { opacity: 0, y: 5 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Animation Light Mode
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enable lighter animations for better performance
                      </p>
                    </div>
                    <motion.button
                      onClick={handleToggleAnimationMode}
                      className={cn(
                        "inline-flex relative items-center w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
                        animationLightMode
                          ? "bg-cyan-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      )}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.span
                        layout
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                        className={cn(
                          "inline-block w-4 h-4 bg-white rounded-full transition-transform transform",
                          animationLightMode ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </motion.button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </ExpandableCard>
    </div>
  );
}
