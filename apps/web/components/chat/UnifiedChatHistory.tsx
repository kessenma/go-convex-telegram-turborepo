"use client";

import React from "react";
import { useQuery } from "convex/react";
import { MessageCircle, Clock, FileText, FolderOpen, Bot, ArrowUpDown, Filter, Search, Calendar, Hash, Cpu } from "lucide-react";
import { memo, useCallback, useState, useMemo } from "react";
import { api } from "../../generated-convex";
import { renderIcon } from "../../lib/icon-utils";
import { BackgroundGradient } from "../ui/backgrounds/background-gradient";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tool-tip";
import type { GenericId as Id } from "convex/values";

interface UnifiedChatHistoryProps {
  onConversationSelect?: (conversation: any, type: 'general' | 'rag') => void;
}

type ChatFilter = 'all' | 'general' | 'rag';
type SortBy = 'lastMessage' | 'createdAt' | 'tokens' | 'messageCount' | 'model';
type SortOrder = 'asc' | 'desc';

const UnifiedChatHistory = memo(function UnifiedChatHistory({
  onConversationSelect
}: UnifiedChatHistoryProps): React.ReactElement | null {
  const [filter, setFilter] = useState<ChatFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('lastMessage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentFilter, setSelectedDocumentFilter] = useState<string>('all');
  
  // Fetch unified conversations from the new unified API
  const conversations = useQuery(api.unifiedChat.getRecentConversations, { limit: 100 });
  
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

  // Process and filter conversations with comprehensive sorting
  const processedConversations = useMemo(() => {
    if (!conversations) return [];

    let filtered = conversations.filter(conv => {
      // Type filter
      if (filter !== 'all' && conv.type !== filter) return false;
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = conv.title?.toLowerCase().includes(searchLower);
        const documentMatch = conv.documentTitles?.some((title: string) => 
          title.toLowerCase().includes(searchLower)
        );
        if (!titleMatch && !documentMatch) return false;
      }
      
      // Document filter
      if (selectedDocumentFilter !== 'all') {
        if (selectedDocumentFilter === 'withDocuments') {
          return conv.documentIds && conv.documentIds.length > 0;
        } else if (selectedDocumentFilter === 'withoutDocuments') {
          return !conv.documentIds || conv.documentIds.length === 0;
        } else {
          // Specific document filter
          return conv.documentIds?.includes(selectedDocumentFilter);
        }
      }
      
      return true;
    });

    // Sort conversations
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'lastMessage':
          comparison = (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt);
          break;
        case 'createdAt':
          comparison = b.createdAt - a.createdAt;
          break;
        case 'tokens':
          comparison = b.totalTokensUsed - a.totalTokensUsed;
          break;
        case 'messageCount':
          comparison = b.messageCount - a.messageCount;
          break;
        case 'model':
          comparison = (a.llmModel || '').localeCompare(b.llmModel || '');
          break;
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [conversations, filter, sortBy, sortOrder, searchTerm, selectedDocumentFilter]);

  if (conversations === undefined) {
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

  if (processedConversations.length === 0) {
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
          <p className="text-gray-400">No conversations found</p>
          <p className="text-sm text-gray-500">
            Try adjusting your filters or start a new chat
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Chat History</h2>
        
        <div className="flex flex-col gap-4">
          {/* Search and Filter Controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 pr-3 pl-9 w-full text-sm placeholder-gray-400 text-white rounded-md border bg-white/5 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>
          
          {/* Type Filter */}
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
          
          {/* Document Filter */}
          <div className="flex gap-2">
            <select
              value={selectedDocumentFilter}
              onChange={(e) => setSelectedDocumentFilter(e.target.value)}
              className="px-3 py-1 text-xs rounded-lg border transition-all duration-200 bg-slate-700/50 border-slate-600/30 text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="all">All Documents</option>
              <option value="withDocuments">With Documents</option>
              <option value="withoutDocuments">Without Documents</option>
            </select>
          </div>
          
          {/* Sort Controls */}
          <div className="flex gap-2 items-center">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-1 text-xs rounded-lg border transition-all duration-200 bg-slate-700/50 border-slate-600/30 text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="lastMessage">Last Message</option>
              <option value="createdAt">Created At</option>
              <option value="tokens">Tokens Used</option>
              <option value="messageCount">Message Count</option>
              <option value="model">Model</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 text-xs rounded-lg border transition-all duration-200 bg-slate-700/50 border-slate-600/30 text-slate-400 hover:bg-slate-600/50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 max-h-[600px] overflow-y-auto pb-4">
          {processedConversations.map((conversation, index) => (
            <BackgroundGradient 
              key={conversation._id}
              color={conversation.type === 'rag' ? "green" : "purple"} 
              containerClassName="w-full" 
              tronMode={true} 
              intensity="subtle"
            >
              <div 
                className={`p-4 backdrop-blur-md rounded-xl border transition-all duration-300 cursor-pointer group ${
                  conversation.type === 'rag' 
                    ? 'bg-slate-800/60 border-emerald-500/20 hover:border-emerald-400/40'
                    : 'bg-slate-800/60 border-purple-500/20 hover:border-purple-400/40'
                }`}
                onClick={() => handleConversationClick(conversation, conversation.type)}
              >
                <div className="flex gap-4 items-start">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${
                    conversation.type === 'rag'
                      ? 'bg-gradient-to-br from-emerald-500 to-green-500 border-emerald-400/30'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400/30'
                  }`}>
                    {conversation.type === 'rag' 
                      ? renderIcon(FolderOpen, { className: "w-6 h-6 text-white" })
                      : renderIcon(Bot, { className: "w-6 h-6 text-white" })
                    }
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className={`font-semibold truncate transition-colors ${
                        conversation.type === 'rag' 
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
                    
                    <div className="space-y-1 text-xs">
                      {/* Model info */}
                      {conversation.llmModel && (
                        <div className="flex gap-1 items-center text-slate-400">
                          {renderIcon(Cpu, { className: "w-3 h-3" })}
                          <span>{conversation.llmModel}</span>
                        </div>
                      )}
                      
                      {/* Token usage */}
                      {conversation.totalTokensUsed > 0 && (
                        <div className="flex gap-1 items-center text-slate-400">
                          {renderIcon(Hash, { className: "w-3 h-3" })}
                          <span>{conversation.totalTokensUsed.toLocaleString()} tokens</span>
                        </div>
                      )}
                      
                      {/* Message count */}
                      <div className="flex gap-1 items-center text-slate-400">
                        {renderIcon(MessageCircle, { className: "w-3 h-3" })}
                        <span>{conversation.messageCount || 0} messages</span>
                      </div>
                      
                      {/* Document info */}
                      {conversation.type === 'rag' && (
                        <div className="flex gap-1 items-center text-slate-400">
                          {renderIcon(FileText, { className: "w-3 h-3" })}
                          <span>{conversation.documentIds?.length || 0} documents</span>
                        </div>
                      )}
                      
                      {/* Created date */}
                      <div className="flex gap-1 items-center text-slate-400">
                        {renderIcon(Calendar, { className: "w-3 h-3" })}
                        <span>Started {formatDate(conversation.createdAt)}</span>
                      </div>
                    </div>
                    
                    {/* Show document titles for RAG conversations */}
                    {conversation.type === 'rag' && conversation.documentTitles && conversation.documentTitles.length > 0 && (
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