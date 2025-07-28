"use client";

import { useMutation, useQuery } from "convex/react";
import type { GenericId as Id } from "convex/values";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  History,
  MessageCircle,
  Search,
  Trash2,
  Layers3,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../../generated-convex";
import { renderIcon } from "../../../lib/icon-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tool-tip";
import { BackgroundGradient } from "../../ui/backgrounds/background-gradient";
import { useRagChatStore } from "../../../stores/ragChatStore";
import type { ChatConversation } from "../../../app/RAG-chat/types";

export function ChatHistory(): React.ReactElement {
  // Get state and actions from Zustand store
  const {
    currentSessionId,
    selectConversation,
    startNewChat,
    navigateToSelection,
    navigateBack
  } = useRagChatStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  // Fetch recent conversations
  const conversations = useQuery(api.ragChat.getRecentConversations, {
    limit: 50,
  });

  // Mutations
  const updateTitle = useMutation(api.ragChat.updateConversationTitle);
  const deactivateConversation = useMutation(
    api.ragChat.deactivateConversation
  );

  // Filter conversations based on search term
  const filteredConversations =
    conversations?.filter((conversation: ChatConversation) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        conversation.title?.toLowerCase().includes(searchLower) ||
        conversation.documents?.some((doc: { _id: string; title: string }) =>
          doc.title.toLowerCase().includes(searchLower)
        )
      );
    }) || [];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConversationTitle = (conversation: ChatConversation) => {
    if (conversation.title) return conversation.title;
    if (conversation.documents && conversation.documents.length > 0) {
      return `Chat with ${conversation.documents.map((d) => d.title).join(", ")}`;
    }
    return "Untitled Conversation";
  };

  const handleEditTitle = async (conversationId: string, title: string) => {
    try {
      await updateTitle({
        conversationId: conversationId as Id<"rag_conversations">,
        title: title.trim() || "Untitled Conversation",
      });
      setEditingTitle(null);
      setNewTitle("");
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deactivateConversation({
          conversationId: conversationId as Id<"rag_conversations">,
        });
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    }
  };

  const startEditingTitle = (conversation: ChatConversation) => {
    setEditingTitle(conversation._id);
    setNewTitle(getConversationTitle(conversation));
  };

  return (
    <BackgroundGradient color="purple" containerClassName="w-full" tronMode={true} intensity="normal">
      <div className="flex flex-col h-[700px] bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 overflow-hidden">
        {/* Tron-inspired header */}
        <div className="relative border-b border-purple-500/30 bg-slate-800/60 backdrop-blur-md">
          {/* Animated accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse"></div>
          
          {/* Top navigation bar */}
          <div className="flex justify-between items-center p-4 sm:p-6">
            <div className="flex gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <BackgroundGradient color="purple" containerClassName="p-0" tronMode={true} intensity="subtle">
                    <button
                      onClick={navigateBack}
                      className="group relative p-3 text-purple-300 rounded-2xl transition-all duration-300 hover:text-purple-100 bg-slate-800/60 backdrop-blur-md border border-purple-500/20 hover:border-purple-400/40"
                    >
                      {renderIcon(ArrowLeft, { className: "w-5 h-5" })}
                    </button>
                  </BackgroundGradient>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900/90 backdrop-blur-md border border-purple-500/30">
                  Back
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <BackgroundGradient color="cyan" containerClassName="p-0" tronMode={true} intensity="subtle">
                    <button
                      onClick={navigateToSelection}
                      className="group relative p-3 text-cyan-300 rounded-2xl transition-all duration-300 hover:text-cyan-100 bg-slate-800/60 backdrop-blur-md border border-cyan-500/20 hover:border-cyan-400/40"
                    >
                      {renderIcon(Layers3, { className: "w-5 h-5" })}
                    </button>
                  </BackgroundGradient>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30">
                  All Documents
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center border border-purple-400/30">
                {renderIcon(History, { className: "w-4 h-4 text-white" })}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-purple-100">
                Chat History
              </h2>
            </div>

            <BackgroundGradient color="purple" containerClassName="p-0" tronMode={true} intensity="subtle">
              <button
                onClick={startNewChat}
                className="group relative px-4 py-2 text-sm font-medium text-white rounded-2xl bg-slate-800/60 backdrop-blur-md border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/20"
              >
                <span className="hidden sm:inline">New Chat</span>
                <span className="sm:hidden">New</span>
              </button>
            </BackgroundGradient>
          </div>

          {/* Status indicator */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-2 text-xs text-purple-400 bg-slate-800/30 backdrop-blur-md rounded-full px-4 py-2 border border-purple-500/20">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="font-medium">
                Conversation History & Management
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 sm:p-6 border-b border-purple-500/30">
          <BackgroundGradient color="purple" containerClassName="w-full" tronMode={true} intensity="subtle">
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-4 pointer-events-none">
                {renderIcon(Search, { className: "w-5 h-5 text-purple-400" })}
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="block p-3 pl-12 w-full text-sm placeholder-purple-400/60 text-purple-100 bg-slate-800/60 backdrop-blur-md rounded-2xl border border-purple-500/20 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 shadow-sm"
              />
            </div>
          </BackgroundGradient>
        </div>

        {/* Conversations List */}
        <div className="overflow-y-auto flex-1 bg-slate-900/30 backdrop-blur-sm">
          {!conversations ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-purple-400">Loading conversations...</div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-32 text-center p-8">
              {searchTerm ? (
                <>
                  <BackgroundGradient color="purple" containerClassName="p-0" tronMode={true} intensity="subtle">
                    <div className="w-16 h-16 bg-slate-800/60 backdrop-blur-md rounded-3xl flex items-center justify-center mb-4 border border-purple-500/20">
                      {renderIcon(Search, { className: "w-6 h-6 text-purple-400" })}
                    </div>
                  </BackgroundGradient>
                  <h3 className="text-lg font-semibold text-purple-100 mb-2">No matches found</h3>
                  <p className="text-purple-200/70">No conversations found matching "{searchTerm}"</p>
                </>
              ) : (
                <>
                  <BackgroundGradient color="purple" containerClassName="p-0" tronMode={true} intensity="subtle">
                    <div className="w-16 h-16 bg-slate-800/60 backdrop-blur-md rounded-3xl flex items-center justify-center mb-4 border border-purple-500/20">
                      {renderIcon(MessageCircle, { className: "w-6 h-6 text-purple-400" })}
                    </div>
                  </BackgroundGradient>
                  <h3 className="text-lg font-semibold text-purple-100 mb-2">No conversations yet</h3>
                  <p className="text-purple-200/70">Start a new chat to see it here</p>
                </>
              )}
            </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredConversations.map((conversation: ChatConversation) => (
              <BackgroundGradient 
                key={conversation._id}
                color={conversation.sessionId === currentSessionId ? "purple" : "cyan"} 
                containerClassName="w-full" 
                tronMode={true} 
                intensity="subtle"
              >
                <div
                  className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-md ${
                    conversation.sessionId === currentSessionId
                      ? "bg-slate-800/60 border-purple-500/30 shadow-lg shadow-purple-500/20"
                      : "bg-slate-800/40 border-slate-600/30 hover:bg-slate-700/50 hover:border-slate-500/50 hover:shadow-md hover:scale-[1.02]"
                  }`}
                  onClick={() => selectConversation(conversation)}
                >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    {editingTitle === conversation._id ? (
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={() =>
                          handleEditTitle(conversation._id, newTitle)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleEditTitle(conversation._id, newTitle);
                          } else if (e.key === "Escape") {
                            setEditingTitle(null);
                            setNewTitle("");
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-2 w-full text-sm text-white bg-gray-600 rounded-xl border border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <h3 className="text-sm font-semibold text-white truncate mb-1">
                        {getConversationTitle(conversation)}
                      </h3>
                    )}

                    {conversation.documents &&
                      conversation.documents.length > 0 && (
                        <div className="flex gap-2 items-center mb-2">
                          {renderIcon(FileText, {
                            className: "w-3 h-3 text-gray-400",
                          })}
                          <span className="text-xs text-gray-400 truncate">
                            {conversation.documents
                              .map((d) => d.title)
                              .join(", ")}
                          </span>
                        </div>
                      )}

                    <div className="flex gap-4 items-center text-xs text-gray-500">
                      <div className="flex gap-1 items-center">
                        {renderIcon(Clock, { className: "w-3 h-3" })}
                        <span>{formatDate(conversation.lastMessageAt)}</span>
                      </div>
                      <div className="flex gap-1 items-center">
                        {renderIcon(MessageCircle, { className: "w-3 h-3" })}
                        <span>{conversation.messageCount} messages</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 items-center ml-3">
                    {/* Action buttons - only show on hover */}
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingTitle(conversation);
                        }}
                        className="p-2 text-gray-400 rounded-xl transition-colors hover:text-gray-300 hover:bg-gray-600"
                        title="Edit title"
                      >
                        {renderIcon(Edit3, { className: "w-3 h-3" })}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation._id);
                        }}
                        className="p-2 text-gray-400 rounded-xl transition-colors hover:text-red-400 hover:bg-red-900/30"
                        title="Delete conversation"
                      >
                        {renderIcon(Trash2, { className: "w-3 h-3" })}
                      </button>
                    </div>
                    {renderIcon(ChevronRight, {
                      className: "w-4 h-4 text-gray-400 transition-transform group-hover:translate-x-1",
                    })}
                  </div>
                </div>
                </div>
              </BackgroundGradient>
            ))}
          </div>
        )}
        </div>

        {/* Footer with stats */}
        {conversations && conversations.length > 0 && (
          <div className="p-4 sm:p-6 text-xs text-purple-300 border-t border-purple-500/30 bg-slate-800/50 backdrop-blur-md">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="font-medium">{filteredConversations.length} conversations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {conversations
                    .reduce(
                      (sum: number, conv: ChatConversation) =>
                        sum + conv.totalTokensUsed,
                      0
                    )
                    .toLocaleString()}{" "}
                  tokens used
                </span>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BackgroundGradient>
  );
}
