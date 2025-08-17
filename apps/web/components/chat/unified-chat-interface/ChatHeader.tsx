'use client';

import {
  Bot,
  Plus,
  FileText,
  X,
  History,
} from 'lucide-react';
import React, { useState } from 'react';
import { renderIcon } from '../../../lib/icon-utils';
import { TitleGenerationLoader } from '../../ui/loading/TitleGenerationLoader';
import { SelectedDocumentsList } from './SelectedDocumentsList';
import { useChatMode } from '../../../stores/unifiedChatStore';

interface ChatHeaderProps {
  conversationTitle: string | null;
  isGeneratingTitle: boolean;
  titleGenerationProgress: number;
  selectedDocuments: any[];
  onHistoryClick: () => void;
  onNewConversationClick: () => void;
  onRemoveDocumentsClick: () => void;
  onDocumentsClick: () => void;
  onDocumentClick: (documentId: string) => void;
}

export const ChatHeader = React.memo(function ChatHeader({
  conversationTitle,
  isGeneratingTitle,
  titleGenerationProgress,
  selectedDocuments,
  onHistoryClick,
  onNewConversationClick,
  onRemoveDocumentsClick,
  onDocumentsClick,
  onDocumentClick
}: ChatHeaderProps) {
  const chatMode = useChatMode();

  return (
    <div className="relative bg-gradient-to-r border-b backdrop-blur-md border-cyan-500/30 from-slate-800/40 via-slate-700/60 to-slate-800/40">
      {/* Animated accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

      {/* Header content */}
      <div className="flex gap-2 justify-between items-center p-3 mt-16 sm:p-4 md:p-6 sm:gap-3 sm:mt-0">
        <div className="flex gap-2 items-center sm:gap-3">
          <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 rounded-xl sm:w-7 sm:h-7">
            {renderIcon(Bot, { className: "w-3 h-3 sm:w-5 sm:h-5 text-cyan-400" })}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-bold text-cyan-100 truncate sm:text-sm">
              {conversationTitle || (chatMode === 'general' ? 'General AI Chat' : `RAG Chat (${selectedDocuments.length} documents)`)}
            </h2>
            <p className="text-[10px] sm:text-xs text-cyan-300/70 truncate">
              {conversationTitle ? (chatMode === 'general' ? 'General AI Chat' : `RAG Chat (${selectedDocuments.length} documents)`) : (chatMode === 'general' ? 'Ask me anything!' : 'Chatting with your documents')}
            </p>
            {isGeneratingTitle && (
              <div className="mt-1">
                <TitleGenerationLoader progress={titleGenerationProgress} isVisible={isGeneratingTitle} />
              </div>
            )}
          </div>
        </div>

        {/* Document controls */}
        <div className="flex gap-2 items-center">
          <button
            onClick={onHistoryClick}
            className="p-2 text-purple-400 rounded-lg border transition-all duration-200 border-purple-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-purple-300"
            title="Chat History"
          >
            {renderIcon(History, { className: "w-4 h-4" })}
          </button>

          <button
            onClick={onNewConversationClick}
            className="p-2 text-green-400 rounded-lg border transition-all duration-200 border-green-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-green-300"
            title="Start new conversation"
          >
            {renderIcon(Plus, { className: "w-4 h-4" })}
          </button>

          {chatMode === 'rag' && selectedDocuments.length > 0 && (
            <button
              onClick={onRemoveDocumentsClick}
              className="p-2 text-red-400 rounded-lg border transition-all duration-200 border-red-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-red-300"
              title="Remove documents"
            >
              {renderIcon(X, { className: "w-4 h-4" })}
            </button>
          )}

          <button
            onClick={onDocumentsClick}
            className="flex gap-2 items-center p-2 text-cyan-400 rounded-lg border transition-all duration-200 border-cyan-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-cyan-300"
            title="Add documents"
          >
            {renderIcon(FileText, { className: "w-4 h-4" })}
            <span className="hidden text-sm sm:inline">Documents</span>
          </button>
        </div>
      </div>

      {/* Selected documents display */}
      {selectedDocuments.length > 0 && (
        <div className="px-3 pb-3 sm:px-4 md:px-6 sm:pb-4">
          <SelectedDocumentsList 
            documents={selectedDocuments} 
            onDocumentClick={onDocumentClick} 
          />
        </div>
      )}
    </div>
  );
});
