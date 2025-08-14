"use client";

import { motion } from "framer-motion";
import { Settings as SettingsIcon, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExpandableCard } from "../ui/expandable-card-reusable";

import { Switch } from "../ui/switch";
import { useOutsideClick } from "../../hooks/use-outside-clicks";
import { renderIcon } from "../../lib/icon-utils";
import { cn, getCookie, setCookie } from "../../lib/utils";
import { ConvexStatusIndicator } from "./convex-status-indicator";
import { DockerStatus } from "./docker-status";
import { LightweightVectorConverterStatus } from "./lightweight-llm-status-indicator";
import { VectorConverterStatus } from "./vector-status-indicator";

import { UserCountIndicator } from "./user-count-indicator";
import { ChangelogModal } from "../change-log/ChangelogModal";
import { useNavigationLoading } from "../../contexts/NavigationLoadingContext";
import { LoadingSpinner } from "../ui/loading-spinner";


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
  const router = useRouter();
  const { isLoading, loadingPath, startLoading } = useNavigationLoading();

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

  const handleToggleAnimationMode = (checked: boolean) => {
    setAnimationLightMode(checked);

    // Only set cookie if user has consented
    const hasConsented = localStorage.getItem("cookie-consent") === "true";
    if (hasConsented) {
      setCookie("animationLightMode", checked.toString());

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("animationSettingsChanged"));
    }
  };

  const handleSystemStatusClick = () => {
    startLoading("/system-status");
    router.push("/system-status");
    setIsOpen(false); // Close settings panel
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
        zIndex={100}
      >
        <div className="h-[calc(min(60vh,500px))] overflow-y-auto overflow-x-visible">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-md text-sn">
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
                  {/* Consolidated LLM Status */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 5 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <LightweightVectorConverterStatus
                      size="sm"
                      showLogs={true}
                      showSummary={false}
                      variant="consolidated"
                    />
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 5 },
                      visible: { opacity: 1, y: 0 },
                    }}>
                    <VectorConverterStatus
                      size="sm"
                      showLogs={true}
                      showSummary={false}
                      variant="consolidated"
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
                    />
                  </motion.div>


                </motion.div>
              </div>

              {/* Settings Section */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-right text-white">
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
                      <h3 className="text-sm font-medium text-white">
                        Animation Light Mode
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enable lighter animations for better performance
                      </p>
                    </div>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Switch
                        checked={animationLightMode}
                        onCheckedChange={handleToggleAnimationMode}
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>

              {/* Changelog Section */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-white">
                  Project Updates
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
                        delay: 0.2,
                        staggerChildren: 0.05,
                      },
                    },
                  }}
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 5 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className="p-3 bg-gradient-to-br rounded-lg border backdrop-blur-md from-slate-800/60 to-slate-900/60 border-white/10"
                  >
                    <div className="space-y-4">
                      <p className="text-xs text-slate-300">
                        Stay updated with the latest changes and improvements to the project.
                      </p>

                      <div className="flex gap-4 justify-center">
                        <ChangelogModal
                          trigger={
                            <button className="flex gap-1 items-center text-sm text-cyan-400 transition-colors hover:text-cyan-300">
                              View Changelog
                            </button>
                          }
                          maxCommits={-1}
                        />
                        <button
                          onClick={handleSystemStatusClick}
                          className="flex gap-1 items-center text-sm text-emerald-400 transition-colors hover:text-emerald-300"
                          disabled={isLoading && loadingPath === "/system-status"}
                        >
                          {isLoading && loadingPath === "/system-status" ? (
                            <>
                              <LoadingSpinner size="sm" use3D={true} />
                              Loading...
                            </>
                          ) : (
                            "System Status"
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </ExpandableCard>
    </div>
  );
}
