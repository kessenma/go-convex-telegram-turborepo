"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Hero } from "./components/ui/hero";
import { StatCard } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { StatusIndicator } from "./components/ui/status-indicator";
import { MessageSquareCode, MessagesSquare, MessageSquareShare, DatabaseZapIcon, FileSearch } from "lucide-react";
import { LampDemo } from "./components/ui/lamps";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Home(): React.ReactNode {
  const messages = useQuery(api.messages.getAllMessages, { limit: 5 });
  const messageCount = messages?.length || 0;
  const threadStats = useQuery(api.threads.getThreadStats);
  const documentStats = useQuery(api.documents.getDocumentStats);

  return (
    <div className="flex overflow-hidden fixed inset-0 justify-center items-center">
      {/* Position the lamp as a background element */}
      <div className="absolute inset-0 z-0">
        <LampDemo className="h-full" />
      </div>
      
      {/* Main content positioned on top of the lamp */}
      <main className="flex relative z-10 flex-col justify-center items-center px-4 mx-auto w-full max-w-4xl h-full">
        <div className="p-4 mb-4 w-full max-w-3xl rounded-lg">
          <Hero 
            title="Telegram Next.js Bot Boilerplate"
            subtitle="Monitor and view your Telegram bot messages in real-time"
            whiteText={true}
            className="my-2"
          >
          {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME && (
            <p className="mb-2 text-lg">
              Bot username: <a
                href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-cyan-500 transition-colors hover:text-cyan-300"
              >
                t.me/{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
              </a>
            </p>
          )}
        </Hero>
        </div>

        <div className="p-4 w-full max-w-3xl rounded-lg">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-2">
            <Button href="/messages" variant="secondary" size="sm">
              <MessageSquareCode className="mr-2 w-4 h-4" />
              <span className="hidden sm:inline">View</span> Messages
            </Button>
            <Button href="/threads" variant="secondary" size="sm">
              <MessagesSquare className="mr-2 w-4 h-4" />
              <span className="hidden sm:inline">Browse</span> Threads
            </Button>
            <Button href="/send" variant="secondary" size="sm">
              <MessageSquareShare className="mr-2 w-4 h-4" />
              Send <span className="hidden sm:inline">Message</span>
            </Button>
            <Button href="/RAG-upload" variant="secondary" size="sm">
              <FileSearch className="mr-2 w-4 h-4" />
              RAG <span className="hidden sm:inline">Upload</span>
            </Button>
          </div>
          <div className="flex justify-center mt-3">
            <Button href="/convex-web-console-directions" variant="secondary" size="sm" className="flex items-center gap-2">
              <DatabaseZapIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Convex</span> Console
              <StatusIndicator 
                status={messages === undefined ? "connecting" : "connected"} 
                size="sm"
                showLabel={false}
              />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 w-full max-w-3xl md:grid-cols-4">
          <div className="flex items-center p-3 rounded-lg bg-black/20 backdrop-blur-sm">
            <StatCard 
              title="Messages" 
              value={messages === undefined ? "..." : messageCount.toString()} 
              className="w-full text-center"
            />
          </div>
          <div className="flex items-center p-3 rounded-lg bg-black/20 backdrop-blur-sm">
            <StatCard 
              title="Threads" 
              value={threadStats === undefined ? "..." : (threadStats.totalThreads || 0).toString()} 
              className="w-full text-center"
            />
          </div>
          <div className="flex items-center p-3 rounded-lg bg-black/20 backdrop-blur-sm">
            <StatCard 
              title="Documents" 
              value={documentStats === undefined ? "..." : (documentStats.totalDocuments || 0).toString()} 
              className="w-full text-center"
            />
          </div>
          <div className="flex items-center p-3 rounded-lg bg-black/20 backdrop-blur-sm">
            <StatCard 
              title="RAG Size" 
              value={documentStats === undefined ? "..." : formatFileSize(documentStats.totalSize || 0)} 
              className="w-full text-center"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
