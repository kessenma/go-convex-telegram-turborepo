"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { BackgroundBeams } from "./components/ui/background-beams";
import { Hero } from "./components/ui/hero";
import { StatCard } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { MessageSquareCode, MessagesSquare, MessageSquareShare, DatabaseZapIcon, FileSearch } from "lucide-react";




export default function Home(): React.ReactNode {
  const messages = useQuery(api.messages.getAllMessages, { limit: 5 });
  const messageCount = messages?.length || 0;

  return (
    <div className="flex relative flex-col justify-center items-center px-4 py-20 min-h-screen">
      <BackgroundBeams />
      <main className="relative z-10 mx-auto max-w-4xl text-center">
        <Hero 
          title="Telegram Next.js Bot Boilerplate"
          subtitle="Monitor and view your Telegram bot messages in real-time"
        >
          {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME && (
            <p className="mb-8 text-lg">
              Bot username: <a
                href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-500 transition-colors hover:text-blue-300"
              >
                t.me/{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
              </a>
            </p>
          )}
        </Hero>

        <div className="grid grid-cols-1 gap-6 mb-12 md:grid-cols-2">
          <StatCard 
            title="Total Messages" 
            value={messages === undefined ? "Loading..." : messageCount} 
          />
          <StatCard 
            title="Database Status" 
            value={messages === undefined ? "Connecting..." : "Connected"} 
          />
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button href="/messages" variant="secondary">
            <MessageSquareCode className="mr-2 w-4 h-4" />
            View Messages
          </Button>
          <Button href="/threads" variant="secondary">
            <MessagesSquare className="mr-2 w-4 h-4" />
            Browse Threads
          </Button>
          <Button href="/send" variant="secondary">
            <MessageSquareShare className="mr-2 w-4 h-4" />
            Send Message
          </Button>
          <Button href="/RAG-upload" variant="secondary">
            <FileSearch className="mr-2 w-4 h-4" />
            RAG Upload
          </Button>
          <Button href="/convex-web-console-directions" variant="secondary">
            <DatabaseZapIcon className="mr-2 w-4 h-4" />
            Convex Console
          </Button>
        </div>
      </main>
    </div>
  );
}
