"use client";

import React from "react";
import { useQuery } from "convex/react";
import { MessageCircle, Clock, FileText, FolderOpen, Bot, ArrowUpDown, Filter, Search, Calendar, Hash, Cpu, Loader2 } from "lucide-react";
import { memo, useCallback, useState, useMemo, useEffect, useRef } from "react";
import { api } from "../../generated-convex";
import { renderIcon } from "../../lib/icon-utils";
import { BackgroundGradient } from "../ui/backgrounds/background-gradient";

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
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch unified conversations from the new unified API with pagination
  const conversationsResult = useQuery(api.unifiedChat.getRecentConversations, { 
    limit: 20,
    ...(currentCursor && { cursor: currentCursor })
  });
  
  // Handle initial load and pagination
  useEffect(() => {
    if (conversationsResult) {
      if (conversationsResult.conversations) {
        // New API format with pagination
        if (currentCursor === null) {
          // Initial load
          setAllConversations(conversationsResult.conversations);
        } else {
          // Append new conversations for pagination
          setAllConversations(prev => [...prev, ...conversationsResult.conversations]);
        }
        setHasMore(conversationsResult.hasMore || false);
        setNextCursor(conversationsResult.nextCursor || null);
        setIsLoadingMore(false);
      } else {
        // Fallback for old API format (array of conversations)
        if (currentCursor === null) {
          setAllConversations(conversationsResult);
          setHasMore(conversationsResult.length >= 20); // Assume more if we got a full page
          setIsLoadingMore(false);
        }
      }
    }
  }, [conversationsResult, currentCursor]);

  // Load more conversations
  const loadMoreConversations = useCallback(() => {
    if (!hasMore || isLoadingMore || !nextCursor) return;
    
    setIsLoadingMore(true);
    setCurrentCursor(nextCursor);
  }, [hasMore, isLoadingMore, nextCursor]);

  // Infinite scroll handler
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      
      if (isNearBottom && hasMore && !isLoadingMore) {
        loadMoreConversations();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, loadMoreConversations]);

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
    if (!allConversations || allConversations.length === 0) return [];

    let filtered = allConversations.filter(conv => {
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
  }, [allConversations, filter, sortBy, sortOrder, searchTerm, selectedDocumentFilter]);

  if (conversationsResult === undefined) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border animate-pulse bg-slate-800/40 border-cyan-500/20">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-xl bg-cyan-800/40"></div>
                <div className="flex-1">
                  <div className="mb-2 w-3/4 h-4 rounded bg-cyan-700/30"></div>
                  <div className="w-1/2 h-3 rounded bg-cyan-700/20"></div>
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
        <div className="p-8 text-center rounded-lg border border-cyan-500/20 bg-slate-900/50">
          <div className="mb-4">
            {renderIcon(MessageCircle, {
              className: "mx-auto w-12 h-12 text-cyan-500/50",
            })}
          </div>
          <p className="text-cyan-300">No conversations found</p>
          <p className="text-sm text-cyan-400/70">
            Try adjusting your filters or start a new chat
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center items-center mb-6">
        <div className="flex flex-col gap-4 items-center w-full max-w-2xl">
          {/* Search Controls */}
          <div className="flex gap-2 w-full sm:w-auto sm:min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-300/70" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 pr-3 pl-9 w-full text-sm text-cyan-100 rounded-md border placeholder-cyan-300/50 bg-slate-800/60 border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/40"
              />
            </div>
          </div>
          
          {/* Type Filter */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                filter === 'all' ? 'bg-cyan-500/20 text-cyan-100' : 'text-cyan-300/70 hover:text-cyan-100 hover:bg-cyan-500/10'
              }`}
            >
              All
            </button>
            <button
               onClick={() => setFilter('general')}
               className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md ${filter === 'general' ? 'bg-cyan-500/20 text-cyan-100' : 'text-cyan-300/70 hover:text-cyan-100 hover:bg-cyan-500/10'}`}
             >
               {renderIcon(Bot, { className: "w-4 h-4" })}
               General
             </button>
             <button
               onClick={() => setFilter('rag')}
               className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md ${filter === 'rag' ? 'bg-cyan-500/20 text-cyan-100' : 'text-cyan-300/70 hover:text-cyan-100 hover:bg-cyan-500/10'}`}
             >
               {renderIcon(FolderOpen, { className: "w-4 h-4" })}
               Documents
             </button>
          </div>
          
          {/* Document Filter */}
          <div className="flex gap-2">
            <select
              value={selectedDocumentFilter}
              onChange={(e) => setSelectedDocumentFilter(e.target.value)}
              className="px-3 py-1 text-xs rounded-lg border transition-all duration-200 bg-slate-700/50 border-slate-600/30 text-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
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
              className="px-3 py-1 text-xs rounded-lg border transition-all duration-200 bg-slate-700/50 border-slate-600/30 text-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            >
              <option value="lastMessage">Last Message</option>
              <option value="createdAt">Created At</option>
              <option value="tokens">Tokens Used</option>
              <option value="messageCount">Message Count</option>
              <option value="model">Model</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 text-xs rounded-lg border transition-all duration-200 bg-slate-700/50 border-slate-600/30 text-cyan-300/70 hover:bg-slate-600/50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="space-y-4 max-h-[600px] overflow-y-auto pb-4"
      >
          {processedConversations.map((conversation, index) => (
            <BackgroundGradient 
              key={conversation._id}
              color="cyan" 
              containerClassName="w-full" 
              tronMode={true} 
              intensity={conversation.type === 'rag' ? "normal" : "subtle"}
            >
              <div 
                className={`p-4 backdrop-blur-md rounded-xl border transition-all duration-300 cursor-pointer group ${
                  conversation.type === 'rag' 
                    ? 'bg-slate-950/50 border-cyan-500/20 hover:border-cyan-400/40'
                    : 'bg-slate-800/60 border-cyan-500/10 hover:border-cyan-400/30'
                }`}
                onClick={() => handleConversationClick(conversation, conversation.type)}
              >
                <div className="flex gap-4 items-start">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${
                    conversation.type === 'rag'
                      ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 border-cyan-400/30'
                      : 'bg-gradient-to-br from-cyan-400 to-cyan-500 border-cyan-300/30'
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
                          ? 'text-cyan-100 group-hover:text-cyan-50'
                          : 'text-cyan-100 group-hover:text-cyan-50'
                      }`}>
                        {conversation.title || "Untitled Conversation"}
                      </h3>
                      <div className="flex gap-2 items-center text-xs text-cyan-200/70">
                        {renderIcon(Clock, { className: "w-3 h-3" })}
                        <span>{formatDate(conversation.lastMessageAt || conversation.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      {/* Model info */}
                      {conversation.llmModel && (
                        <div className="flex gap-1 items-center text-cyan-300/70">
                          {renderIcon(Cpu, { className: "w-3 h-3" })}
                          <span>{conversation.llmModel}</span>
                        </div>
                      )}
                      
                      {/* Token usage */}
                      {conversation.totalTokensUsed > 0 && (
                        <div className="flex gap-1 items-center text-cyan-300/70">
                          {renderIcon(Hash, { className: "w-3 h-3" })}
                          <span>{conversation.totalTokensUsed.toLocaleString()} tokens</span>
                        </div>
                      )}
                      
                      {/* Message count */}
                      <div className="flex gap-1 items-center text-cyan-300/70">
                        {renderIcon(MessageCircle, { className: "w-3 h-3" })}
                        <span>{conversation.messageCount || 0} messages</span>
                      </div>
                      
                      {/* Document info */}
                      {conversation.type === 'rag' && (
                        <div className="flex gap-1 items-center text-cyan-300/70">
                          {renderIcon(FileText, { className: "w-3 h-3" })}
                          <span>{conversation.documentIds?.length || 0} documents</span>
                        </div>
                      )}
                      
                      {/* Created date */}
                      <div className="flex gap-1 items-center text-cyan-300/70">
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
                            className="inline-flex gap-1 items-center px-2 py-1 text-xs text-cyan-300 rounded-md border bg-slate-700/60 border-cyan-600/30"
                          >
                            {renderIcon(FileText, { className: "w-3 h-3" })}
                            {title.length > 20 ? `${title.slice(0, 20)}...` : title}
                          </span>
                        ))}
                        {conversation.documentTitles.filter((title: string) => title && typeof title === 'string').length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 text-xs rounded-md border bg-slate-700/60 text-cyan-300/70 border-cyan-600/30">
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
          
          {/* Loading indicator for infinite scroll */}
          {isLoadingMore && (
            <div className="flex justify-center items-center py-4">
              <div className="flex gap-2 items-center text-cyan-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading more conversations...</span>
              </div>
            </div>
          )}
          
          {/* End of results indicator */}
          {!hasMore && processedConversations.length > 0 && (
            <div className="flex justify-center items-center py-4">
              <div className="text-sm text-cyan-400/70">
                No more conversations to load
              </div>
            </div>
          )}
        </div>
    </div>
  );
});

export { UnifiedChatHistory };