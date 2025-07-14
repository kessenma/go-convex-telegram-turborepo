"use client";
import React, { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TelegramThread } from "../../models/telegram";
import { Hero } from "../../components/ui/hero";
import { Card } from "../../components/ui/card";
import ThreadModal from './components/ThreadModal';

export default function ThreadsPage(): React.ReactElement {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const threads = useQuery(api.threads.getAllActiveThreads, { limit: 50 });
  
  const loading = threads === undefined;

  const handleThreadClick = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handleCloseModal = () => {
    setSelectedThreadId(null);
  };

  if (loading) {
    return (
      <div className="p-6 mx-auto max-w-6xl">
        <Hero title="Telegram Threads" subtitle="Loading threads..." />
        <Card className="py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading threads...</p>
        </Card>
      </div>
    );
  }



  if (!threads || threads.length === 0) {
    return (
      <div className="p-6 mx-auto max-w-6xl">
        <Hero title="Telegram Threads" subtitle="Manage your group conversations" />
        <Card className="py-12 text-center">
          <p className="mb-2 text-gray-600 dark:text-gray-400">No threads found.</p>
          <p className="text-gray-500 dark:text-gray-500">Threads will appear here when messages are sent in Telegram group threads.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto max-w-6xl">
      <Hero title="Telegram Threads" subtitle={`${threads?.length || 0} active threads`} />
      <div className="flex flex-col gap-4">
        {threads?.map((thread: TelegramThread) => (
          <div 
            key={thread._id} 
            className="transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1"
            onClick={() => handleThreadClick(thread._id)}
          >
            <Card>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {thread.title || `Thread ${thread.threadId}`}
              </h3>
              <span className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">Chat: {thread.chatId}</span>
            </div>
            
            <div className="mb-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {thread.creatorFirstName && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">Created by: {thread.creatorFirstName} {thread.creatorLastName}</span>
                )}
                {thread.creatorUsername && (
                  <span className="px-2 py-1 text-xs text-cyan-800 bg-cyan-100 rounded-full dark:bg-cyan-900 dark:text-cyan-200">@{thread.creatorUsername}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">{thread.messageCount} messages</span>
                <span>
                  Last activity: {thread.lastMessageTimestamp ? 
                    new Date(thread.lastMessageTimestamp).toLocaleString() : 
                    'Unknown'
                  }
                </span>
              </div>
            </div>

            {thread.lastMessageText && (
              <div className="p-3 mb-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                <p className="text-sm italic text-gray-700 dark:text-gray-300">{thread.lastMessageText.length > 100 ? 
                  `${thread.lastMessageText.substring(0, 100)}...` : 
                  thread.lastMessageText
                }</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="font-mono text-xs text-gray-400 dark:text-gray-500">Thread ID: {thread.threadId}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                thread.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {thread.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            </Card>
          </div>
          ))}
        </div>

      <ThreadModal
        threadId={selectedThreadId || ''}
        isOpen={selectedThreadId !== null}
        onClose={handleCloseModal}
      />
    </div>
  );
}
