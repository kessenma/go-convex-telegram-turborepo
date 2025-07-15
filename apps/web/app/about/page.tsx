'use client';

import React, { useState, useEffect } from 'react';
import { TextRoll } from '../../components/ui/text-animations/text-roll';
import { TextShimmer } from '../../components/ui/text-animations/text-shimmer';
import DecryptedText from '../../components/ui/text-animations/decrypted-text';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../components/ui/accordion';
import { Card, StatCard } from '../../components/ui/card';
import { Hero, TextAnimationType } from '../../components/ui/hero';
import { MovingBorder } from '../../components/ui/moving-border';
import { SparklesCore } from '../../components/ui/sparkles';
import { FloatingCubes } from '../../components/ui/floating-cubes';
import { HoverExpand } from '../../components/ui/hover-expand-gallery';
import { Timeline } from '../../components/ui/timeline';
import LetterGlitch from '../../components/ui/backgrounds/letter-glitch';
import { MessageSquare, Code, Database, Layers, Palette, Terminal } from 'lucide-react';
import { renderIcon } from '../../lib/icon-utils';
import { cn } from '../../lib/utils';
import { useAnimationSettings } from '../../hooks/use-animation-settings';
import CodeBlock from '../../components/ui/text-animations/code-block';

export default function AboutPage() {
  const { animationEnabled } = useAnimationSettings();
  const [scrollY, setScrollY] = useState(0);
  const [showBackground, setShowBackground] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Gradually fade background as user scrolls, completely hide after 120vh
      const heroHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      setShowBackground(currentScrollY < heroHeight * 1.2);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Gallery images from app-screenshots
  const galleryImages = [
    '/app-screenshots/NextJS-convex-about.png',
    '/app-screenshots/docker-container.png',
    '/app-screenshots/NextJS-convex-about.png',
    '/app-screenshots/NextJS-home.png',
    '/app-screenshots/nextJS-messages.png',
    '/app-screenshots/nextJS-thread.png',
    '/app-screenshots/nextJS-threads.png',
    '/app-screenshots/telegram-bot-father.png',
    '/app-screenshots/telegram-chat.png'
  ];

    const secondGalleryImages = [
    '/app-screenshots/second/LLM-resource-monitor.png',
    '/app-screenshots/second/available-documents.png',
    '/app-screenshots/second/document-uploader.png',
    '/app-screenshots/second/notification-panel.png',
    '/app-screenshots/second/rag-chat-document-selector.png',
    '/app-screenshots/second/rag-chat-history.png',
    '/app-screenshots/second/rag-chat-interface.png',
    '/app-screenshots/second/system-settings.png',
    '/app-screenshots/second/uploaded-document-viewer-post-vector-embed.png',
    '/app-screenshots/second/uploaded-document-viewer-pre-vector-embed.png'
  ];

  // Timeline data for setup steps
  const setupTimelineData = [
    {
      title: "Clone Repository",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">Get the source code from GitHub</p>
          <CodeBlock 
            code="git clone https://github.com/kessenma/go-convex-telegram-turborepo.git" 
            title="Clone Command" 
            showBorder={true}
            animationSpeed={6}
          />
        </div>
      )
    },
    {
      title: "Install Dependencies",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">Navigate to project directory and install packages</p>
          <CodeBlock 
            code="cd go-convex-telegram-turborepo\npnpm install\nchmod +x setup-init.sh" 
            title="Installation Commands" 
            showBorder={true}
            animationSpeed={6}
          />
        </div>
      )
    },
    {
      title: "Run Setup",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">Execute the automated setup script</p>
          <CodeBlock 
            code="pnpm setup-init" 
            title="Setup Script" 
            showBorder={true}
            animationSpeed={6}
          />
        </div>
      )
    },
    {
      title: "Docker Containers",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">Wait for all Docker containers to spin up and initialize</p>
          <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
            <p className="text-cyan-400">This may take a few minutes depending on your system</p>
          </div>
        </div>
      )
    },
    {
      title: "Access Application",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">Open your browser and navigate to the application</p>
          <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="text-lg text-cyan-400 hover:underline">
              http://localhost:3000
            </a>
          </div>
        </div>
      )
    },
    {
      title: "Start Convex",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">Convex is a "backend as a service" built on Rust with TypeScript and PostgreSQL. It is a bit tricky to setup, but in my opinion well worth the effort.</p>
          <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="text-lg text-cyan-400 hover:underline">
              https://github.com/kessenma/go-convex-telegram-turborepo
            </a>
          </div>
        </div>
      )
    }
  ];

  // Timeline data for upload & chat process
  const uploadChatTimelineData = [
    {
      title: "Upload Document",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">Navigate to the upload page and select your document</p>
          <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
            <a href="http://localhost:3000/RAG-upload" className="text-cyan-400 hover:underline">
              http://localhost:3000/RAG-upload
            </a>
          </div>
        </div>
      )
    },
    {
      title: "Process Document",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">Scroll down to document history and open your uploaded document</p>
          <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
            <p className="text-cyan-400">Click the "Embed" button to process the document for AI search</p>
          </div>
        </div>
      )
    },
    {
      title: "Start Chatting",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">Navigate to the chat interface</p>
          <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
            <a href="http://localhost:3000/RAG-chat" className="text-cyan-400 hover:underline">
              http://localhost:3000/RAG-chat
            </a>
          </div>
        </div>
      )
    },
    {
      title: "Select Document",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">Choose your processed document from the dropdown</p>
          <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
            <p className="text-cyan-400">Only embedded documents will appear in the selection</p>
          </div>
        </div>
      )
    },
    {
      title: "Ask Questions",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">Type your question and wait for the AI response</p>
          <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
            <p className="text-cyan-400">The AI will search through your document and provide contextual answers</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="relative min-h-screen text-white bg-slate-950">
      {/* Letter Glitch Background - Full Screen Behind Everything with Parallax */}
      {showBackground && (
        <div 
          className="fixed inset-0 z-0"
          style={{
            transform: `translateY(${-scrollY * 0.3}px)`,
            opacity: typeof window !== 'undefined' 
              ? Math.max(0, 1 - (scrollY / (window.innerHeight * 1.0))) 
              : 1,
            transition: 'opacity 0.3s ease-out'
          }}
        >
          <LetterGlitch 
            glitchColors={["#005f78", "#1d293d", "#0f172b"]} 
            glitchSpeed={100} 
            smooth={true}
            centerVignette={true}
          />
        </div>
      )}

      {/* Hero Section with Hero component */}
      <div className="relative z-20 flex flex-col justify-center items-center px-4 pt-80 pb-20 min-h-[50vh] overflow-hidden">
        <div className="mx-auto max-w-4xl text-center">
          <Hero 
            title="Self-hosted RAG chatbot "
            subtitle="Features and credits"
            className="mb-8"
            titleAnimation={TextAnimationType.Decrypt}
            subtitleAnimation={TextAnimationType.Decrypt}
          />
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-20 px-4 py-16 mx-auto mb-36 max-w-6xl">
        <div className="mb-12 text-center">
            <DecryptedText
                text={'Why  did  I  build  this  app?'}
                animateOn="view"
                sequential={true}
                encryptedClassName="text-cyan-500 text-xl text-center"
                className='text-xl text-center text-cyan-500'
                speed={1}
                revealDirection='start'
                useOriginalCharsOnly={false}
            />  
          <div className="mx-auto max-w-2xl text-left">
             <DecryptedText
                text={'Honeslty, I am getting a lot of cold-calls from recruiters for AI + ML engineer roles lately and I am sick of taking their monkey-brain leetcode assessments so I would rather show my compentencey here. I also want to contrubute some meaningful open-source code that others can build off.'}
                animateOn="view"
                sequential={false}
                encryptedClassName="text-center text-white "
                className='text-center text-white'
                speed={300}
                revealDirection='start'
                useOriginalCharsOnly={true}
                />
          </div>
        </div>

        <Accordion className="mx-auto w-full max-w-3xl">
          <AccordionItem value="ui-components">
            <AccordionTrigger className="py-4 text-xl font-medium">
              <div className="flex gap-2 items-center">
                {renderIcon(Palette, { className: "w-5 h-5 text-cyan-400" })}
                <span>UI Components</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-2 text-slate-300">
              <p>Built with a collection of open source UI and animation libraries:</p>
              <ul className="pl-6 space-y-1 list-disc">
                <li>ShadCN, Radix UI, ReactBits, and Motion Primitives components for copy+paste user-interfaces</li>
                <li>Framer Motion and GSAP for animations</li>
                <li>Three.js and OGL for 3D elements</li>
                <li>Lucide for icons</li>
                <li>Sonner for notification toasts</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="development-tools">
            <AccordionTrigger className="py-4 text-xl font-medium">
              <div className="flex gap-2 items-center">
                {renderIcon(Terminal, { className: "w-5 h-5 text-cyan-400" })}
                <span>Development Tools</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-2 text-slate-300">
              <p>Developed using AI assistance:</p>
              <ul className="pl-6 space-y-1 list-disc">
                <li>Trae ($10/month) with Claude 3.7 and Claude 4 Sonnet models</li>
                <li>VS Code with GitHub Copilot and Cline plugins</li>
                <li>Vercel v0 (by far the most powerful tool on this list for me)</li>
                <li>OpenAI GPT-4 for general AI assistance</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="backend-technologies">
            <AccordionTrigger className="py-4 text-xl font-medium">
              <div className="flex gap-2 items-center">
                {renderIcon(Database, { className: "w-5 h-5 text-cyan-400" })}
                <span>Backend Technologies</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-2 text-slate-300">
              <p>Powered by:</p>
              <ul className="pl-6 space-y-1 list-disc">
                <li>Convex for storing SQL + Vector embeddings in one database</li>
                <li>WebSocket connections built-into-Convex for real-time communication</li>
                <li>Docker compose, docker network, and dockerfile's connecting everything together</li>
                <li>Langchain for breaking files into manageable chunks and then sending them to the vector embeddings</li>
                <li>all-MiniLM-L6-v2 for converting raw text to vector embeddings (so LLM's can read the data)</li>
                <li>Distilgpt2 LLM for question answering (but I do want to use a different LLM that is more capable for RAG apps)</li>
                <li>GoLang for a Telegram bot using the go-telegram api. (github.com/go-telegram/bot) </li>
                <li>Huggingface for sourcing different LLM's</li>
                <li>Psutil for ram + cpu monitoring</li>
                <li>Flask, FastAPI, and PyTorch to run the sentence transformer + LLM apps</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="messaging-capabilities">
            <AccordionTrigger className="py-4 text-xl font-medium">
              <div className="flex gap-2 items-center">
                {renderIcon(MessageSquare, { className: "w-5 h-5 text-cyan-400" })}
                <span>Messaging Capabilities</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-2 text-slate-300">
              <p>Two messaging apps in one right now</p>
              <ul className="pl-6 space-y-1 list-disc">
                <li>Telegram-message bot that allows you to send/receive messages from the web app</li>
                <li>RAG-chatbot using the distilgpt2 LLM</li>
                <li>Next up I want to connect the telegram bot with the LLM</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rag-system">
            <AccordionTrigger className="py-4 text-xl font-medium">
              <div className="flex gap-2 items-center">
                {renderIcon(Layers, { className: "w-5 h-5 text-cyan-400" })}
                <span>RAG System</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-2 text-slate-300">
              <p>Retrieval-Augmented Generation (RAG) capabilities:</p>
              <ul className="pl-6 space-y-1 list-disc">
                <li>Document upload and processing</li>
                <li>Intelligent data retrieval</li>
                <li>Context-aware AI responses</li>
                <li>Document management and organization</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="open-source">
            <AccordionTrigger className="py-4 text-xl font-medium">
              <div className="flex gap-2 items-center">
                {renderIcon(Code, { className: "w-5 h-5 text-cyan-400" })}
                <span>Open Source Foundation</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-2 text-slate-300">
              <p>Major thanks to:</p>
              <ul className="pl-6 space-y-1 list-disc">
                <li>Based on starter code from <a href="https://github.com/jovermier/convex-codespaces" className="text-cyan-400 hover:underline">github.com/jovermier/convex-codespaces</a></li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Floating Cubes Animation Section */}
      <div className="overflow-hidden absolute inset-x-0 z-10 py-16 mt-96 w-full" style={{top: 'calc(100vh + 200px)', height: '600px'}}>
        <div className="relative w-full h-full">
          <FloatingCubes
            height={600}
            width="100%"
            direction="left-to-right"
            animationEnabled={animationEnabled}
            className="w-full"
          />
        </div>
      </div>

      {/* Image Gallery Section */}
      <div id="gallery" className="relative z-30 px-4 py-16 mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Application Screenshots</h2>
          <p className="text-slate-300">Explore the different features and interfaces of the application</p>
        </div>
        
        <HoverExpand 
          images={galleryImages}
          initialSelectedIndex={0}
          thumbnailHeight={200}
          modalImageSize={400}
          maxThumbnails={9}
        />

        <div className="mt-16 mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">RAG System Interface</h2>
          <p className="text-slate-300">Detailed views of the RAG chatbot and document management system</p>
        </div>
        
        <HoverExpand 
          images={secondGalleryImages}
          initialSelectedIndex={0}
          thumbnailHeight={200}
          modalImageSize={400}
          maxThumbnails={10}
        />
      </div>

      {/* Setup Timeline Section */}
      <div id="setup" className="relative z-20 px-4 py-16 mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-cyan-400">Getting Started</h2>
          <p className="text-slate-300">Follow these steps to set up the application locally</p>
        </div>
        
        <Timeline data={setupTimelineData} titleSize="small" />
      </div>

      {/* Upload & Chat Process Timeline Section */}
      <div id="process" className="relative z-20 px-4 py-16 mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-cyan-400">Upload & Chat Process</h2>
          <p className="text-slate-300">Learn how to upload documents and start chatting with the AI</p>
        </div>
        
        <Timeline data={uploadChatTimelineData} titleSize="small" />
      </div>
    </div>
  );
}
