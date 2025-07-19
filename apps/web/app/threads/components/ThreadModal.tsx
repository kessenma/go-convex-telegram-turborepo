"use client";
import { TelegramMessage } from "../../../models/telegram";
import React, { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../generated-convex";
import { type GenericId as Id } from "convex/values";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { X, MessagesSquare, Users, Clock, Bot, Send, AlertCircle } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../../../components/ui/accordion";
import { renderIcon } from "../../../lib/icon-utils";


interface ThreadModalProps {
  threadId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ThreadModal({ threadId, isOpen, onClose }: ThreadModalProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thread = useQuery(api.threads.getThreadById, threadId ? { threadDocId: threadId as Id<"telegram_threads"> } : "skip");
  const messages = useQuery(api.messages.getMessagesByThreadDoc, threadId ? { threadDocId: threadId as Id<"telegram_threads"> } : "skip");

  const handleSendMessage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !thread) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        chatId: thread.chatId || '',
        text: newMessage,
        threadDocId: threadId,
        messageThreadId: thread.threadId || '',
      };

      const response = await fetch('/api/telegram/send-to-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/50" onClick={handleBackdropClick}>
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-3 items-center">
            {renderIcon(MessagesSquare, { className: "w-6 h-6 text-curious-cyan-500" })}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {thread?.title || `Thread ${thread?.threadId || 'Unknown'}`}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 rounded-lg transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {renderIcon(X, { className: "w-5 h-5" })}
          </button>
        </div>

        {thread && (
          <Accordion type="single" collapsible className="border-b border-gray-200 dark:border-gray-700">
            <AccordionItem value="thread-details" className="border-none">
              <AccordionTrigger className="px-6 py-2 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="flex gap-2 items-center">
                  <span className="text-sm font-medium">Thread Details</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full ml-2",
                    messages === undefined ? "bg-yellow-500" :
                    thread?.isActive ? "bg-green-500" : "bg-red-500"
                  )} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center text-sm text-gray-600 dark:text-gray-300">
                    {renderIcon(Users, { className: "w-4 h-4" })}
                    <span>Chat: {thread?.chatId || 'Unknown'}</span>
                  </div>
                  <div className="flex gap-2 items-center text-sm text-gray-600 dark:text-gray-300">
                    {renderIcon(MessagesSquare, { className: "w-4 h-4" })}
                    <span>{thread?.messageCount || 0} messages</span>
                  </div>
                  <div className="flex gap-2 items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                      thread?.isActive 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                    )}>
                      {thread?.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}


        <div className="flex-1 overflow-y-auto p-6 min-h-[300px] max-h-[400px]">
          {messages === undefined ? (
            <div className="flex justify-center items-center h-48 text-gray-500 dark:text-gray-400">
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 rounded-full border-b-2 animate-spin border-curious-cyan-500"></div>
                Loading messages...
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-48 text-gray-500 dark:text-gray-400">
              {renderIcon(MessagesSquare, { className: "w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" })}
              <p>No messages found in this thread.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message: TelegramMessage) => {
                const isUserMessage = message.messageType !== 'bot_message';
                return (
                  <div key={message._id} className={cn(
                    "flex",
                    isUserMessage ? "justify-end" : "justify-start",
                    "w-full"
                  )}>
                    <div className={cn(
                      "max-w-[80%]",
                      isUserMessage ? "ml-auto" : "mr-auto"
                    )}>
                      <Card className={cn(
                        "p-4 bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700",
                        isUserMessage ? "bg-curious-cyan-50 dark:bg-curious-cyan-900/30" : ""
                      )}>
                        <div className="flex gap-3 items-center mb-2">
                          <div className="flex gap-2 items-center">
                            {message.firstName && (
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {message.firstName} {message.lastName}
                              </span>
                            )}
                            {message.username && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">@{message.username}</span>
                            )}
                          </div>
                          {message.messageType === 'bot_message' && (
                            <div className="flex gap-1 items-center px-2 py-1 text-xs font-medium rounded-full bg-curious-cyan-100 dark:bg-curious-cyan-900/30 text-curious-cyan-800 dark:text-curious-cyan-300">
                              {renderIcon(Bot, { className: "w-3 h-3" })}
                              Bot
                            </div>
                          )}
                        </div>
                        <div className="mb-2 leading-relaxed text-gray-700 dark:text-gray-300">
                          <p>{message.text}</p>
                        </div>
                        <div className="flex gap-1 justify-end items-center text-xs text-gray-500 dark:text-gray-400">
                          {renderIcon(Clock, { className: "w-3 h-3" })}
                          {new Date(message.timestamp).toLocaleString()}
                        </div>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {thread && thread?.isActive && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    id="message-input"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="px-4 py-3 pr-12 w-full placeholder-gray-500 text-gray-900 bg-white rounded-lg border border-gray-300 transition-colors resize-none dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-curious-cyan-500 focus:border-curious-cyan-500"
                    rows={2}
                    disabled={isLoading}
                    aria-label="Message input"
                  />
                  <Button 
                    variant="primary"
                    size="sm"
                    disabled={isLoading || !newMessage.trim()}
                    onClick={handleSendMessage}
                    aria-label={isLoading ? "Sending message" : "Send message"}
                    className="absolute right-2 bottom-2 !rounded-full !p-2 !h-8 !w-8 !min-w-0"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 rounded-full border-b-2 border-white animate-spin" aria-hidden="true" />
                    ) : (
                      renderIcon(Send, { className: "w-4 h-4", "aria-hidden": "true" })
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <div role="alert" className="flex gap-2 items-center p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                  {renderIcon(AlertCircle, { className: "w-4 h-4 flex-shrink-0", "aria-hidden": "true" })}
                  {error}
                </div>
              )}
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
