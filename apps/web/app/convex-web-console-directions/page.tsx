"use client";

import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Hero } from "../../components/ui/hero";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../../components/ui/accordion";
import { BackgroundGradient } from "../../components/ui/backgrounds/background-gradient";
import { Timeline } from "../../components/ui/timeline";
import { AuroraBackground } from "../../components/ui/backgrounds/aurora-background";
import { cn } from "../../lib/utils";
import { Database, ExternalLink, Info, ArrowRight, Terminal, Key, Eye, EyeOff, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { StatusIndicator } from "../../components/ui/status-indicator";
import { useAnimationSettings } from "../../hooks/use-animation-settings";

export default function ConvexWebConsoleDirectionsPage(): React.ReactElement {
  const { animationEnabled } = useAnimationSettings();
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAurora, setShowAurora] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const dashboardPort = process.env.NEXT_PUBLIC_CONVEX_DASHBOARD_PORT || '6791';
  const convexPort = process.env.NEXT_PUBLIC_CONVEX_PORT || '3210';
  const dashboardUrl = `http://localhost:${dashboardPort}`;
  const deploymentUrl = `http://localhost:${convexPort}`;
  
  // TODO: Replace with HTTP API call
  const isConnected = true;
  const connectionStatus = "connected";

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Gradually fade aurora as user scrolls, completely hide after 120vh
      const heroHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      setShowAurora(currentScrollY < heroHeight * 1.2);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const timelineData = [
    {
      title: "Step 1",
      content: (
        <Card className="bg-gray-900/90 border-gray-700/50">
        <div className="text-left">
          <div className="flex items-center mb-4">
            <Terminal className="mr-2 w-6 h-6 text-curious-cyan-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Get Admin Key
            </h3>
          </div>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
             First, navigate to your project root directory (where you cloned the repo) and generate an admin key (when your docker convex app is running):
           </p>
           <div className="mb-4 space-y-3">
             <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
               <div className="flex justify-between items-center">
                 <code className="flex-1 text-sm text-gray-800 dark:text-gray-200">
                   cd /path/to/go-convex-telegram-turborepo
                 </code>
               </div>
             </div>
             <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
               <div className="flex justify-between items-center">
                 <code className="flex-1 text-sm text-gray-800 dark:text-gray-200">
                   pnpm run get-admin-key
                 </code>
                 <button
                   onClick={() => {
                     navigator.clipboard.writeText('npm run get-admin-key');
                     setCopied(true);
                     setTimeout(() => setCopied(false), 2000);
                   }}
                   className="p-1 ml-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                   title="Copy command"
                 >
                   {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                 </button>
               </div>
             </div>
           </div>
           <p className="text-sm text-gray-500 dark:text-gray-400">
             This will generate a unique admin key that you&apos;ll need to access the dashboard.
           </p>
        </div>
        </Card>
      ),
    },
    {
      title: "Step 2",
      content: (
         <div className="w-full text-left">
          <Card className="mb-2 bg-gray-900/90 border-gray-700/50">
                <div className="flex justify-center items-center rounded-3xl -py-4">
                  <h3 className="text-xl font-semibold text-white">
                    Login to Dashboard
                  </h3>
                </div>
            </Card>
          
            <BackgroundGradient className="rounded-[22px] p-6 bg-white dark:bg-zinc-900">
              {/* Convex Logo Card */}
              <Card className="mb-2 bg-gray-900/90 border-gray-700/50">
                <div className="flex justify-center items-center -py-4">
                  <img 
                    src="https://docs.convex.dev/img/convex-dark.svg" 
                    alt="Convex Logo" 
                    className="h-8"
                  />
                </div>
              </Card>
              
              {/* Deployment URL Card */}
              <Card className="mb-4">
                <div className="text-left">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Deployment URL
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                    <code className="text-sm text-gray-800 dark:text-gray-200">
                      {deploymentUrl}
                    </code>
                  </div>
                </div>
              </Card>
              
              {/* Admin Key Card */}
              <Card className="mb-4">
                <div className="text-left">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Admin Key
                  </label>
                  <div className="relative">
                    <div className="px-3 py-2 pr-10 bg-gray-50 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                      <code className="text-sm text-gray-800 dark:text-gray-200">
                        {showAdminKey ? 'your-generated-admin-key-here' : '••••••••••••••••••••••••••••'}
                      </code>
                    </div>
                    <button
                      onClick={() => setShowAdminKey(!showAdminKey)}
                      className="absolute right-2 top-1/2 text-gray-500 transform -translate-y-1/2 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showAdminKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    The admin key is required every time you open the dashboard.
                  </p>
                </div>
              </Card>
              
              {/* Login Button Card */}
              <Card className="">
                <Button 
                  href={dashboardUrl}
                  variant="secondary" 
                  className="w-full text-white bg-curious-cyan-600 hover:bg-curious-cyan-700 border-curious-cyan-600"
                >
                  <Key className="mr-2 w-4 h-4" />
                  Log In
                </Button>
              </Card>
            </BackgroundGradient>
        </div>
      ),
    },
    {
      title: "Step 3",
      content: (
        <div className="w-full text-left">
          <Card className="mb-2 bg-gray-900/90 border-gray-700/50">
                <div className="flex justify-center items-center rounded-2xl -py-4">
                  <h3 className="text-xl font-semibold text-white">
                    What You&apos;ll See After Login
                  </h3>
                </div>
            </Card>
          <div className="mx-auto max-w-2xl">
            <BackgroundGradient className="rounded-[22px] p-6 bg-white dark:bg-zinc-900">
              {/* Dashboard Header */}
              <Card className="mb-4 bg-curious-cyan-950 border-curious-cyan-800">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <img 
                      src="https://docs.convex.dev/img/convex-dark.svg" 
                      alt="Convex Logo" 
                      className="mr-3 h-6"
                    />
                    <span className="font-semibold text-white">Convex Dashboard</span>
                  </div>
                  <div className="text-sm text-curious-cyan-300">Health: ✓</div>
                </div>
              </Card>
              
              {/* Navigation Tabs */}
              <Card className="mb-4">
                <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
                  <div className="px-3 py-1 text-sm font-medium text-white rounded bg-curious-cyan-600">Tables</div>
                  <div className="px-3 py-1 text-sm text-gray-600 rounded dark:text-gray-400">Data</div>
                  <div className="px-3 py-1 text-sm text-gray-600 rounded dark:text-gray-400">Functions</div>
                  <div className="px-3 py-1 text-sm text-gray-600 rounded dark:text-gray-400">Files</div>
                  <div className="px-3 py-1 text-sm text-gray-600 rounded dark:text-gray-400">Schedules</div>
                  <div className="px-3 py-1 text-sm text-gray-600 rounded dark:text-gray-400">Logs</div>
                </div>
              </Card>
              
              {/* Tables List */}
              <Card className="mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-1 items-center min-w-0">
                      <Database className="flex-shrink-0 mr-2 w-4 h-4 text-curious-cyan-500" />
                      <span className="font-medium text-gray-900 truncate dark:text-white">telegram_messages</span>
                    </div>
                    <span className="flex-shrink-0 ml-2 text-sm text-gray-500 dark:text-gray-400">5 documents</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-1 items-center min-w-0">
                      <Database className="flex-shrink-0 mr-2 w-4 h-4 text-curious-cyan-500" />
                      <span className="font-medium text-gray-900 truncate dark:text-white">telegram_threads</span>
                    </div>
                    <span className="flex-shrink-0 ml-2 text-sm text-gray-500 dark:text-gray-400">1 document</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div className="flex flex-1 items-center min-w-0">
                      <Database className="flex-shrink-0 mr-2 w-4 h-4 text-curious-cyan-500" />
                      <span className="font-medium text-gray-900 truncate dark:text-white">+ Create Table</span>
                    </div>
                    <ArrowRight className="flex-shrink-0 ml-2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Card>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-curious-cyan-50 dark:bg-curious-cyan-950 border-curious-cyan-200 dark:border-curious-cyan-800">
                  <div className="text-center">
                    <Database className="mx-auto mb-2 w-6 h-6 text-curious-cyan-600 dark:text-curious-cyan-400" />
                    <p className="text-sm font-medium text-curious-cyan-900 dark:text-curious-cyan-100">Browse Data</p>
                    <p className="text-xs text-curious-cyan-700 dark:text-curious-cyan-300">View & edit records</p>
                  </div>
                </Card>
                <Card className="bg-curious-cyan-50 dark:bg-curious-cyan-950 border-curious-cyan-200 dark:border-curious-cyan-800">
                  <div className="text-center">
                    <Terminal className="mx-auto mb-2 w-6 h-6 text-curious-cyan-600 dark:text-curious-cyan-400" />
                    <p className="text-sm font-medium text-curious-cyan-900 dark:text-curious-cyan-100">Function Logs</p>
                    <p className="text-xs text-curious-cyan-700 dark:text-curious-cyan-300">Monitor activity</p>
                  </div>
                </Card>
              </div>
            </BackgroundGradient>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Aurora Background - Full Screen Behind Everything with Parallax */}
       {showAurora && (
         <AuroraBackground 
           showRadialGradient={true}
           className="fixed inset-0 z-0"
           animationEnabled={animationEnabled}
           style={{
             transform: `translateY(${-scrollY * 0.3}px)`,
             opacity: typeof window !== 'undefined' 
               ? Math.max(0, 1 - (scrollY / (window.innerHeight * 1.0))) 
               : 1,
             transition: 'opacity 0.3s ease-out'
           }}
         >
           <div></div>
         </AuroraBackground>
       )}
      
      {/* Grid Background with Gradient Transition */}
       <div
         className={cn(
           "absolute inset-0 z-10 transition-all duration-700 ease-out",
           "[background-size:40px_40px]"
         )}
         style={{
           backgroundImage: (() => {
              const scrollProgress = scrollY / (typeof window !== 'undefined' ? window.innerHeight : 800);
              const opacity = 0.2 + scrollProgress * 0.4;
              
              if (showAurora) {
                return `linear-gradient(to right, rgba(228,228,231,${opacity * 0.5}) 1px, transparent 1px), linear-gradient(to bottom, rgba(228,228,231,${opacity * 0.5}) 1px, transparent 1px)`;
              }
              return 'linear-gradient(to right, rgba(228,228,231,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(228,228,231,0.4) 1px, transparent 1px)';
            })(),
           maskImage: showAurora 
             ? `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,${0.1 + (scrollY / (typeof window !== 'undefined' ? window.innerHeight : 800)) * 0.3}) 20%, rgba(0,0,0,${0.6 + (scrollY / (typeof window !== 'undefined' ? window.innerHeight : 800)) * 0.4}) 60%, black 100%)`
             : 'none',
           backgroundColor: showAurora ? 'transparent' : 'rgba(255,255,255,0.05)'
         }}
       />
      
      {/* Content Container */}
      <div className="flex relative z-20 flex-col justify-center items-center px-4 pt-24 pb-20 min-h-screen">
        {/* Hero Section */}
        <div className="mx-auto mb-8 max-w-4xl text-center">
          <Hero 
            title="Convex Web Console"
            subtitle="Access your Convex database dashboard and manage your data"
            className="mb-8"
          />
        </div>
        
        <main className="mx-auto max-w-4xl text-center">
        {/* Prerequisites Accordion */}
        <div className="mb-8">
          <Accordion className="pr-8 pl-8 w-full rounded-xl border-2 hover:border-white hover:border-2 border-white/10">
            <AccordionItem value="prerequisites">
              <AccordionTrigger className="text-left hover:no-underline group">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center">
                    <Info className="mr-3 w-5 h-5 text-curious-cyan-600 dark:text-curious-cyan-400" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Prerequisites</span>
                    <div className="ml-3 h-px bg-gray-300 dark:bg-gray-600 flex-1 max-w-[100px] group-hover:bg-curious-cyan-400 transition-colors"></div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4 space-y-3 text-left">
                  <p className="text-gray-900 dark:text-white">
                    <strong>Important:</strong> These directions only work if you have the complete Docker setup running. The Convex dashboard requires both Convex containers to be active:
                  </p>
                  <ul className="ml-4 space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
                    <li><strong>Convex Backend Container</strong> - The self-hosted Convex database (port {convexPort})</li>
                    <li><strong>Convex Dashboard Container</strong> - The web-based management interface (port {dashboardPort})</li>
                  </ul>
                  <div className="p-4 mt-4 rounded-lg">
                    <p className="mb-2 text-sm text-gray-900 dark:text-white">
                      <strong>To start the required services:</strong>
                    </p>
                    <div className="flex justify-between items-center">
                        <code className="flex-1 text-sm text-gray-800 bg-gray-100 dark:text-gray-200 dark:bg-gray-800">
                        pnpm setup-init
                        </code>
                        <button
                        onClick={() => {
                            navigator.clipboard.writeText('npm run get-admin-key');
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-1 ml-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="Copy command"
                        >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Run this command from the project root directory to start all Docker containers.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Dashboard Access Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
          <Card className="text-left">
            <div className="flex items-center mb-4">
              <Info className="mr-2 w-6 h-6 text-curious-cyan-500" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard Access
              </h3>
            </div>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              The Convex Dashboard is available on port <span className="px-2 py-1 font-mono rounded bg-curious-cyan-100 dark:bg-curious-cyan-900 text-curious-cyan-800 dark:text-curious-cyan-200">{dashboardPort}</span>
            </p>
            <Button 
              href={dashboardUrl} 
              variant="secondary" 
              className="w-full"
            >
              <ExternalLink className="mr-2 w-4 h-4" />
              Open Dashboard
            </Button>
          </Card>

          <Card className="text-left">
            <div className="flex items-center mb-4">
              <Database className="mr-2 w-6 h-6 text-curious-cyan-500" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Deployment URL
              </h3>
            </div>
            <div className="mb-4">
              <div className="flex gap-2 items-center mb-2">
                <StatusIndicator 
                  status={connectionStatus} 
                  size="sm"
                  showLabel={false}
                />
                <span className={`text-sm font-bold ${
                  isConnected 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Your Convex deployment is running on port <span className="px-2 py-1 font-mono rounded bg-curious-cyan-100 dark:bg-curious-cyan-900 text-curious-cyan-800 dark:text-curious-cyan-200">{convexPort}</span>
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <code className="px-2 py-1 bg-gray-100 rounded dark:bg-gray-800">
                {deploymentUrl}
              </code>
            </div>
          </Card>
        </div>

        {/* Timeline Steps */}
        <Timeline data={timelineData} />

        <Card className="mx-auto mt-6 mb-12 max-w-2xl text-left">
            <h4 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Why Convex is Powerful
            </h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <ArrowRight className="w-5 h-5 text-curious-cyan-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">Data Management</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Convex comes with a built in dashboard to manage your data without an external daatabase viewer.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <ArrowRight className="w-5 h-5 text-curious-cyan-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">Real Time Data Loading</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Convex comes with a built in web socket for react apps so you do not have to build one to enable real time stateful data loading.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <ArrowRight className="w-5 h-5 text-curious-cyan-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">Schema Visualization</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Understand your data structure and relationships at a glance
                  </p>
                </div>
              </div>
            </div>
          </Card>

        <div className="p-6 rounded-xl border bg-curious-cyan-50 dark:bg-curious-cyan-950 border-curious-cyan-200 dark:border-curious-cyan-800">
          <div className="flex justify-center items-center mb-2">
            <Info className="mr-2 w-5 h-5 text-curious-cyan-600 dark:text-curious-cyan-400" />
            <h4 className="font-semibold text-curious-cyan-900 dark:text-curious-cyan-100">
              Need Help?
            </h4>
          </div>
          <p className="text-sm text-curious-cyan-700 dark:text-curious-cyan-300">
            Visit the <a href="https://docs.convex.dev" target="_blank" rel="noopener noreferrer" className="underline hover:text-curious-cyan-600 dark:hover:text-curious-cyan-200">Convex Documentation</a> for detailed guides and tutorials.
          </p>
        </div>
        </main>
      </div>
    </div>
  );
}