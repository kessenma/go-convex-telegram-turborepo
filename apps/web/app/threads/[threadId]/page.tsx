"use client";
import { TelegramMessage } from "../../../models/telegram";
import { Hero } from "../../../components/ui/hero";
import { Card } from "../../../components/ui/card";
import Link from 'next/link';
import { ArrowLeft, Send, Bot, Clock, MessageSquare, User, Hash } from 'lucide-react';
import { renderIcon } from "../../../lib/icon-utils";
import { cn } from "../../../lib/utils";
import React, { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convexApi1752607591403";
import { type GenericId as Id } from "convex/values";
import {Button} from "../../../components/ui/button";

interface ThreadDetailPageProps {
  params: Promise<{ threadId: string }>;
}

export default function ThreadDetailPage({ params }: ThreadDetailPageProps) {
  const [threadId, setThreadId] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params
  React.useEffect(() => {
    params.then(p => setThreadId(p.threadId));
  }, [params]);

  const thread = useQuery(api.threads.getThreadById, threadId ? { threadDocId: threadId as Id<"telegram_threads"> } : "skip");
  const messages = useQuery(api.messages.getMessagesByThreadDoc, threadId ? { threadDocId: threadId as Id<"telegram_threads"> } : "skip");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FRONTEND: Send message clicked ===');
    console.log('New message:', newMessage);
    console.log('Thread:', thread);
    
    if (!newMessage.trim() || !thread) {
      console.log('❌ FRONTEND: Validation failed - missing message or thread');
      return;
    }
  
    setIsLoading(true);
    setError(null);
    
    console.log('✅ FRONTEND: Starting message send process');
  
    try {
      const payload = {
        chatId: thread?.chatId || '',
        text: newMessage,
        threadDocId: threadId, // Pass the thread document ID
        messageThreadId: thread?.threadId || '', // Pass the Telegram thread ID
      };
      
      console.log('📤 FRONTEND: Sending request to thread-specific API');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('/api/telegram/send-to-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('📥 FRONTEND: Received response from API');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
  
      const result = await response.json();
      console.log('Response body:', JSON.stringify(result, null, 2));
  
      if (!response.ok) {
        console.log('❌ FRONTEND: API returned error');
        throw new Error(result.error || 'Failed to send message');
      }
      
      console.log('✅ FRONTEND: Message sent successfully');
      setNewMessage('');
    } catch (err: unknown) {
      console.error('❌ FRONTEND: Error in handleSendMessage:');
      console.error('Error type:', (err as Error)?.constructor?.name);
      console.error('Error message:', (err as Error)?.message);
      console.error('Full error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      console.log('🏁 FRONTEND: Send message process completed');
    }
  };

  if (!threadId) {
    return (
      <div className="p-6 mx-auto max-w-4xl">
        <div className="text-center text-gray-500 animate-pulse dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const loading = thread === undefined || messages === undefined;

  if (loading) {
    return (
      <div className="p-6 mx-auto max-w-4xl">
        <div className="text-center text-gray-500 animate-pulse dark:text-gray-400">Loading thread...</div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="relative min-h-screen">
        <div className="flex relative z-20 flex-col justify-center items-center px-4 pt-24 pb-20 min-h-screen">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mb-6">
              {/* @ts-expect-error */}
              <Link
                href="/threads"
                className="inline-flex gap-2 items-center font-medium text-cyan-600 transition-colors dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300"
              >
                {renderIcon(ArrowLeft, { className: "w-4 h-4" })}
                Back to Threads
              </Link>
            </div>
            <Hero title="Thread Not Found" whiteText />
            <Card className="bg-gray-900/90 border-gray-700/50">
              <p className="text-center text-gray-500 dark:text-gray-400">No messages found for this thread.</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="relative min-h-screen">
        <div className="flex relative z-20 flex-col justify-center items-center px-4 pt-24 pb-20 min-h-screen">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mb-6">
              {/* @ts-expect-error */}
              <Link
                href="/threads"
                className="inline-flex gap-2 items-center font-medium text-cyan-600 transition-colors dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300"
              >
                {renderIcon(ArrowLeft, { className: "w-4 h-4" })}
                Back to Threads
              </Link>
            </div>

            <Hero
                title={thread?.title || `Thread ${thread?.threadId || 'Unknown'}`}
                subtitle={`Chat: ${thread?.chatId || 'Unknown'} • ${messages?.length || 0} messages • ${thread?.isActive ? 'Active' : 'Inactive'}`}
                whiteText
            />

            <div className="flex flex-wrap gap-4 items-center mb-6 text-sm">
            <span
                className="inline-flex gap-2 items-center px-3 py-1 font-medium text-cyan-800 bg-cyan-100 rounded-full dark:bg-cyan-900 dark:text-cyan-200">
              {renderIcon(Hash, { className: "w-4 h-4" })}
              {thread?.chatId || 'Unknown'}
            </span>
              <span
                  className="inline-flex gap-2 items-center px-3 py-1 font-medium text-gray-800 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-200">
              {renderIcon(MessageSquare, { className: "w-4 h-4" })}
                {messages?.length || 0} messages
            </span>
              {thread && (
                  <span className={cn(
                      "inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium",
                      thread?.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  )}>
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    thread?.isActive ? "bg-green-500" : "bg-red-500"
                )}/>
                    {thread?.isActive ? 'Active' : 'Inactive'}
              </span>
              )}
            </div>

            <div className="space-y-4">
              {messages?.map((message: TelegramMessage) => (
                  <Card key={message._id}
                        className="transition-shadow bg-gray-900/90 border-gray-700/50 hover:shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3 items-center">
                        <div className="flex gap-2 items-center">
                          {message.messageType === 'bot_message' ? (
                              renderIcon(Bot, { className: "w-5 h-5 text-purple-400" })
                          ) : (
                              renderIcon(User, { className: "w-5 h-5 text-cyan-400" })
                          )}
                          {message.firstName && (
                              <span className="font-semibold text-gray-200">
                          {message.firstName} {message.lastName}
                        </span>
                          )}
                        </div>
                        {message.username && (
                            <span className="font-medium text-cyan-400">@{message.username}</span>
                        )}
                        {message.messageType === 'bot_message' && (
                            <span
                                className="inline-flex gap-2 items-center px-2 py-1 text-xs font-medium text-purple-200 rounded-full bg-purple-900/50">
                        {renderIcon(Bot, { className: "w-3 h-3" })}
                        Bot
                      </span>
                        )}
                      </div>
                      <div className="inline-flex gap-2 items-center text-sm text-gray-400">
                        {renderIcon(Clock, { className: "w-4 h-4" })}
                        {new Date(message.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="leading-relaxed text-gray-200">{message.text}</p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="inline-flex gap-2 items-center">
                    {renderIcon(Hash, { className: "w-3 h-3" })}
                    {message.messageId}
                  </span>
                      <span className="inline-flex gap-2 items-center px-2 py-1 bg-gray-800 rounded-full">
                    {renderIcon(MessageSquare, { className: "w-3 h-3" })}
                        {message.messageType}
                  </span>
                    </div>
                  </Card>
              ))}
            </div>

            {thread && thread.isActive && (
                <Card className="mt-6 bg-gray-900/90 border-gray-700/50">
                  <h3 className="flex gap-2 items-center mb-4 text-lg font-semibold text-white">
                    {renderIcon(Send, { className: "w-5 h-5 text-cyan-400" })}
                    Send Message to Thread
                  </h3>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div>
                  <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="px-4 py-3 w-full placeholder-gray-400 text-white bg-gray-800 rounded-xl border-2 border-gray-700 transition-colors focus:border-cyan-500 focus:outline-none resize-vertical"
                      rows={3}
                      disabled={isLoading}
                  />
                    </div>
                    {error && (
                        <div
                            className="flex gap-2 items-center p-4 font-medium text-red-200 rounded-xl border bg-red-900/50 border-red-700/50">
                          <div className="w-2 h-2 bg-red-500 rounded-full"/>
                          {error}
                        </div>
                    )}
                    <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || !newMessage.trim()}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 hover:ring-cyan-500"
                    >
                      Send Message
                    </Button>
                  </form>
                </Card>
            )}
          </div>
        </div>
      </div>
  );
}
