"use client";

import { useQuery } from "convex/react";
import { MessageCircle, Clock, FileText, Trash2 } from "lucide-react";
import type React from "react";
import { memo, useCallback, useState } from "react";
import { api } from "../../generated-convex";
import { renderIcon } from "../../lib/icon-utils";
import { useRagChatStore } from "../../stores/ragChatStore";
import { BackgroundGradient } from "../ui/backgrounds/background-gradient";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tool-tip";
import type { GenericId as Id } from "convex/values";

interface DocumentHistoryProps {
  // Remove unused props, this component now shows chat history
}

const DocumentHistory = memo(function DocumentHistory({
}: DocumentHistoryProps): React.ReactElement | null {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Get state and actions from Zustand store
  const { selectConversation, setSelectedDocuments } = useRagChatStore();
  
  // Fetch recent conversations
  const recentConversations = useQuery(api.ragChat.getRecentConversations, { limit: 20 });
  
  // Fetch messages for selected conversation
  const conversationMessages = useQuery(
    api.ragChat.getConversationMessages,
    selectedConversationId ? { conversationId: selectedConversationId as Id<"rag_conversations"> } : "skip"
  );
  
  const handleConversationClick = useCallback((conversation: any) => {
    // Set the selected documents from the conversation
    setSelectedDocuments(conversation.documentIds);
    
    // Navigate to chat with this conversation
    selectConversation(conversation);
  }, [setSelectedDocuments, selectConversation]);
  
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

  if (recentConversations === undefined) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Chat History</h2>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 bg-slate-800/40 rounded-xl border border-slate-600/30 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-600 rounded-xl"></div>
                <div className="flex-1">
                  <div className="w-3/4 h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="w-1/2 h-3 bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recentConversations || recentConversations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Chat History</h2>
        <div className="p-8 text-center rounded-lg border border-gray-600 bg-slate-950/50">
          <div className="mb-4">
            {renderIcon(MessageCircle, {
              className: "mx-auto w-12 h-12 text-gray-500",
            })}
          </div>
          <p className="text-gray-400">No chat conversations yet.</p>
          <p className="text-sm text-gray-500">
            Start a conversation with your documents to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="mb-8 text-xl font-semibold text-center text-white">
        Chat History
      </h2>
      
      <div className="space-y-4 max-h-[600px] overflow-y-auto pb-4">
        {recentConversations.map((conversation: any) => (
          <BackgroundGradient 
            key={conversation._id} 
            color="cyan" 
            containerClassName="w-full" 
            tronMode={true} 
            intensity="subtle"
          >
            <div 
              className="p-4 bg-slate-800/60 backdrop-blur-md rounded-xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 cursor-pointer group"
              onClick={() => handleConversationClick(conversation)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center border border-cyan-400/30">
                  {renderIcon(MessageCircle, { className: "w-6 h-6 text-white" })}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-cyan-100 truncate group-hover:text-cyan-50 transition-colors">
                      {conversation.title || "Untitled Conversation"}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-cyan-300/70">
                      {renderIcon(Clock, { className: "w-3 h-3" })}
                      <span>{formatDate(conversation._creationTime)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-cyan-200/70 mb-2">
                    <span>{conversation.messageCount || 0} messages</span>
                    <span>•</span>
                    <span>{conversation.documentTitles?.length || 0} documents</span>
                  </div>
                  
                  {conversation.documentTitles && conversation.documentTitles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {conversation.documentTitles.slice(0, 3).map((title: string, index: number) => (
                        <span 
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/60 text-xs text-cyan-300 rounded-md border border-slate-600/40"
                        >
                          {renderIcon(FileText, { className: "w-3 h-3" })}
                          {title.length > 20 ? `${title.slice(0, 20)}...` : title}
                        </span>
                      ))}
                      {conversation.documentTitles.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 bg-slate-700/60 text-xs text-cyan-300/70 rounded-md border border-slate-600/40">
                          +{conversation.documentTitles.length - 3} more
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

export { DocumentHistory };
