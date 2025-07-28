"use client";
import { useQuery, useMutation } from "convex/react";
import type { GenericId as Id } from "convex/values";
import {
  AlertCircle,
  Bot,
  Clock,
  MessagesSquare,
  Send,
  Users,
  X,
  Sparkles,
  User,
} from "lucide-react";
import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import { api } from "../../../generated-convex";
import { renderIcon } from "../../../lib/icon-utils";
import { cn } from "../../../lib/utils";
import type { TelegramMessage } from "../../../models/telegram";
import { BackgroundGradient } from "../../../components/ui/backgrounds/background-gradient";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tool-tip";

interface ThreadModalProps {
  threadId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ThreadModal({
  threadId,
  isOpen,
  onClose,
}: ThreadModalProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const thread = useQuery(
    api.threads.getThreadById,
    threadId ? { threadDocId: threadId as Id<"telegram_threads"> } : "skip"
  );
  const messages = useQuery(
    api.messages.getMessagesByThreadDoc,
    threadId ? { threadDocId: threadId as Id<"telegram_threads"> } : "skip"
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !thread) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        chatId: thread.chatId || "",
        text: newMessage,
        threadDocId: threadId,
        messageThreadId: thread.threadId || "",
      };

      const response = await fetch("/api/telegram/send-to-thread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message");
      }

      setNewMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
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
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <BackgroundGradient color="cyan" containerClassName="w-full max-w-4xl max-h-[90vh]" tronMode={true} intensity="normal">
        <div className="flex flex-col h-full bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">
          {/* Tron-inspired header */}
          <div className="relative border-b border-cyan-500/30 bg-slate-800/60 backdrop-blur-md">
            {/* Animated accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

            {/* Top navigation bar */}
            <div className="flex justify-between items-center p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                  {renderIcon(MessagesSquare, { className: "w-4 h-4 text-white" })}
                </div>
                <h2 className="text-xl font-bold text-cyan-100">
                  {thread?.title || `Thread ${thread?.threadId || "Unknown"}`}
                </h2>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <BackgroundGradient color="red" containerClassName="p-0" tronMode={true} intensity="subtle">
                    <button
                      onClick={onClose}
                      className="group relative p-3 text-red-300 rounded-2xl transition-all duration-300 hover:text-red-100 bg-slate-800/60 backdrop-blur-md border border-red-500/20 hover:border-red-400/40"
                    >
                      {renderIcon(X, { className: "w-5 h-5" })}
                    </button>
                  </BackgroundGradient>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900/90 backdrop-blur-md border border-red-500/30">
                  Close Thread
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Status indicator */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-center gap-2 text-xs text-cyan-400 bg-slate-800/30 backdrop-blur-md rounded-full px-4 py-2 border border-cyan-500/20">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  messages === undefined
                    ? "bg-yellow-500 animate-pulse"
                    : thread?.isActive
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                )}></div>
                <span className="font-medium">
                  {messages === undefined
                    ? "Loading..."
                    : thread?.isActive
                      ? "Active Thread"
                      : "Inactive Thread"
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Thread details accordion */}
          {thread && (
            <div className="border-b border-cyan-500/30">
              <Accordion
                type="single"
                collapsible
                value={accordionOpen ? "details" : ""}
                onValueChange={(value) => setAccordionOpen(value === "details")}
              >
                <AccordionItem value="details" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2 px-6 rounded-none bg-slate-800/40 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                        {renderIcon(Users, { className: "w-3 h-3 text-white" })}
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-medium text-cyan-100">Thread Details</span>
                        <p className="text-xs text-cyan-300/70">
                          {thread?.messageCount || 0} messages
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-2 px-6 bg-slate-800/30 backdrop-blur-md">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-800/40 backdrop-blur-md rounded-xl border border-cyan-500/10">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-cyan-200">Chat ID</span>
                          <p className="text-xs text-cyan-300/70">{thread?.chatId || "Unknown"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-800/40 backdrop-blur-md rounded-xl border border-cyan-500/10">
                        <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-cyan-200">Status</span>
                          <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mt-1",
                            thread?.isActive
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          )}>
                            {thread?.isActive ? "Active" : "Inactive"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Messages */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6 bg-slate-900/30 backdrop-blur-sm min-h-[300px] max-h-[400px]">
            {messages === undefined ? (
              <div className="flex justify-center items-center h-48 text-cyan-400">
                <div className="flex gap-2 items-center">
                  <div className="w-5 h-5 rounded-full border-b-2 animate-spin border-cyan-400"></div>
                  Loading messages...
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="relative mb-8">
                  <BackgroundGradient color="cyan" containerClassName="p-0" tronMode={true} intensity="subtle">
                    <div className="w-24 h-24 bg-slate-800/60 backdrop-blur-md rounded-3xl flex items-center justify-center border border-cyan-500/20">
                      {renderIcon(MessagesSquare, { className: "w-10 h-10 text-cyan-400" })}
                    </div>
                  </BackgroundGradient>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {renderIcon(Sparkles, { className: "w-4 h-4 text-white" })}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-cyan-100 mb-3">
                  No messages yet
                </h3>
                <p className="text-cyan-200/70 max-w-md leading-relaxed">
                  This thread is ready for conversation. Send a message to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message: TelegramMessage) => {
                  const isUserMessage = message.messageType !== "bot_message";
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}
                    >
                      <BackgroundGradient
                        color={isUserMessage ? "cyan" : "purple"}
                        containerClassName={`max-w-[85%] ${isUserMessage ? "ml-auto" : "mr-auto"}`}
                        tronMode={true}
                        intensity="subtle"
                      >
                        <div
                          className={`${isUserMessage
                            ? "bg-slate-800/60 text-cyan-100 rounded-3xl rounded-br-lg border border-cyan-500/20"
                            : "bg-slate-800/60 text-slate-100 rounded-3xl rounded-bl-lg border border-purple-500/20"
                            } p-5 backdrop-blur-md shadow-lg`}
                        >
                          <div className="flex gap-3 items-start">
                            {message.messageType === "bot_message" ? (
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center border border-purple-400/30">
                                {renderIcon(Bot, { className: "w-4 h-4 text-white" })}
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center border border-cyan-400/30">
                                {renderIcon(User, { className: "w-4 h-4 text-white" })}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              {/* User info */}
                              {(message.firstName || message.username) && (
                                <div className="flex gap-2 items-center mb-2">
                                  {message.firstName && (
                                    <span className="font-semibold text-sm">
                                      {message.firstName} {message.lastName}
                                    </span>
                                  )}
                                  {message.username && (
                                    <span className="text-xs opacity-70">
                                      @{message.username}
                                    </span>
                                  )}
                                  {message.messageType === "bot_message" && (
                                    <div className="flex gap-1 items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      {renderIcon(Bot, { className: "w-3 h-3" })}
                                      Bot
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Message content */}
                              <p className="whitespace-pre-wrap leading-relaxed mb-2">{message.text}</p>

                              {/* Timestamp */}
                              <div className="flex gap-1 justify-end items-center text-xs opacity-70">
                                {renderIcon(Clock, { className: "w-3 h-3" })}
                                {new Date(message.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </BackgroundGradient>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Tron-inspired input */}
          {thread?.isActive && (
            <div className="p-6 border-t border-cyan-500/30 bg-slate-800/60 backdrop-blur-md">
              <div className="flex gap-4 items-end">
                <div className="flex-1 relative">
                  <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="subtle">
                    <textarea
                      id="message-input"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e as any);
                        }
                      }}
                      placeholder="Type your message to this thread..."
                      className="w-full px-5 py-4 pr-16 placeholder-cyan-400/60 text-cyan-100 bg-slate-800/60 backdrop-blur-md rounded-2xl border border-cyan-500/20 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 shadow-sm"
                      rows={2}
                      disabled={isLoading}
                      aria-label="Message input"
                    />
                  </BackgroundGradient>
                  {/* Character count or input status */}
                  <div className="absolute bottom-3 right-4 text-xs text-cyan-400/70">
                    {newMessage.length > 0 && (
                      <span className={newMessage.length > 500 ? "text-orange-400" : ""}>
                        {newMessage.length}
                      </span>
                    )}
                  </div>
                </div>

                <BackgroundGradient color={!newMessage.trim() || isLoading ? "white" : "cyan"} tronMode={true} intensity="subtle">
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    className={`group relative p-4 rounded-2xl transition-all duration-300 ${!newMessage.trim() || isLoading
                        ? "bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-600/30"
                        : "bg-slate-800/60 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40 hover:scale-105 shadow-lg hover:shadow-cyan-500/20"
                      } backdrop-blur-md`}
                    aria-label={isLoading ? "Sending message" : "Send message"}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 rounded-full border-b-2 border-current animate-spin" />
                    ) : (
                      renderIcon(Send, { className: "w-5 h-5" })
                    )}
                  </button>
                </BackgroundGradient>
              </div>

              {/* Status and shortcuts */}
              <div className="flex items-center justify-between mt-4 text-xs text-cyan-400/70">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>Ready to send</span>
                </div>
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>

              {/* Error display */}
              {error && (
                <BackgroundGradient color="red" containerClassName="w-full mt-4" tronMode={true} intensity="subtle">
                  <div
                    role="alert"
                    className="flex gap-2 items-center p-3 text-sm text-red-300 bg-slate-800/60 backdrop-blur-md rounded-2xl border border-red-500/20"
                  >
                    {renderIcon(AlertCircle, {
                      className: "w-4 h-4 flex-shrink-0",
                      "aria-hidden": "true",
                    })}
                    {error}
                  </div>
                </BackgroundGradient>
              )}
            </div>
          )}

          {/* Inactive thread message */}
          {thread && !thread.isActive && (
            <div className="p-6 border-t border-slate-600/30 bg-slate-800/40 backdrop-blur-md">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>This thread is inactive and cannot receive new messages</span>
              </div>
            </div>
          )}
        </div>
      </BackgroundGradient>
    </div>
  );
}
