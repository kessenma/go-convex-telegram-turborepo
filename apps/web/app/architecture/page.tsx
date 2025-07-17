'use client';

import { ArchitectureTimeline } from '../../components/ui/three/architecture-timeline11';
import { DockerComposeTimeline } from '../../components/ui/three/docker-compose-timeline';
import { CoolifyTimeline } from '../../components/ui/three/coolify-timeline';
import { Container } from '../../components/ui/three/container';
import { Hero, TextAnimationType } from '../../components/ui/hero';
import { SparklesCore } from "../../components/ui/sparkles";
import { GridBackground } from "../../components/ui/backgrounds/grid-background";
import { Card } from "../../components/ui/card";
import { useAnimationSettings } from "../../hooks/use-animation-settings";
import { useArchitectureStore } from "../../stores/architecture-store";
import { useEffect, useRef, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Check, Copy, Info } from "lucide-react";

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
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-800 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      {/* Header */}
      <Hero
        title="Architecture"
        subtitle="Did I know how to make an LLM app before this? No."
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

      <p>
        Docker is used to connect all these apps together.
      </p>

      <div className="flex justify-center mb-8">
        <Accordion className="pr-8 pl-8 w-full max-w-3xl text-left rounded-xl border-2 hover:border-white hover:border-2 border-white/10">
          <AccordionItem value="docker">
            <AccordionTrigger className="mt-4 mb-4 text-left hover:no-underline group">
              <div className="flex justify-between w-full text-left">
                <Info className="mr-3 w-5 h-5 text-left text-curious-cyan-600 dark:text-curious-cyan-400" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">This app runs on one Docker-compose.yaml file and 6 Dockerfile's</span>
                <div className="ml-3 h-px bg-gray-300 dark:bg-gray-600 flex-1 max-w-[100px] group-hover:bg-curious-cyan-400 transition-colors"></div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4 space-y-3 text-left">
                <p className="italic text-left text-gray-900 dark:text-white">
                  <u>More docker info here:</u>
                </p>
                <li>
                  https://github.com/kessenma/go-convex-telegram-turborepo/blob/main/SETUP.md
                </li>
                <li>
                  https://github.com/kessenma/go-convex-telegram-turborepo/tree/main/apps/docker-convex
                </li>
                <p> once you run this script from the root of the repo:</p>
                <code className="flex-1 text-sm text-gray-800 bg-gray-300">
                  pnpm setup-init
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('pnpm setup-init');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-1 ml-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Copy command"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <p> you can then manage these containers from the Docker console on your computer. via docker commands in terminal. Or I also have this script to assist with hearding the docker containers + networks</p>
                <code className="flex-1 text-sm text-gray-800 bg-gray-300">
                  pnpm docker:manage
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('pnpm docker:manage');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-1 ml-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Copy command"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>


    

      {/* Docker Compose Assembly Timeline */}
      <div ref={secondTimelineRef} className="relative">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">Service Assembly</h2>
          <p className="text-gray-300">Watch as individual services come together to form the complete architecture</p>
        </div>
        <DockerComposeTimeline height={600} />
      </div>

      {/* Container Assembly */}
      <div className="relative mt-32 mb-16">
        <div className="mb-8 text-center relative z-20">
          <h2 className="mb-4 text-2xl font-bold text-white">Containerization</h2>
          <p className="text-gray-300">Services slide into Docker containers for consistent deployment</p>
        </div>
        <div className="relative" style={{ height: '600px' }}>
          <Container height={600} />
        </div>
      </div>

      {/* Deployment Transition Card */}
      <div className="flex relative justify-center mt-16 mb-32">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r rounded-2xl blur-xl from-green-400/20 via-cyan-500/20 to-blue-500/20"></div>
          <Card className="relative max-w-2xl backdrop-blur-xl bg-slate-900/80 border-green-400/30">
            <div className="py-8 text-center">
              <h3 className="mb-4 text-2xl font-bold text-white">
                Ready for Deployment
              </h3>
              <p className="text-lg leading-relaxed text-gray-300">
                Containerized services are now ready to be deployed to the cloud using Coolify,
                with automated CI/CD pipelines and real-time monitoring.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Coolify Cloud Deployment Timeline */}
      <div className="relative">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">Cloud Deployment</h2>
          <p className="text-gray-300">Services connect to Coolify for automated deployment and scaling</p>
        </div>
        <CoolifyTimeline height={600} />
      </div>

      {/* Extended spacer for smooth animation completion */}
      <div className="h-screen"></div>

    </div>
  );
}
