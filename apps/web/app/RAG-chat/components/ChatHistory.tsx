// /Users/kyleessenmacher/WS/go-convex-telegram-turborepo/apps/web/app/RAG-chat/components/ChatHistory.tsx
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
} from "lucide-react";
import { useState } from "react";
import { api } from "../../../generated-convex";
import { renderIcon } from "../../../lib/icon-utils";
import type { ChatConversation } from "../types";

interface ChatHistoryProps {
  onSelectConversation: (conversation: ChatConversation) => void;
  onNewChat: () => void;
  onBackToSelection: () => void;
  currentSessionId?: string;
}

export function ChatHistory({
  onSelectConversation,
  onNewChat,
  onBackToSelection,
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
    <div className="flex flex-col h-[600px] bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <div className="flex gap-2 items-center">
          <button
            onClick={onBackToSelection}
            className="flex gap-2 items-center px-2 py-1 mr-2 text-gray-300 rounded-lg border border-gray-600 transition-colors hover:bg-gray-700"
          >
            {renderIcon(ArrowLeft, { className: "w-4 h-4" })}
            Back
          </button>
          {renderIcon(History, { className: "w-5 h-5 text-curious-cyan-400" })}
          <h2 className="text-lg font-semibold text-white">Chat History</h2>
        </div>
        <button
          onClick={onNewChat}
          className="px-3 py-1.5 text-sm text-white rounded-lg border border-curious-cyan-600 transition-colors bg-curious-cyan-600 hover:bg-curious-cyan-700"
        >
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
            {renderIcon(Search, { className: "w-4 h-4 text-gray-400" })}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="block p-2 pl-10 w-full text-sm placeholder-gray-400 text-white bg-gray-700 rounded-lg border border-gray-600 focus:ring-curious-cyan-500 focus:border-curious-cyan-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="overflow-y-auto flex-1">
        {!conversations ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-gray-400">Loading conversations...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-32 text-gray-400">
            {searchTerm ? (
              <>
                {renderIcon(Search, { className: "w-8 h-8 mb-2" })}
                <p>No conversations found matching "{searchTerm}"</p>
              </>
            ) : (
              <>
                {renderIcon(MessageCircle, { className: "w-8 h-8 mb-2" })}
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to see it here</p>
              </>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation: ChatConversation) => (
              <div
                key={conversation._id}
                className={`group relative p-3 rounded-lg border transition-colors cursor-pointer ${
                  conversation.sessionId === currentSessionId
                    ? "bg-curious-cyan-900/30 border-curious-cyan-600"
                    : "bg-gray-700/50 border-gray-600 hover:bg-gray-700"
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
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleEditTitle(conversation._id, newTitle);
                          } else if (e.key === "Escape") {
                            setEditingTitle(null);
                            setNewTitle("");
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 w-full text-sm text-white bg-gray-600 rounded border border-gray-500 focus:outline-none focus:ring-1 focus:ring-curious-cyan-500"
                      />
                    ) : (
                      <h3 className="text-sm font-medium text-white truncate">
                        {getConversationTitle(conversation)}
                      </h3>
                    )}

                    {conversation.documents &&
                      conversation.documents.length > 0 && (
                        <div className="flex gap-1 items-center mt-1">
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

                    <div className="flex gap-4 items-center mt-2 text-xs text-gray-400">
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

                  <div className="flex gap-1 items-center ml-2">
                    {/* Action buttons - only show on hover */}
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingTitle(conversation);
                        }}
                        className="p-1 text-gray-400 rounded transition-colors hover:text-white hover:bg-gray-600"
                        title="Edit title"
                      >
                        {renderIcon(Edit3, { className: "w-3 h-3" })}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation._id);
                        }}
                        className="p-1 text-gray-400 rounded transition-colors hover:text-red-400 hover:bg-gray-600"
                        title="Delete conversation"
                      >
                        {renderIcon(Trash2, { className: "w-3 h-3" })}
                      </button>
                    </div>
                    {renderIcon(ChevronRight, {
                      className: "w-4 h-4 text-gray-400",
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
        <div className="p-3 text-xs text-gray-400 border-t border-gray-700">
          <div className="flex justify-between">
            <span>{filteredConversations.length} conversations</span>
            <span>
              {conversations
                .reduce(
                  (sum: number, conv: ChatConversation) =>
                    sum + conv.totalTokensUsed,
                  0
                )
                .toLocaleString()}{" "}
              total tokens
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
