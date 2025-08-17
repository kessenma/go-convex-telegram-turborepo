'use client';

import { Send } from 'lucide-react';
import React, { useState, FormEvent } from 'react';
import { renderIcon } from '../../../lib/icon-utils';
import { BackgroundGradient } from '../../ui/backgrounds/background-gradient';

interface ChatInputFormProps {
  input: string;
  isLoading: boolean;
  chatMode?: 'general' | 'rag';
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export const ChatInputForm = React.memo(function ChatInputForm({
  input,
  isLoading,
  chatMode = 'general',
  onInputChange,
  onSubmit
}: ChatInputFormProps) {
  return (
    <div className="p-3 bg-gradient-to-r border-t backdrop-blur-md sm:p-4 md:p-6 border-cyan-500/30 from-slate-800/40 via-slate-700/60 to-slate-800/40">
      <form onSubmit={onSubmit} className="flex gap-2 items-end sm:gap-3 md:gap-4">
        <div className="relative flex-1">
          <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="subtle">
            <textarea
              value={input}
              onChange={onInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e as any);
                }
              }}
              placeholder={chatMode === 'general' ? "Ask me anything..." : "Ask me anything about your documents..."}
              className="px-3 py-3 pr-12 w-full text-sm text-cyan-100 rounded-2xl border shadow-sm backdrop-blur-md transition-all duration-300 resize-none sm:px-4 md:px-5 sm:py-4 sm:pr-16 placeholder-cyan-400/60 bg-slate-800/30 border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 focus:bg-slate-700/40 sm:text-base"
              rows={2}
              disabled={isLoading}
            />
          </BackgroundGradient>
          {/* Character count */}
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
  );
});
