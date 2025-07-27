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
import type { ChatConversation } from "../../../app/RAG-chat/types";

interface ChatHistoryProps {
  onSelectConversation: (conversation: ChatConversation) => void;
  onNewChat: () => void;
  onBackToSelection: () => void;
  onBackToPrevious: () => void;
  currentSessionId?: string;
}

export function ChatHistory({
  onSelectConversation,
  onNewChat,
  onBackToSelection,
  onBackToPrevious,
  currentSessionId,
}: ChatHistoryProps): React.ReactElement {
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
    <div className="flex flex-col h-[600px] bg-gray-900/95 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="relative border-b border-gray-600/50 bg-gray-800/90 backdrop-blur-sm">
        {/* Geometric accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
        
        <div className="flex justify-between items-center p-4 sm:p-6">
          <div className="flex gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onBackToPrevious}
                  className="group relative p-3 text-gray-300 rounded-2xl border border-gray-600 transition-all duration-200 hover:bg-gray-700 hover:scale-105 hover:shadow-lg hover:text-white"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  {renderIcon(ArrowLeft, { className: "w-5 h-5 relative z-10" })}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Back
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onBackToSelection}
                  className="group relative p-3 text-gray-300 rounded-2xl border border-gray-600 transition-all duration-200 hover:bg-gray-700 hover:scale-105 hover:shadow-lg hover:text-white"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  {renderIcon(Layers3, { className: "w-5 h-5 relative z-10" })}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                All Documents
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              {renderIcon(History, { className: "w-4 h-4 text-white" })}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              History
            </h2>
          </div>

          <button
            onClick={onNewChat}
            className="group relative px-4 py-2 text-sm font-medium text-white rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-200 hover:from-purple-600 hover:to-pink-700 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
            <span className="hidden sm:inline relative z-10">New Chat</span>
            <span className="sm:hidden relative z-10">New</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 sm:p-6 border-b border-gray-600/50">
        <div className="relative">
          <div className="flex absolute inset-y-0 left-0 items-center pl-4 pointer-events-none">
            {renderIcon(Search, { className: "w-5 h-5 text-gray-400" })}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="block p-3 pl-12 w-full text-sm placeholder-gray-500 text-white bg-gray-700 rounded-2xl border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="overflow-y-auto flex-1 bg-gray-900/50">
        {!conversations ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-gray-400">Loading conversations...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-32 text-center p-8">
            {searchTerm ? (
              <>
                <div className="w-16 h-16 bg-gray-800 rounded-3xl flex items-center justify-center mb-4">
                  {renderIcon(Search, { className: "w-6 h-6 text-gray-500" })}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No matches found</h3>
                <p className="text-gray-400">No conversations found matching "{searchTerm}"</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-800 to-pink-800 rounded-3xl flex items-center justify-center mb-4">
                  {renderIcon(MessageCircle, { className: "w-6 h-6 text-purple-400" })}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
                <p className="text-gray-400">Start a new chat to see it here</p>
              </>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredConversations.map((conversation: ChatConversation) => (
              <div
                key={conversation._id}
                className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  conversation.sessionId === currentSessionId
                    ? "bg-purple-900/30 border-purple-600 shadow-md"
                    : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:shadow-md hover:scale-[1.02]"
                }`}
                onClick={() => onSelectConversation(conversation)}
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
            ))}
          </div>
        )}
      </div>

      {/* Footer with stats */}
      {conversations && conversations.length > 0 && (
        <div className="p-4 sm:p-6 text-xs text-gray-400 border-t border-gray-600/50 bg-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
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
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}