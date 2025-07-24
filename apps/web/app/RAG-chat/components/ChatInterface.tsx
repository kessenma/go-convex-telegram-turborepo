"use client";

import { useQuery } from "convex/react";
import type { GenericId as Id } from "convex/values";
import {
  ArrowLeft,
  Bot,
  History,
  Loader2,
  MessageCircle,
  Send,
  User,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../generated-convex";
import { renderIcon } from "../../../lib/icon-utils";
import DocumentFolderIcon from "../../../components/rag/DocumentFolderIcon";
import type { ChatMessage, Document } from "../types";

interface ChatInterfaceProps {
  selectedDocuments: Document[];
  onBackToSelection: () => void;
  sessionId: string;
  onShowHistory: () => void;
}

export function ChatInterface({
  selectedDocuments,
  onBackToSelection,
  sessionId,
  onShowHistory,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [_conversationId, _setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convex queries and mutations
  const existingConversation = useQuery(
    api.ragChat.getConversationBySessionId,
    { sessionId }
  );
  const conversationMessages = useQuery(
    api.ragChat.getConversationMessages,
    existingConversation
      ? { conversationId: existingConversation._id as Id<"rag_conversations"> }
      : "skip"
  );

  // Load existing messages when conversation is found
  useEffect(() => {
    if (conversationMessages && conversationMessages.length > 0) {
      const loadedMessages: ChatMessage[] = conversationMessages.map(
        (msg: any) => ({
          id: msg.messageId,
          type: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: msg.timestamp,
          sources: msg.sources,
        })
      );
      setMessages(loadedMessages);
    }
  }, [conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Prevent double submission
    if (isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/RAG/simple-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          documentIds: selectedDocuments.map((doc) => doc._id),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: result.response,
          timestamp: Date.now(),
          sources: result.sources,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Handle service unavailable (503) or other errors
        if (response.status === 503 && result.serviceUnavailable) {
          toast.error(result.error || "Chat service is currently unavailable");
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            content:
              result.error ||
              "Someone else is using the chat service right now. Please try again in a minute or two.",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        } else {
          throw new Error(result.error || "Chat request failed");
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-white">Chat with Documents</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <p className="text-sm text-gray-300">Chatting with:</p>
            {selectedDocuments.map((doc) => (
              <div key={doc._id} className="flex items-center gap-1">
                <DocumentFolderIcon documentId={doc._id} className="" />
                <span className="text-sm text-gray-300">{doc.title}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-center mt-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">
              Powered by all-MiniLM-L6-v2 embeddings + Llama 3.2 1B LLM
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onShowHistory}
            className="flex gap-2 items-center px-3 py-2 text-gray-300 rounded-lg border border-gray-600 transition-colors hover:bg-gray-700"
          >
            {renderIcon(History, { className: "w-4 h-4" })}
            History
          </button>
          <button
            onClick={onBackToSelection}
            className="flex gap-2 items-center px-3 py-2 text-gray-300 rounded-lg border border-gray-600 transition-colors hover:bg-gray-700"
          >
            {renderIcon(ArrowLeft, { className: "w-4 h-4" })}
            Back to Selection
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="overflow-y-auto flex-1 p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400">
            <div className="mb-4">
              {renderIcon(MessageCircle, { className: "mx-auto w-12 h-12" })}
            </div>
            <p>
              Start a conversation by asking a question about your documents.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${message.type === "user"
                ? "bg-curious-cyan-600 text-white"
                : "bg-gray-700 text-gray-100"
                }`}
            >
              <div className="flex gap-2 items-start">
                {message.type === "assistant" &&
                  renderIcon(Bot, {
                    className: "w-4 h-4 mt-1 text-curious-cyan-400",
                  })}
                {message.type === "user" &&
                  renderIcon(User, { className: "w-4 h-4 mt-1" })}
                <div className="flex-1">
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-300">
                        Sources:
                      </p>
                      {message.sources.map((source, index) => (
                        <div
                          key={index}
                          className="p-2 text-xs bg-gray-800 rounded"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-curious-cyan-400">
                              {source.title}
                            </span>
                            <span className="text-gray-400">
                              {(source.score * 100).toFixed(1)}% match
                            </span>
                          </div>
                          <p className="text-gray-300">{source.snippet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-700">
              <div className="flex gap-2 items-center">
                {renderIcon(Bot, {
                  className: "w-4 h-4 text-curious-cyan-400",
                })}
                {renderIcon(Loader2, { className: "w-4 h-4 animate-spin" })}
                <span className="text-gray-300">Thinking&hellip;</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documents..."
            className="flex-1 px-3 py-2 placeholder-gray-400 text-white bg-gray-700 rounded-lg border border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-curious-cyan-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`px-4 py-2 rounded-lg transition-colors ${!inputMessage.trim() || isLoading
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-curious-cyan-600 text-white hover:bg-curious-cyan-700"
              }`}
          >
            {renderIcon(Send, { className: "w-4 h-4" })}
          </button>
        </div>
      </div>
    </div>
  );
}
