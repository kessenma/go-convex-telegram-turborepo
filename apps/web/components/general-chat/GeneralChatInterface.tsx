'use client';

import {
  Bot,
  Send,
  User,
} from 'lucide-react';
import { useGeneralChat } from '../../hooks/use-general-chat';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { renderIcon } from '../../lib/icon-utils';
import { AnimatedBotIcon } from '../ui/icons/AnimatedBotIcon';
import { AISDKProgressLoader } from '../ui/loading/ai_sdk_ProgressLoader';
import { BackgroundGradient } from '../ui/backgrounds/background-gradient';
import { useLLMProgress } from '../../hooks/useLLMProgress';

export function GeneralChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enhanced progress tracking
  const llmProgress = useLLMProgress();

  // Use our custom useGeneralChat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useGeneralChat({
    api: '/api/general-chat',
    onError: (err) => {
      console.error('Chat error:', err);
      toast.error(err.message || 'An error occurred');
      llmProgress.setError(err.message || 'Unknown error');
    },
  });

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update progress tracking based on loading state
  useEffect(() => {
    if (isLoading) {
      const cleanup = llmProgress.startProcessing(8); // Estimate 8 seconds
      return () => cleanup?.();
    } else {
      llmProgress.completeProcessing();
    }
  }, [isLoading, llmProgress.startProcessing, llmProgress.completeProcessing]);

  // Handle error state
  useEffect(() => {
    if (error) {
      llmProgress.setError(error.message || 'Unknown error');
      toast.error(error.message || 'An error occurred');
    }
  }, [error, llmProgress.setError]);

  // Custom submit handler that wraps the general chat's handleSubmit
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    handleSubmit(e);
  };

  return (
    <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="normal">
      <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[700px] bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-800/40 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Tron-inspired header */}
        <div className="relative bg-gradient-to-r border-b backdrop-blur-md border-cyan-500/30 from-slate-800/40 via-slate-700/60 to-slate-800/40">
          {/* Animated accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

          {/* Header content */}
          <div className="flex gap-2 items-center p-3 mt-16 sm:p-4 md:p-6 sm:gap-3 sm:mt-0">
            <div className="flex gap-2 items-center sm:gap-3">
              <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 rounded-xl sm:w-7 sm:h-7">
                {renderIcon(Bot, { className: "w-3 h-3 sm:w-5 sm:h-5 text-cyan-400" })}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs font-bold text-cyan-100 truncate sm:text-sm">
                  General AI Chat
                </h2>
                <p className="text-[10px] sm:text-xs text-cyan-300/70 truncate">
                  Ask me anything!
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex gap-1.5 sm:gap-2 justify-center items-center px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-emerald-400 rounded-full border backdrop-blur-md bg-gradient-to-r from-slate-800/20 via-slate-700/30 to-slate-800/20 border-emerald-500/20">
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></div>
              <span className="font-medium truncate">
                Powered by {process.env.NEXT_PUBLIC_LLM_MODEL || "Meta Llama 3.2"} LLM
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="overflow-y-auto flex-1 p-3 space-y-4 sm:p-4 md:p-6 sm:space-y-5 md:space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col justify-center items-center h-full text-center">
              <div className="relative mb-8">
                <div className="flex justify-center items-center w-24 h-24">
                  <AnimatedBotIcon className="w-10 h-10 text-cyan-400" />
                </div>
                
                <style jsx>{`
                  @keyframes orbit {
                    0% { transform: translate(-50%, -50%) rotate(0deg) translateX(30px) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg) translateX(30px) rotate(-360deg); }
                  }
                  .orbit-animation {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform-origin: center;
                    animation: orbit 8s infinite linear;
                  }
                `}</style>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-cyan-100">
                Ready to chat
              </h3>
              <p className="max-w-md leading-relaxed text-cyan-200/70">
                I'm here to help with any questions or topics you'd like to discuss. What's on your mind?
              </p>
            </div>
          )}

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
                steps={llmProgress.steps}
                currentStep={llmProgress.currentStep}
                progress={llmProgress.progress}
                estimatedTime={llmProgress.estimatedTime}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Tron-inspired input */}
        <div className="p-3 bg-gradient-to-r border-t backdrop-blur-md sm:p-4 md:p-6 border-cyan-500/30 from-slate-800/40 via-slate-700/60 to-slate-800/40">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end sm:gap-3 md:gap-4">
            <div className="relative flex-1">
              <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="subtle">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="px-3 py-3 pr-12 w-full text-sm text-cyan-100 rounded-2xl border shadow-sm backdrop-blur-md transition-all duration-300 resize-none sm:px-4 md:px-5 sm:py-4 sm:pr-16 placeholder-cyan-400/60 bg-slate-800/30 border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 focus:bg-slate-700/40 sm:text-base"
                  rows={2}
                  disabled={isLoading}
                />
              </BackgroundGradient>
              {/* Character count or input status */}
              <div className="absolute bottom-3 right-4 text-xs text-cyan-400/70">
                {input.length > 0 && (
                  <span className={input.length > 500 ? "text-orange-400" : ""}>
                    {input.length}
                  </span>
                )}
              </div>
            </div>

            <BackgroundGradient color={!input.trim() || isLoading ? "white" : "cyan"} tronMode={true} intensity="subtle">
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`group relative p-3 sm:p-4 rounded-2xl transition-all duration-300 ${!input.trim() || isLoading
                  ? "bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-600/30"
                  : "bg-slate-800/30 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40 hover:scale-105 shadow-lg hover:shadow-cyan-500/20 hover:bg-slate-700/40"
                  } backdrop-blur-md`}
              >
                {renderIcon(Send, { className: "w-4 h-4 sm:w-5 sm:h-5" })}
              </button>
            </BackgroundGradient>
          </form>

          {/* Status and shortcuts */}
          <div className="flex justify-between items-center mt-4 text-xs text-cyan-400/70">
            <div className="flex gap-2 items-center px-3 py-1.5 rounded-full bg-slate-800/20 border border-emerald-500/10 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>Ready to answer</span>
            </div>
            <div className="hidden sm:block px-3 py-1.5 rounded-full bg-slate-800/20 border border-cyan-500/10 backdrop-blur-sm">
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    </BackgroundGradient>
  );
}