'use client';

import { ArchitectureTimeline } from '../../components/ui/three/architecture-timeline11';
import { DockerComposeTimeline } from '../../components/ui/three/docker-compose-timeline';
import { CoolifyTimeline } from '../../components/ui/three/cloud-upload';
import { Container } from '../../components/ui/three/container';
import { Activate } from '../../components/ui/three/activate';
import { Hero, TextAnimationType } from '../../components/ui/hero';
import { SparklesCore } from "../../components/ui/sparkles";
import { GridBackground } from "../../components/ui/backgrounds/grid-background";
import { Card } from "../../components/ui/card";
import { useAnimationSettings } from "../../hooks/use-animation-settings";
import { useArchitectureStore } from "../../stores/architecture-store";
import { useEffect, useRef, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Car, Check, Copy, ExternalLink, Info } from "lucide-react";

export default function ArchitecturePage(): React.ReactElement {
  const { animationEnabled } = useAnimationSettings();
  const { setFirstTimelineActive, setSecondTimelineActive, setScrollProgress } = useArchitectureStore();
  const secondTimelineRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleScroll() {
      if (!secondTimelineRef.current) return;

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
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setFirstTimelineActive, setSecondTimelineActive, setScrollProgress]);

  return (
    <div className="relative px-4 mx-auto min-h-screen text-white bg-gradient-to-b from-slate-950 to-slate-800">
      <GridBackground
        gridColor="#000000"
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-800 [mask-image:radial-gradient(ellipse_at_center,transparent_70%,black)]"></div>
      {/* Header */}
      <Hero
        title="Architecture"
        subtitle="Did I know how to make an LLM app before this? No. My goal was to see how far I could push a linux server and a self-hosted convex database for a chatbot with 8gb of ram and 4 cpu cores and no GPU. The DistillGPT2 model is not that great for RAG tasks and I plan to  tinker with different libraries and models in the future."
        textAlign="center"
        titleAnimation={TextAnimationType.Shimmer}
        animationSpeed={75}
        className="mt-24 mb-6 ml-4"
      >
        {/* Sparkles Effect - Centered */}
        <div className="flex overflow-hidden relative justify-center items-center mx-auto -mt-6 -mb-40 w-full max-w-3xl h-40 rounded-md">
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-cyan-200 to-transparent h-[2px] w-3/4 blur-sm" />
          <div className="absolute top-0 left-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent transform -translate-x-1/2" />
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-[5px] w-1/4 blur-sm" />
          <div className="absolute top-0 left-1/2 w-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform -translate-x-1/2" />

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

      {/* Docker Infrastructure Overview */}
      <div className="mx-auto max-w-4xl">
        <div className="p-8 rounded-2xl border backdrop-blur-sm bg-slate-800/30 border-slate-700/30">
          <div className="flex items-center mb-6">
            <div className="flex justify-center items-center mr-4 w-10 h-10 rounded-lg bg-blue-600/20">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Docker Infrastructure</h3>
              <p className="text-sm text-gray-400">One docker-compose.yaml orchestrating six containerized services</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="leading-relaxed text-gray-300">
              Each application in the <code className="px-2 py-1 text-sm text-cyan-300 rounded bg-slate-700">apps/</code> directory
              contains its own <code className="px-2 py-1 text-sm text-cyan-300 rounded bg-slate-700">Dockerfile</code> that connects to the central <code className="px-2 py-1 text-sm text-cyan-300 rounded bg-slate-700">docker-compose.yaml </code> for unified orchestration.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium text-white">Quick Setup</h4>
                <div className="flex items-center p-3 space-x-2 rounded-lg border bg-slate-900/50 border-slate-600/30">
                  <code className="flex-1 font-mono text-sm text-cyan-300">pnpm setup-init</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('pnpm setup-init');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors rounded"
                    title="Copy command"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-white">Container Management</h4>
                <div className="flex items-center p-3 space-x-2 rounded-lg border bg-slate-900/50 border-slate-600/30">
                  <code className="flex-1 font-mono text-sm text-cyan-300">pnpm docker:manage</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('pnpm docker:manage');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors rounded"
                    title="Copy command"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              <div className="flex items-center">
                <div className="flex justify-center items-center mr-4 w-10 h-10 rounded-lg bg-blue-600/20">
                  <ExternalLink className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm text-gray-400">
                  <a href="https://github.com/kessenma/go-convex-telegram-turborepo/blob/main/SETUP.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline hover:text-cyan-300">
                    Setup documentation
                  </a> •
                  <a href="https://github.com/kessenma/go-convex-telegram-turborepo/tree/main/apps/docker-convex"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-cyan-400 underline hover:text-cyan-300">
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
      <div className="mx-auto mb-32 max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Container Orchestration</h2>
          <p className="mx-auto -mb-40 max-w-3xl text-lg leading-relaxed text-gray-300">
            Coolify (or your deployment tool of choice) uses the docker-compose.yaml file to create a unified
            docker network with shared environment variables across all containerized services.
          </p>
        </div>
        <div className="relative" style={{ height: '600px' }}>
          <Container height={600} />
        </div>

        {/* Deployment Details */}
        <div className="grid grid-cols-1 gap-6 mt-12 -mt-20 md:grid-cols-3">
          <div className="p-6 rounded-xl border bg-slate-800/30 border-slate-700/30">
            <h3 className="mb-3 text-lg font-semibold text-white">Network Isolation</h3>
            <p className="text-sm leading-relaxed text-gray-400">
              All services communicate through a secure Docker network, preventing external access to internal APIs.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-slate-800/30 border-slate-700/30">
            <h3 className="mb-3 text-lg font-semibold text-white">Environment Management</h3>
            <p className="text-sm leading-relaxed text-gray-400">
              Centralized environment variables ensure consistent configuration across all microservices.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-slate-800/30 border-slate-700/30">
            <h3 className="mb-3 text-lg font-semibold text-white">Service Discovery</h3>
            <p className="text-sm leading-relaxed text-gray-400">
              Docker Compose handles service discovery, allowing containers to communicate by service name.
            </p>
          </div>
        </div>
      </div>


      {/* LLM & Vector Services Section */}
      <div className="object-center relative m-20 mt-32 mb-16">
        <div className="relative z-20 mb-8 text-left">
          <h2 className="mb-4 max-w-3xl text-2xl font-bold text-white">When the system is connected</h2>
          <p className="-mb-60 text-gray-300"> Text documents are processed into vector embeddings using the mini-llm-v6 sentence transformer, and natural language responses are generated using the DistillGpt2 model.</p>
        </div>
        <div className="relative" style={{ height: '200vh' }}>
          <Activate height={600} />
        </div>

        {/* LLM Services Description */}
        <div className="-mt-48 space-y-8">
          <div className="p-6 rounded-xl border backdrop-blur-sm bg-slate-800/50 border-slate-700/50">
            <h3 className="mb-3 text-xl font-semibold text-white">Vector Conversion Service</h3>
            <p className="mb-4 text-gray-300">Python (Flask) app that converts text into searchable vector embeddings using sentence-transformers so that the documents can be queried by the LLM service.</p>
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

          <div className="p-6 rounded-xl border backdrop-blur-sm bg-slate-800/50 border-slate-700/50">
            <h3 className="mb-3 text-xl font-semibold text-white">Lightweight LLM Service</h3>
            <p className="mb-4 text-gray-300">FastAPI service running the DistillGPT2 model for natural language generation and document-based Q&A.</p>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium text-white">Model Specifications:</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>• DistilGPT2 (short for Distilled-GPT2) is an English-language model pre-trained with the supervision of the smallest version of Generative Pre-trained Transformer 2 (GPT-2)</li>
                  <li>• 88.2M parameters</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r rounded-xl border from-cyan-900/20 to-blue-900/20 border-cyan-700/30">
            <h3 className="mb-3 text-xl font-semibold text-cyan-100">RAG Pipeline Flow</h3>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
              <div className="text-center">
                <div className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-white bg-cyan-600 rounded-full">1</div>
                <h4 className="mb-1 font-medium text-cyan-100">Document Upload</h4>
                <p className="text-cyan-200/80">User uploads documents via web interface</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-white bg-cyan-600 rounded-full">2</div>
                <h4 className="mb-1 font-medium text-cyan-100">Vector Processing</h4>
                <p className="text-cyan-200/80">Vector service chunks and embeds content</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-white bg-cyan-600 rounded-full">3</div>
                <h4 className="mb-1 font-medium text-cyan-100">Query Matching</h4>
                <p className="text-cyan-200/80">User questions find relevant document chunks</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center items-center mx-auto mb-2 w-8 h-8 font-bold text-white bg-cyan-600 rounded-full">4</div>
                <h4 className="mb-1 font-medium text-cyan-100">LLM Response</h4>
                <p className="text-cyan-200/80">DistillGPT2 generates contextual answers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coolify Cloud Deployment Timeline */}
      <div className="mx-auto mb-32 max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Cloud Deployment</h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-300">
            Since everything is containerize, deploying this Rag chatbot to your cloud provider of choice is quite easy.
          </p>
        </div>
        <CoolifyTimeline height={600} />

        {/* Deployment Features */}
        <div className="grid grid-cols-1 gap-6 mt-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-gradient-to-br rounded-xl border from-blue-900/20 to-cyan-900/20 border-blue-700/30">
            <h3 className="mb-3 text-lg font-semibold text-blue-100">Auto Deployment</h3>
            <p className="text-sm leading-relaxed text-blue-200/80">
              Git-based deployments with automatic builds from your repository
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br rounded-xl border from-green-900/20 to-emerald-900/20 border-green-700/30">
            <h3 className="mb-3 text-lg font-semibold text-green-100">Health Monitoring</h3>
            <p className="text-sm leading-relaxed text-green-200/80">
              Real-time health checks and automatic service recovery
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br rounded-xl border from-purple-900/20 to-violet-900/20 border-purple-700/30">
            <h3 className="mb-3 text-lg font-semibold text-purple-100">SSL & Domains</h3>
            <p className="text-sm leading-relaxed text-purple-200/80">
              Automatic SSL certificates and custom domain management
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br rounded-xl border from-orange-900/20 to-red-900/20 border-orange-700/30">
            <h3 className="mb-3 text-lg font-semibold text-orange-100">Resource Scaling</h3>
            <p className="text-sm leading-relaxed text-orange-200/80">
              Dynamic resource allocation based on application demand
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Summary */}
      <div className="mx-auto mb-32 max-w-4xl">
        <div className="p-8 bg-gradient-to-r rounded-2xl border backdrop-blur-sm from-slate-800/40 to-slate-700/40 border-slate-600/30">
          <h2 className="mb-6 text-2xl font-bold text-center text-white">Complete System Overview</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Core Services</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-cyan-400 rounded-full"></div>
                  Next.js Web Application (Port 3000)
                </li>
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-blue-400 rounded-full"></div>
                  Convex Backend Database (Port 3210)
                </li>
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-green-400 rounded-full"></div>
                  Golang Telegram Bot
                </li>
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-purple-400 rounded-full"></div>
                  Vector Conversion Service (Port 8081)
                </li>
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-orange-400 rounded-full"></div>
                  Lightweight LLM Service (Port 8082)
                </li>
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-pink-400 rounded-full"></div>
                  Convex Admin Dashboard (Port 6791)
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Key Features</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-cyan-400 rounded-full"></div>
                  Real-time message synchronization
                </li>
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-blue-400 rounded-full"></div>
                  Document-based AI chat (RAG)
                </li>
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-green-400 rounded-full"></div>
                  Telegram bot integration
                </li>
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-purple-400 rounded-full"></div>
                  Vector similarity search
                </li>
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-orange-400 rounded-full"></div>
                  Local LLM inference
                </li>
                <li className="flex items-center">
                  <div className="mr-3 w-2 h-2 bg-pink-400 rounded-full"></div>
                  Containerized deployment
                </li>
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
