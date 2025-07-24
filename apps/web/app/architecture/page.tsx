"use client";

import {
  Check,
  Code,
  Copy,
  ExternalLink,
  FileText,
  Key,
  Play,
  Terminal as TerminalIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { GridBackground } from "../../components/ui/backgrounds/grid-background";
import { AdminKeyDemo } from "../../components/ui/helper-demos/admin-key-demo";
import { ContainerManagementDemo } from "../../components/ui/helper-demos/container-management-demo";
import { DeployApiDemo } from "../../components/ui/helper-demos/deploy-api-demo";
import { LogsDemo } from "../../components/ui/helper-demos/logs-demo";
import { SetupScriptDemo } from "../../components/ui/helper-demos/setup-script-demo";
import { Hero, TextAnimationType } from "../../components/ui/hero";
import { SparklesCore } from "../../components/ui/sparkles";
import DecryptedText from "../../components/ui/text-animations/decrypted-text";
import { TextShimmer } from "../../components/ui/text-animations/text-shimmer";
import TrueFocus from "../../components/ui/text-animations/true-focus";
import { Activate } from "../../components/ui/three/activate";
import { ArchitectureTimeline } from "../../components/ui/three/architecture-timeline11";
import { BackgroundWhale } from "../../components/ui/three/background-whale";
import { CoolifyTimeline } from "../../components/ui/three/cloud-upload";
import { Container } from "../../components/ui/three/container";
import { DockerComposeTimeline } from "../../components/ui/three/docker-compose-timeline";
import { useAnimationSettings } from "../../hooks/use-animation-settings";
import { useIntersectionObserver } from "../../hooks/use-intersection-observer";
import { useArchitectureStore } from "../../stores/architecture-store";

// Static Icon Components (no animations)
function TerminalIconAnimated() {
  return (
    <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-gray-600/20">
      <TerminalIcon className="w-4 h-4 text-gray-400" />
    </div>
  );
}

function PlayIconAnimated() {
  return (
    <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-gray-600/20">
      <Play className="w-4 h-4 text-gray-400" />
    </div>
  );
}

function CodeIconAnimated() {
  return (
    <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-gray-600/20">
      <Code className="w-4 h-4 text-gray-400" />
    </div>
  );
}

function KeyIconAnimated() {
  return (
    <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-gray-600/20">
      <Key className="w-4 h-4 text-gray-400" />
    </div>
  );
}

function FileTextIconAnimated() {
  return (
    <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-gray-600/20">
      <FileText className="w-4 h-4 text-gray-400" />
    </div>
  );
}

export default function ArchitecturePage(): React.ReactElement {
  const { animationEnabled } = useAnimationSettings();
  const { setFirstTimelineActive, setSecondTimelineActive, setScrollProgress } =
    useArchitectureStore();
  const secondTimelineRef = useRef<HTMLDivElement>(null);
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
    null
  );

  useEffect(() => {
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!secondTimelineRef.current) {
            ticking = false;
            return;
          }

          const rect = secondTimelineRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          // Calculate when second timeline should be active
          const startTrigger = windowHeight * 0.8;
          const endTrigger = -rect.height * 0.2;

          let progress = 0;
          let secondActive = false;

          if (rect.top <= startTrigger && rect.bottom >= endTrigger) {
            secondActive = true;
            const totalDistance = startTrigger - endTrigger;
            const currentDistance = startTrigger - rect.top;
            progress = Math.max(0, Math.min(1, currentDistance / totalDistance));
          }

          // Manage timeline states
          setFirstTimelineActive(!secondActive);
          setSecondTimelineActive(secondActive);
          setScrollProgress(progress);
          
          ticking = false;
        });
        ticking = true;
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setFirstTimelineActive, setSecondTimelineActive, setScrollProgress]);

  return (
    <div className="relative px-4 mx-auto min-h-screen text-white bg-gradient-to-b from-slate-950 to-slate-800">
      <GridBackground gridColor="#000000" />
      {/* Radial gradient for the container to give a faded look */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-800 [mask-image:radial-gradient(ellipse_at_center,transparent_82.5%,black)]"></div>
      {/* Header */}
      <Hero
        title="Architecture"
        subtitle={`Did I know how to make an LLM app before this? No. My goal was to see how far I could push a linux server and a self-hosted convex database for a chatbot with 8gb of ram and 4 cpu cores and no GPU. The ${process.env.NEXT_PUBLIC_LLM_MODEL || 'Llama 3.2'} model is ok for RAG tasks but I plan to tinker with different libraries and models in the future!`}
        textAlign="center"
        titleAnimation={TextAnimationType.Shimmer}
        animationSpeed={75}
        className="mt-24 mb-6 ml-4"
      >
        {/* Sparkles Effect - Centered */}
        <div className="flex overflow-hidden relative justify-center items-center mx-auto -mt-6 -mb-40 w-full max-w-3xl h-40 rounded-md">
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-white to-transparent h-[2px] w-3/4 blur-sm" />
          <div className="absolute top-0 left-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white to-transparent transform -translate-x-1/2" />
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-white to-transparent h-[5px] w-1/4 blur-sm" />
          <div className="absolute top-0 left-1/2 w-1/4 h-px bg-gradient-to-r from-transparent via-white to-transparent transform -translate-x-1/2" />

          <SparklesCore
            id="tsparticles-data"
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={500}
            className="z-20 w-full h-full"
            particleColor="#cbd5e1"
            animationEnabled={animationEnabled}
          />

          <div className="absolute inset-0 w-full h-full"></div>
        </div>
      </Hero>

      {/* Architecture Timeline Component */}
      <div className="relative">
        <ArchitectureTimeline height={600} />
      </div>

      {/* Background Whale - Positioned behind Docker content, ends before Deployment Details */}
      {(() => {
        const { ref, isIntersecting } = useIntersectionObserver({
          triggerOnce: true,
          threshold: 0.2,
        });

        return (
          <motion.div
            ref={ref}
            initial={{ y: 100, opacity: 0 }}
            animate={
              isIntersecting ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }
            }
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute right-0 left-0 z-0 -mt-96 pointer-events-none"
          >
            <BackgroundWhale
              height={
                typeof window !== "undefined" ? window.innerHeight * 2.5 : 1200
              } // Reduced height to end before Deployment Details
              animationEnabled={animationEnabled}
              className="opacity-40"
            />
          </motion.div>
        );
      })()}

      {/* Docker Infrastructure Overview */}
      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="p-8 rounded-2xl border backdrop-blur-sm bg-slate-800/30 border-slate-700/30">
          <div className="flex items-center mb-6">
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <motion.div
                  ref={ref}
                  initial={{ x: -50, opacity: 0 }}
                  animate={
                    isIntersecting
                      ? { x: 0, opacity: 1 }
                      : { x: -50, opacity: 0 }
                  }
                  transition={{ duration: 0.5 }}
                  className="flex justify-center items-center mr-4 w-10 h-10 rounded-lg bg-cyan-600/20"
                >
                  <img src="/docker.svg" alt="Docker" className="w-6 h-6" />
                </motion.div>
              );
            })()}
            <div>
              <h3 className="text-xl font-semibold text-white">
                Docker Infrastructure
              </h3>
            </div>
          </div>

          <div className="space-y-6">
            <p className="leading-relaxed text-gray-300">
              Each application in the{" "}
              <code className="px-2 py-1 text-sm text-cyan-300 rounded bg-slate-700">
                apps/
              </code>{" "}
              directory contains its own{" "}
              <code className="px-2 py-1 text-sm text-cyan-300 rounded bg-slate-700">
                Dockerfile
              </code>{" "}
              that connects to the central{" "}
              <code className="px-2 py-1 text-sm text-cyan-300 rounded bg-slate-700">
                docker-compose.yaml
              </code>
              .
            </p>

            {/* Custom Helper Scripts Section */}
            <div className="pt-4 border-t border-slate-700/50">
              <h4 className="mb-4 text-lg font-semibold text-white">
                Docker Helper Scripts
              </h4>
              <p className="mb-6 text-sm text-gray-400">
                Automated scripts to assist setting up the docker containers,
                deployment, and management tasks with commands from the central{" "}
                <code className="px-2 py-1 text-sm text-cyan-300 rounded bg-slate-700">
                  package.json
                </code>
                .
              </p>

              <Accordion
                className="space-y-3"
                expandedValue={expandedAccordion}
                onValueChange={(value) =>
                  setExpandedAccordion(value as string | null)
                }
              >
                <AccordionItem
                  value="setup-script"
                  className="rounded-lg border border-slate-600/30 bg-slate-800/20"
                >
                  <AccordionTrigger className="px-4 py-3 rounded-t-lg hover:bg-slate-700/30">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center space-x-3">
                        <TerminalIconAnimated />
                        <div className="text-left">
                          <h5 className="font-medium text-white">
                            Automated Setup
                          </h5>
                          <p className="text-xs text-gray-400">
                            Environment file creation + starting all the apps
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 text-xs text-left text-cyan-300 rounded bg-slate-700">
                          pnpm setup-init
                        </code>
                        {(() => {
                          const { ref, isIntersecting } =
                            useIntersectionObserver({
                              triggerOnce: true,
                              threshold: 0.2,
                            });

                          return (
                            <motion.span
                              ref={ref}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={
                                isIntersecting
                                  ? { scale: 1, opacity: 1 }
                                  : { scale: 0, opacity: 0 }
                              }
                              transition={{ duration: 0.3, delay: 0.6 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  "pnpm setup-init"
                                );
                                setCopiedItems({
                                  ...copiedItems,
                                  "setup-init": true,
                                });
                                setTimeout(
                                  () =>
                                    setCopiedItems((prev) => ({
                                      ...prev,
                                      "setup-init": false,
                                    })),
                                  2000
                                );
                              }}
                              className="p-1 text-gray-400 rounded transition-colors cursor-pointer hover:text-white"
                              title="Copy command"
                            >
                              {copiedItems["setup-init"] ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </motion.span>
                          );
                        })()}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <SetupScriptDemo
                      isVisible={expandedAccordion === "setup-script"}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="container-management"
                  className="rounded-lg border border-slate-600/30 bg-slate-800/20"
                >
                  <AccordionTrigger className="px-4 py-3 rounded-t-lg hover:bg-slate-700/30">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center space-x-3">
                        <PlayIconAnimated />
                        <div className="text-left">
                          <h5 className="font-medium text-white">
                            Container Management
                          </h5>
                          <p className="text-xs text-gray-400">
                            macro docker helper script with micro embedded
                            docker commands
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 text-xs text-left text-cyan-300 rounded bg-slate-700">
                          pnpm docker:manage
                        </code>
                        {(() => {
                          const { ref, isIntersecting } =
                            useIntersectionObserver({
                              triggerOnce: true,
                              threshold: 0.2,
                            });

                          return (
                            <motion.span
                              ref={ref}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={
                                isIntersecting
                                  ? { scale: 1, opacity: 1 }
                                  : { scale: 0, opacity: 0 }
                              }
                              transition={{ duration: 0.3, delay: 0.6 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  "pnpm docker:manage"
                                );
                                setCopiedItems({
                                  ...copiedItems,
                                  "docker-manage": true,
                                });
                                setTimeout(
                                  () =>
                                    setCopiedItems((prev) => ({
                                      ...prev,
                                      "docker-manage": false,
                                    })),
                                  2000
                                );
                              }}
                              className="p-1 text-gray-400 rounded transition-colors cursor-pointer hover:text-white"
                              title="Copy command"
                            >
                              {copiedItems["docker-manage"] ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </motion.span>
                          );
                        })()}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <ContainerManagementDemo
                      isVisible={expandedAccordion === "container-management"}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="api-deployment"
                  className="rounded-lg border border-slate-600/30 bg-slate-800/20"
                >
                  <AccordionTrigger className="px-4 py-3 rounded-t-lg hover:bg-slate-700/30">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center space-x-3">
                        <CodeIconAnimated />
                        <div className="text-left">
                          <h5 className="font-medium text-white">
                            API Generation
                          </h5>
                          <p className="text-xs text-gray-400">
                            To deploy new API endpoints from the convex app to
                            the web app in the{" "}
                            <code className="px-2 py-1 text-sm text-cyan-300 rounded bg-slate-700">
                              generated-convex.ts
                            </code>{" "}
                            file
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 text-xs text-left text-cyan-300 rounded bg-slate-700">
                          pnpm convex:deploy-api
                        </code>
                        {(() => {
                          const { ref, isIntersecting } =
                            useIntersectionObserver({
                              triggerOnce: true,
                              threshold: 0.2,
                            });

                          return (
                            <motion.span
                              ref={ref}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={
                                isIntersecting
                                  ? { scale: 1, opacity: 1 }
                                  : { scale: 0, opacity: 0 }
                              }
                              transition={{ duration: 0.3, delay: 0.6 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  "pnpm convex:deploy-api"
                                );
                                setCopiedItems({
                                  ...copiedItems,
                                  "deploy-api": true,
                                });
                                setTimeout(
                                  () =>
                                    setCopiedItems((prev) => ({
                                      ...prev,
                                      "deploy-api": false,
                                    })),
                                  2000
                                );
                              }}
                              className="p-1 text-gray-400 rounded transition-colors cursor-pointer hover:text-white"
                              title="Copy command"
                            >
                              {copiedItems["deploy-api"] ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </motion.span>
                          );
                        })()}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <DeployApiDemo
                      isVisible={expandedAccordion === "api-deployment"}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="admin-key"
                  className="rounded-lg border border-slate-600/30 bg-slate-800/20"
                >
                  <AccordionTrigger className="px-4 py-3 rounded-t-lg hover:bg-slate-700/30">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center space-x-3">
                        <KeyIconAnimated />
                        <div className="text-left">
                          <h5 className="font-medium text-white">
                            Admin Key Generation
                          </h5>
                          <p className="text-xs text-gray-400">
                            to access the Convex Console (database manager)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 text-xs text-left text-cyan-300 rounded bg-slate-700">
                          pnpm get-admin-key
                        </code>
                        {(() => {
                          const { ref, isIntersecting } =
                            useIntersectionObserver({
                              triggerOnce: true,
                              threshold: 0.2,
                            });

                          return (
                            <motion.span
                              ref={ref}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={
                                isIntersecting
                                  ? { scale: 1, opacity: 1 }
                                  : { scale: 0, opacity: 0 }
                              }
                              transition={{ duration: 0.3, delay: 0.6 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  "pnpm get-admin-key"
                                );
                                setCopiedItems({
                                  ...copiedItems,
                                  "admin-key": true,
                                });
                                setTimeout(
                                  () =>
                                    setCopiedItems((prev) => ({
                                      ...prev,
                                      "admin-key": false,
                                    })),
                                  2000
                                );
                              }}
                              className="p-1 text-gray-400 rounded transition-colors cursor-pointer hover:text-white"
                              title="Copy command"
                            >
                              {copiedItems["admin-key"] ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </motion.span>
                          );
                        })()}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <AdminKeyDemo
                      isVisible={expandedAccordion === "admin-key"}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="logs-monitoring"
                  className="rounded-lg border border-slate-600/30 bg-slate-800/20"
                >
                  <AccordionTrigger className="px-4 py-3 rounded-t-lg hover:bg-slate-700/30">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center space-x-3">
                        <FileTextIconAnimated />
                        <div className="text-left">
                          <h5 className="font-medium text-white">
                            Log Monitoring
                          </h5>
                          <p className="text-xs text-gray-400">
                            prints out the last 100 logs of every container.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 text-xs text-left text-cyan-300 rounded bg-slate-700">
                          pnpm docker:logs-all
                        </code>
                        {(() => {
                          const { ref, isIntersecting } =
                            useIntersectionObserver({
                              triggerOnce: true,
                              threshold: 0.2,
                            });

                          return (
                            <motion.span
                              ref={ref}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={
                                isIntersecting
                                  ? { scale: 1, opacity: 1 }
                                  : { scale: 0, opacity: 0 }
                              }
                              transition={{ duration: 0.3, delay: 0.6 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  "pnpm docker:logs-all"
                                );
                                setCopiedItems({
                                  ...copiedItems,
                                  "logs-all": true,
                                });
                                setTimeout(
                                  () =>
                                    setCopiedItems((prev) => ({
                                      ...prev,
                                      "logs-all": false,
                                    })),
                                  2000
                                );
                              }}
                              className="p-1 text-gray-400 rounded transition-colors cursor-pointer hover:text-white"
                              title="Copy command"
                            >
                              {copiedItems["logs-all"] ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </motion.span>
                          );
                        })()}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <LogsDemo
                      isVisible={expandedAccordion === "logs-monitoring"}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              <div className="flex items-center">
                {(() => {
                  const { ref, isIntersecting } = useIntersectionObserver({
                    triggerOnce: true,
                    threshold: 0.2,
                  });

                  return (
                    <motion.div
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5 }}
                      className="flex justify-center items-center mr-4 w-10 h-10 rounded-lg bg-cyan-600/20"
                    >
                      <ExternalLink className="w-5 h-5 text-cyan-400" />
                    </motion.div>
                  );
                })()}
                <p className="text-sm text-gray-400">
                  <a
                    href="https://github.com/kessenma/go-convex-telegram-turborepo/blob/main/SETUP.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline hover:text-cyan-300"
                  >
                    Setup documentation
                  </a>{" "}
                  •
                  <a
                    href="https://github.com/kessenma/go-convex-telegram-turborepo/tree/main/apps/docker-convex"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-cyan-400 underline hover:text-cyan-300"
                  >
                    Convex backend details
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Docker Compose Assembly Timeline */}
      <div ref={secondTimelineRef} className="relative">
        <DockerComposeTimeline height={600} />
      </div>

      {/* Container Assembly */}
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-24 text-center">
          <h2 className="text-3xl font-bold text-white">One .env file</h2>
          <div className="mx-auto -mb-64 max-w-3xl text-lg leading-relaxed text-gray-300">
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <div ref={ref}>
                  <TextShimmer
                    duration={10}
                    className="text-lg font-medium"
                    isInView={isIntersecting}
                  >
                    Six connected apps.
                  </TextShimmer>
                </div>
              );
            })()}
          </div>
        </div>
        <div className="relative" style={{ height: "600px" }}>
          <Container height={600} />
        </div>

        {/* Deployment Details */}
        <div className="grid grid-cols-1 gap-6 -mt-48 md:grid-cols-3">
          <div className="p-6 rounded-xl border bg-slate-800/30 border-slate-700/30">
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <div ref={ref}>
                  <TrueFocus
                    className="mb-3 text-lg font-semibold text-white"
                    duration={3}
                    blurAmount={5}
                    playOnce={true}
                    borderColor="#53EAFD" /* blue-400 */
                    glowColor="rgba(33, 92, 99, 0.6)"
                    isInView={isIntersecting}
                  >
                    Network Isolation
                  </TrueFocus>
                </div>
              );
            })()}

            <p className="text-sm leading-relaxed text-gray-400">
              All services communicate through a secure Docker network,
              preventing external access to internal APIs when deploying
              locally. The only external connection is to the Telegram bot via
              the API key provided.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-slate-800/30 border-slate-700/30">
            <h3 className="mb-3 text-lg font-semibold text-center text-white">
              TurboRepo MonoRepo
            </h3>
            <div className="relative">
              {(() => {
                const { ref, isIntersecting } = useIntersectionObserver({
                  triggerOnce: true,
                  threshold: 0.2,
                });

                return (
                  <motion.div
                    ref={ref}
                    initial={{ x: -50, opacity: 0 }}
                    animate={
                      isIntersecting
                        ? { x: 0, opacity: 1 }
                        : { x: -50, opacity: 0 }
                    }
                    transition={{ duration: 0.5 }}
                    className="float-left flex-shrink-0 mr-3 mb-2 w-8 h-8"
                  >
                    <img
                      src="/turborepo.svg"
                      alt="TurboRepo MonoRepo"
                      className="w-full"
                    />
                  </motion.div>
                );
              })()}
              <p className="text-sm leading-relaxed text-gray-400">
                Centralized package.json with scripts for local development and
                deployment. The monorepo structure enables efficient code
                sharing and dependency management across all services in the
                architecture.
              </p>
            </div>
          </div>
          <div className="p-6 rounded-xl border bg-slate-800/30 border-slate-700/30">
            <h3 className="mb-3 text-lg font-semibold text-center text-white">
              Go Telegram Bot
            </h3>
            <p className="text-sm leading-relaxed text-gray-400">
              The Golang Telegram Bot only has one job: to intercept all
              messages and forward them to the Convex backend. Then the Next.js
              app can use the same Telegram Bot API key to send messages.
            </p>
            <div className="flex justify-center items-center mb-3 space-x-6">
              {(() => {
                const { ref, isIntersecting } = useIntersectionObserver({
                  triggerOnce: true,
                  threshold: 0.2,
                });

                return (
                  <>
                    <motion.div
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="flex-shrink-0 w-8 h-8"
                    >
                      <img
                        src="/golang.svg"
                        alt="Go"
                        className="w-full h-full"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="flex-shrink-0 w-8 h-8"
                    >
                      <img
                        src="/telegram.svg"
                        alt="Telegram"
                        className="w-full h-full"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="flex-shrink-0 w-8 h-8"
                    >
                      <img
                        src="/next-white.svg"
                        alt="Next.js"
                        className="w-full h-full"
                      />
                    </motion.div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* LLM & Vector Services Section */}
      <div className="object-center relative m-auto mt-32 mb-16">
        <div className="relative z-20 mb-8 text-left">
          <h2 className="mb-4 max-w-3xl text-2xl font-bold text-white">
            When the system is connected
          </h2>
          <div className="-mb-60 text-gray-300">
            Text documents are processed into vector embeddings using the{" "}
            <a 
              href={process.env.NEXT_PUBLIC_VECTOR_CONVERT_MODEL_HUGGINGFACE_URL || "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-300"
            >
              {process.env.NEXT_PUBLIC_VECTOR_CONVERT_MODEL || 'all-MiniLM-L6-v2'}
            </a> sentence transformer, and natural language responses are
            generated using the{" "}
            <a 
              href={process.env.NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL || "https://huggingface.co/meta-llama/Llama-2-7b-chat-hf"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-300"
            >
              {process.env.NEXT_PUBLIC_LLM_MODEL || 'Meta Llama 3.2'}
            </a> model.
          </div>
        </div>
        <div className="relative" style={{ height: "200vh" }}>
          <Activate height={600} />
        </div>

        {/* LLM Services Description */}
        <div className="-mt-48 space-y-2">
          <div className="p-6 ml-8 rounded-xl border backdrop-blur-sm bg-slate-800/50 border-slate-700/50">
            <h3 className="mb-3 text-xl font-semibold text-white">
              App: Vector Conversion
            </h3>
            <p className="mb-4 text-gray-300">
              Python (Flask) app that converts text into searchable vector
              embeddings using sentence-transformers so that the documents can
              be queried by the LLM service.
            </p>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium text-white">Key Features:</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>• Document chunking and processing</li>
                  <li>• Semantic vector generation</li>
                  <li>• Similarity search capabilities</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6 ml-8 rounded-xl border backdrop-blur-sm bg-slate-800/50 border-slate-700/50">
            <h3 className="mb-3 text-xl font-semibold text-white">
              App: Lightweight LLM
            </h3>
            <p className="mb-4 text-gray-300">
              FastAPI service running the{" "}
              <a 
                href={process.env.NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL || "https://huggingface.co/meta-llama/Llama-2-7b-chat-hf"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                {process.env.NEXT_PUBLIC_LLM_MODEL || 'Meta Llama 3.2'}
              </a> model for natural language
              generation and document-based Q&A.
            </p>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium text-white">
                  Model Specifications:
                </h4>
                <ul className="space-y-1 text-gray-400">
                  <li>
                    •{" "}
                    <a 
                      href={process.env.NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL || "https://huggingface.co/meta-llama/Llama-2-7b-chat-hf"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      {process.env.NEXT_PUBLIC_LLM_MODEL || 'Meta Llama 3.2'}
                    </a> is a large language model
                    developed by Meta, designed for natural language understanding
                    and generation tasks with improved performance and efficiency.
                  </li>
                  <li>• Advanced transformer architecture</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6 mr-8 bg-gradient-to-r rounded-xl border from-cyan-900/20 to-blue-900/20 border-cyan-700/30">
            <h3 className="mb-3 text-xl font-semibold text-cyan-100">
              RAG Pipeline Flow
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
              <div className="text-center">
                {(() => {
                  const { ref, isIntersecting } = useIntersectionObserver({
                    triggerOnce: true,
                    threshold: 0.2,
                  });

                  return (
                    <motion.div
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5 }}
                      className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-white bg-cyan-600 rounded-full"
                    >
                      1
                    </motion.div>
                  );
                })()}
                <h4 className="mb-1 font-medium text-left text-cyan-100">
                  Document Upload
                </h4>
                <p className="text-left text-cyan-200/80">
                  User uploads documents via web interface
                </p>
              </div>
              <div className="text-center">
                {(() => {
                  const { ref, isIntersecting } = useIntersectionObserver({
                    triggerOnce: true,
                    threshold: 0.2,
                  });

                  return (
                    <motion.div
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-white bg-cyan-600 rounded-full"
                    >
                      2
                    </motion.div>
                  );
                })()}
                <h4 className="mb-1 font-medium text-left text-cyan-100">
                  Vector Processing
                </h4>
                <p className="text-left text-cyan-200/80">
                  Vector service chunks and embeds content
                </p>
              </div>
              <div className="text-center">
                {(() => {
                  const { ref, isIntersecting } = useIntersectionObserver({
                    triggerOnce: true,
                    threshold: 0.2,
                  });

                  return (
                    <motion.div
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-white bg-cyan-600 rounded-full"
                    >
                      3
                    </motion.div>
                  );
                })()}
                <h4 className="mb-1 font-medium text-left text-cyan-100">
                  Query Matching
                </h4>
                <p className="text-left text-cyan-200/80">
                  User questions find relevant document chunks
                </p>
              </div>
              <div className="text-center">
                {(() => {
                  const { ref, isIntersecting } = useIntersectionObserver({
                    triggerOnce: true,
                    threshold: 0.2,
                  });

                  return (
                    <motion.div
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-white bg-cyan-600 rounded-full"
                    >
                      4
                    </motion.div>
                  );
                })()}
                <h4 className="mb-1 font-medium text-left text-cyan-100">
                  LLM Response
                </h4>
                <p className="text-left text-cyan-200/80">
                  <a 
                    href={process.env.NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL || "https://huggingface.co/meta-llama/Llama-2-7b-chat-hf"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    {process.env.NEXT_PUBLIC_LLM_MODEL || 'Meta Llama 3.2'}
                  </a> generates contextual answers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coolify Cloud Deployment Timeline */}
      <div className="mx-auto mb-32 max-w-6xl">
        <div className="mb-12 text-center">
          {/* <h2 className="mb-4 text-3xl font-bold text-white">Cloud Deployment</h2> */}
          <div className="mb-4">
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <div ref={ref}>
                  <DecryptedText
                    text="Cloud Deployment"
                    className="text-3xl font-bold text-white"
                    animateOn="view"
                    sequential={true}
                    speed={200}
                    maxIterations={15}
                  />
                </div>
              );
            })()}
          </div>
          {(() => {
            const { ref, isIntersecting } = useIntersectionObserver({
              triggerOnce: true,
              threshold: 0.2,
            });

            return (
              <motion.div
                ref={ref}
                initial={{ y: 20, opacity: 0 }}
                animate={
                  isIntersecting ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }
                }
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-300"
              >
                Since everything is containerized, deploying this RAG chatbot to
                your cloud provider of choice is quite easy.
              </motion.div>
            );
          })()}
        </div>
        <CoolifyTimeline height={600} />

        {/* Deployment Features */}
        <div className="grid grid-cols-1 gap-6 mt-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-gradient-to-br rounded-xl border border-cyan-900 from-cyan-0/20 to-cyan-900/20">
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <motion.h3
                  ref={ref}
                  initial={{ y: 20, opacity: 0 }}
                  animate={
                    isIntersecting
                      ? { y: 0, opacity: 1 }
                      : { y: 20, opacity: 0 }
                  }
                  transition={{ duration: 0.5 }}
                  className="mb-3 text-lg font-semibold text-cyan-300"
                >
                  Thoughtful State Management
                </motion.h3>
              );
            })()}
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <motion.p
                  ref={ref}
                  initial={{ y: 20, opacity: 0 }}
                  animate={
                    isIntersecting
                      ? { y: 0, opacity: 1 }
                      : { y: 20, opacity: 0 }
                  }
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-sm leading-relaxed text-cyan-200/90"
                >
                  Zustand is used to manage client side application state in
                  Next.js. GoLang manages a chronological process queue for
                  incoming messages to be saved to the Convex database. Convex
                  comes with built-in web-sockets for real-time data updates,
                  and the python apps are stateless and will only accept one
                  request at a time. if a python process (chat generation or
                  vector conversion) is currently running new processes will be
                  denied till the current process is done.
                </motion.p>
              );
            })()}
          </div>
          <div className="p-6 bg-gradient-to-br rounded-xl border border-cyan-900 from-cyan-0/20 to-cyan-900/20">
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <motion.h3
                  ref={ref}
                  initial={{ y: 20, opacity: 0 }}
                  animate={
                    isIntersecting
                      ? { y: 0, opacity: 1 }
                      : { y: 20, opacity: 0 }
                  }
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mb-3 text-lg font-semibold text-cyan-200"
                >
                  Health Monitoring
                </motion.h3>
              );
            })()}
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <motion.p
                  ref={ref}
                  initial={{ y: 20, opacity: 0 }}
                  animate={
                    isIntersecting
                      ? { y: 0, opacity: 1 }
                      : { y: 20, opacity: 0 }
                  }
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-sm leading-relaxed text-cyan-200/90"
                >
                  The settings modal include docker container health checks for
                  the Convex database and the LLM + vector sentence transformer.
                  Checks are every 30 seconds.
                </motion.p>
              );
            })()}
          </div>
          <div className="p-6 bg-gradient-to-br rounded-xl border border-cyan-900 from-cyan-0/20 to-cyan-900/20">
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <motion.h3
                  ref={ref}
                  initial={{ y: 20, opacity: 0 }}
                  animate={
                    isIntersecting
                      ? { y: 0, opacity: 1 }
                      : { y: 20, opacity: 0 }
                  }
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mb-3 text-lg font-semibold text-cyan-100"
                >
                  Ready to integrate Telegram Bot
                </motion.h3>
              );
            })()}
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <motion.p
                  ref={ref}
                  initial={{ y: 20, opacity: 0 }}
                  animate={
                    isIntersecting
                      ? { y: 0, opacity: 1 }
                      : { y: 20, opacity: 0 }
                  }
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-sm leading-relaxed text-cyan-200/90"
                >
                  The Telegram bot is not currently connected to the LLM yet. I
                  was not sure if I wanted to allow uploading documents from the
                  Telegram bot or how to integrate it with the LLM. It works as
                  a stand alone messaging application currently and text
                  messages are saved. Media (audio notes, picture/video) are not
                  saved currently. One of my goals when building this was to
                  allow organizations to self-host this app in their local
                  docker containers and then connect their app to the world
                  using the Telegram Bot.
                </motion.p>
              );
            })()}
          </div>
          <div className="p-6 bg-gradient-to-br rounded-xl border border-cyan-900 from-cyan-0/20 to-cyan-900/20">
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <motion.h3
                  ref={ref}
                  initial={{ y: 20, opacity: 0 }}
                  animate={
                    isIntersecting
                      ? { y: 0, opacity: 1 }
                      : { y: 20, opacity: 0 }
                  }
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mb-3 text-lg font-semibold text-cyan-50"
                >
                  Modern backend server languages
                </motion.h3>
              );
            })()}
            {(() => {
              const { ref, isIntersecting } = useIntersectionObserver({
                triggerOnce: true,
                threshold: 0.2,
              });

              return (
                <motion.p
                  ref={ref}
                  initial={{ y: 20, opacity: 0 }}
                  animate={
                    isIntersecting
                      ? { y: 0, opacity: 1 }
                      : { y: 20, opacity: 0 }
                  }
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-sm leading-relaxed text-cyan-200/90"
                >
                  The Telegram bot runs on a Golang server, and Convex +
                  TurboRepo both are built with Rust. Python (not that
                  efficient) is only used for LLM services.
                </motion.p>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Docker Summary */}
      <div className="mx-auto mb-12 max-w-4xl">
        <div className="p-8 bg-gradient-to-r rounded-2xl border backdrop-blur-sm from-slate-800/40 to-slate-700/40 border-slate-600/30">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              {(() => {
                const { ref, isIntersecting } = useIntersectionObserver({
                  triggerOnce: true,
                  threshold: 0.2,
                });

                return (
                  <motion.h3
                    ref={ref}
                    initial={{ y: 20, opacity: 0 }}
                    animate={
                      isIntersecting
                        ? { y: 0, opacity: 1 }
                        : { y: 20, opacity: 0 }
                    }
                    transition={{ duration: 0.5 }}
                    className="mb-4 text-lg font-semibold text-white"
                  >
                    Docker containers : ports : apps:
                  </motion.h3>
                );
              })()}
              <ul className="space-y-2 text-gray-300">
                {(() => {
                  const { ref, isIntersecting } =
                    useIntersectionObserver<HTMLLIElement>({
                      triggerOnce: true,
                      threshold: 0.2,
                    });

                  return (
                    <motion.li
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="flex items-center"
                    >
                      <div className="mr-3 w-2 h-2 bg-cyan-50 rounded-full"></div>
                      Convex Backend Database (Port 3210)
                    </motion.li>
                  );
                })()}
                {(() => {
                  const { ref, isIntersecting } =
                    useIntersectionObserver<HTMLLIElement>({
                      triggerOnce: true,
                      threshold: 0.2,
                    });

                  return (
                    <motion.li
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="flex items-center"
                    >
                      <div className="mr-3 w-2 h-2 bg-cyan-50 rounded-full"></div>
                      Convex Admin Dashboard (Port 6791)
                    </motion.li>
                  );
                })()}
                {(() => {
                  const { ref, isIntersecting } =
                    useIntersectionObserver<HTMLLIElement>({
                      triggerOnce: true,
                      threshold: 0.2,
                    });

                  return (
                    <motion.li
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="flex items-center"
                    >
                      <div className="mr-3 w-2 h-2 bg-cyan-500 rounded-full"></div>
                      Next.js Web Application (Port 3000)
                    </motion.li>
                  );
                })()}
                {(() => {
                  const { ref, isIntersecting } =
                    useIntersectionObserver<HTMLLIElement>({
                      triggerOnce: true,
                      threshold: 0.2,
                    });

                  return (
                    <motion.li
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="flex items-center"
                    >
                      <div className="mr-3 w-2 h-2 bg-cyan-50 rounded-full"></div>
                      Golang Telegram Bot
                    </motion.li>
                  );
                })()}
                {(() => {
                  const { ref, isIntersecting } =
                    useIntersectionObserver<HTMLLIElement>({
                      triggerOnce: true,
                      threshold: 0.2,
                    });

                  return (
                    <motion.li
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="flex items-center"
                    >
                      <div className="mr-3 w-2 h-2 bg-cyan-50 rounded-full"></div>
                      Vector Conversion Service (Port 8081)
                    </motion.li>
                  );
                })()}
                {(() => {
                  const { ref, isIntersecting } =
                    useIntersectionObserver<HTMLLIElement>({
                      triggerOnce: true,
                      threshold: 0.2,
                    });

                  return (
                    <motion.li
                      ref={ref}
                      initial={{ x: -50, opacity: 0 }}
                      animate={
                        isIntersecting
                          ? { x: 0, opacity: 1 }
                          : { x: -50, opacity: 0 }
                      }
                      transition={{ duration: 0.5, delay: 0.6 }}
                      className="flex items-center"
                    >
                      <div className="mr-3 w-2 h-2 bg-cyan-50 rounded-full"></div>
                      Lightweight LLM Service (Port 8082)
                    </motion.li>
                  );
                })()}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Extended spacer for smooth animation completion */}
      <div className="h-32"></div>
    </div>
  );
}
