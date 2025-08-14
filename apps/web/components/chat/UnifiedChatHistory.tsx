"use client";

import React from "react";
import { useQuery } from "convex/react";
import { MessageCircle, Clock, FileText, FolderOpen, Bot } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { api } from "../../generated-convex";
import { renderIcon } from "../../lib/icon-utils";
import { BackgroundGradient } from "../ui/backgrounds/background-gradient";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tool-tip";
import type { GenericId as Id } from "convex/values";

interface UnifiedChatHistoryProps {
  onConversationSelect?: (conversation: any, type: 'general' | 'rag') => void;
}

type ChatFilter = 'all' | 'general' | 'rag';

const UnifiedChatHistory = memo(function UnifiedChatHistory({
  onConversationSelect
}: UnifiedChatHistoryProps): React.ReactElement | null {
  const [filter, setFilter] = useState<ChatFilter>('all');
  
  // Fetch both types of conversations
  const ragConversations = useQuery(api.ragChat.getRecentConversations, { limit: 20 });
  const generalConversations = useQuery(api.generalChat.getRecentConversations, { limit: 20 });
  
  const handleConversationClick = useCallback((conversation: any, type: 'general' | 'rag') => {
    onConversationSelect?.(conversation, type);
  }, [onConversationSelect]);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Combine and sort conversations
  const allConversations = React.useMemo(() => {
    const combined: Array<{conversation: any, type: 'general' | 'rag', timestamp: number}> = [];
    
    if (ragConversations) {
      ragConversations.forEach(conv => {
        combined.push({
          conversation: conv,
          type: 'rag',
          timestamp: conv.lastMessageAt || conv.createdAt
        });
      });
    }
    
    if (generalConversations) {
      generalConversations.forEach(conv => {
        combined.push({
          conversation: conv,
          type: 'general',
          timestamp: conv.lastMessageAt || conv.createdAt
        });
      });
    }
    
    // Sort by timestamp (most recent first)
    combined.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply filter
    if (filter === 'all') {
      return combined;
    } else {
      return combined.filter(item => item.type === filter);
    }
  }, [ragConversations, generalConversations, filter]);

  if (ragConversations === undefined && generalConversations === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Chat History</h2>
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border animate-pulse bg-slate-800/40 border-slate-600/30">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 bg-gray-600 rounded-xl"></div>
                <div className="flex-1">
                  <div className="mb-2 w-3/4 h-4 bg-gray-600 rounded"></div>
                  <div className="w-1/2 h-3 bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (allConversations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Chat History</h2>
        </div>
        <div className="p-8 text-center rounded-lg border border-gray-600 bg-slate-950/50">
          <div className="mb-4">
            {renderIcon(MessageCircle, {
              className: "mx-auto w-12 h-12 text-gray-500",
            })}
          </div>
          <p className="text-gray-400">No chat conversations yet.</p>
          <p className="text-sm text-gray-500">
            Start a conversation to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Chat History</h2>
        
        {/* Filter buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-lg border transition-all duration-200 ${
              filter === 'all'
                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                : 'bg-slate-700/50 border-slate-600/30 text-slate-400 hover:bg-slate-600/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('general')}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg border transition-all duration-200 ${
              filter === 'general'
                ? 'bg-purple-500/20 border-purple-400/40 text-purple-300'
                : 'bg-slate-700/50 border-slate-600/30 text-slate-400 hover:bg-slate-600/50'
            }`}
          >
            {renderIcon(Bot, { className: "w-3 h-3" })}
            General
          </button>
          <button
            onClick={() => setFilter('rag')}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg border transition-all duration-200 ${
              filter === 'rag'
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-slate-700/50 border-slate-600/30 text-slate-400 hover:bg-slate-600/50'
            }`}
          >
            {renderIcon(FolderOpen, { className: "w-3 h-3" })}
            Documents
          </button>
        </div>
      </div>
      
      <div className="space-y-4 max-h-[600px] overflow-y-auto pb-4">
        {allConversations.map(({ conversation, type }, index) => (
          <BackgroundGradient 
            key={`${type}-${conversation._id}`}
            color={type === 'rag' ? "green" : "purple"} 
            containerClassName="w-full" 
            tronMode={true} 
            intensity="subtle"
          >
            <div 
              className={`p-4 backdrop-blur-md rounded-xl border transition-all duration-300 cursor-pointer group ${
                type === 'rag' 
                  ? 'bg-slate-800/60 border-emerald-500/20 hover:border-emerald-400/40'
                  : 'bg-slate-800/60 border-purple-500/20 hover:border-purple-400/40'
              }`}
              onClick={() => handleConversationClick(conversation, type)}
            >
              <div className="flex gap-4 items-start">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${
                  type === 'rag'
                    ? 'bg-gradient-to-br from-emerald-500 to-green-500 border-emerald-400/30'
                    : 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400/30'
                }`}>
                  {type === 'rag' 
                    ? renderIcon(FolderOpen, { className: "w-6 h-6 text-white" })
                    : renderIcon(Bot, { className: "w-6 h-6 text-white" })
                  }
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`font-semibold truncate transition-colors ${
                      type === 'rag' 
                        ? 'text-emerald-100 group-hover:text-emerald-50'
                        : 'text-purple-100 group-hover:text-purple-50'
                    }`}>
                      {conversation.title || "Untitled Conversation"}
                    </h3>
                    <div className="flex gap-2 items-center text-xs text-slate-300/70">
                      {renderIcon(Clock, { className: "w-3 h-3" })}
                      <span>{formatDate(conversation.lastMessageAt || conversation.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 text-sm mb-2 ${
                    type === 'rag' ? 'text-emerald-200/70' : 'text-purple-200/70'
                  }`}>
                    <span>{conversation.messageCount || 0} messages</span>
                    {type === 'rag' && (
                      <>
                        <span>•</span>
                        <span>{conversation.documentIds?.length || 0} documents</span>
                      </>
                    )}
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      type === 'rag'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {type === 'rag' ? 'RAG Chat' : 'General Chat'}
                    </span>
                  </div>
                  
                  {/* Show document titles for RAG conversations */}
                  {type === 'rag' && conversation.documentTitles && conversation.documentTitles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {conversation.documentTitles
                        .filter((title: string) => title && typeof title === 'string')
                        .slice(0, 3)
                        .map((title: string, index: number) => (
                        <span 
                          key={index}
                          className="inline-flex gap-1 items-center px-2 py-1 text-xs text-emerald-300 rounded-md border bg-slate-700/60 border-slate-600/40"
                        >
                          {renderIcon(FileText, { className: "w-3 h-3" })}
                          {title.length > 20 ? `${title.slice(0, 20)}...` : title}
                        </span>
                      ))}
                      {conversation.documentTitles.filter((title: string) => title && typeof title === 'string').length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-md border bg-slate-700/60 text-emerald-300/70 border-slate-600/40">
                          +{conversation.documentTitles.filter((title: string) => title && typeof title === 'string').length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </BackgroundGradient>
        ))}
      </div>
    </div>
  );
});

export { UnifiedChatHistory };