'use client';

import { Bot, User } from 'lucide-react';
import React, { useRef, useEffect } from 'react';
import { renderIcon } from '../../../lib/icon-utils';
import { BackgroundGradient } from '../../ui/backgrounds/background-gradient';
import { AISDKProgressLoader } from '../../ui/loading/ai_sdk_ProgressLoader';
import { ChatEmptyState } from './ChatEmptyState';

interface Source {
  documentId: string;
  title: string;
  snippet: string;
  score: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: Source[];
  metadata?: Record<string, any>;
}

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  chatMode: 'general' | 'rag';
  selectedDocuments: any[];
  llmProgress: {
    isProcessing: boolean;
    message: string;
    currentStep: number;
    progress: number;
    estimatedTime?: number;
  };
  getProgressSteps: () => string[];
}

export const ChatMessageList = React.memo(function ChatMessageList({
  messages,
  isLoading,
  chatMode,
  selectedDocuments,
  llmProgress,
  getProgressSteps
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  if (messages.length === 0) {
    return <ChatEmptyState chatMode={chatMode} selectedDocuments={selectedDocuments} />;
  }

  return (
    <div className="overflow-y-auto flex-1 p-3 space-y-4 sm:p-4 md:p-6 sm:space-y-5 md:space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <BackgroundGradient
            color={message.role === "user" ? "cyan" : "purple"}
            containerClassName={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] ${message.role === "user" ? "ml-auto" : "mr-auto"}`}
            tronMode={true}
            intensity="subtle"
          >
            <div
              className={`${message.role === "user"
                ? "bg-slate-800/40 text-cyan-100 rounded-3xl rounded-br-lg border border-cyan-500/20"
                : "bg-slate-800/40 text-slate-100 rounded-3xl rounded-bl-lg border border-purple-500/20"
                } p-3 sm:p-4 md:p-5 backdrop-blur-md shadow-lg`}
            >
              <div className="flex gap-2 items-start sm:gap-3">
                {message.role === "assistant" && (
                  <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl border sm:w-7 sm:h-7 md:w-8 md:h-8 border-purple-400/30">
                    {renderIcon(Bot, { className: "w-3 h-3 sm:w-4 sm:h-4 text-white" })}
                  </div>
                )}
                {message.role === "user" && (
                  <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl border sm:w-7 sm:h-7 md:w-8 md:h-8 border-cyan-400/30">
                    {renderIcon(User, { className: "w-3 h-3 sm:w-4 sm:h-4 text-white" })}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap sm:text-base md:text-lg">{message.content}</p>

                  {/* Show sources for RAG messages */}
                  {chatMode === 'rag' && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 space-y-2 sm:mt-4 sm:space-y-3">
                      <div className="flex gap-1 items-center sm:gap-2">
                        <div className="w-4 sm:w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"></div>
                        <p className="text-xs font-semibold tracking-wide text-cyan-300 uppercase">
                          Sources
                        </p>
                      </div>
                      {message.sources.map((source: Source, index: number) => (
                        <div key={index} className="w-full">
                          <div className="p-3 bg-gradient-to-br rounded-xl border backdrop-blur-sm transition-all duration-200 sm:p-4 from-slate-800/40 via-slate-700/50 to-slate-800/40 border-slate-600/40 hover:border-slate-500/60 hover:from-slate-700/50 hover:via-slate-600/60 hover:to-slate-700/50">
                            <div className="flex flex-col mb-2 sm:flex-row sm:justify-between sm:items-center">
                              <span className="text-sm font-medium text-cyan-300">
                                {source?.title || "Unknown Source"}
                              </span>
                              <span className="mt-1 sm:mt-0 px-2 py-0.5 sm:py-1 text-xs rounded-md border text-slate-400 bg-gradient-to-r from-slate-700/60 to-slate-600/80 border-slate-600/50 inline-block w-fit backdrop-blur-sm">
                                {((source.score || 0) * 100).toFixed(1)}% match
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed sm:text-sm text-slate-300">
                              {source.snippet || ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </BackgroundGradient>
        </div>
      ))}

      {/* Enhanced loading component with progress */}
      {isLoading && (
        <div className="flex justify-start">
          <AISDKProgressLoader
            isVisible={llmProgress.isProcessing}
            message={llmProgress.message}
            steps={getProgressSteps()}
            currentStep={llmProgress.currentStep}
            progress={llmProgress.progress}
            estimatedTime={llmProgress.estimatedTime}
            chatMode={chatMode}
          />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
});
