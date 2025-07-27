"use client";

import { useQuery } from "convex/react";
import type { GenericId as Id } from "convex/values";
import {
  ArrowLeft,
  Bot,
  History,
  MessageCircle,
  Send,
  User,
  Sparkles,
  FileText,
  ChevronDown,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../generated-convex";
import { renderIcon } from "../../../lib/icon-utils";
import Folder from "../folder";
import { BauhausLoader } from "../../ui/loading/BauhausLoader";
import { ProgressLoader } from "../../ui/loading/ProgressLoader";
import { useLLMProgress } from "../../../hooks/useLLMProgress";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tool-tip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion";
import DocumentViewer from "../DocumentViewer";
import type { ChatMessage, Document } from "../../../app/RAG-chat/types";

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
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Enhanced progress tracking
  const llmProgress = useLLMProgress();

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
    
    // Start progress tracking with estimated time
    const cleanup = llmProgress.startProcessing(8); // Estimate 8 seconds

    try {
      const response = await fetch("/api/RAG/document-chat", {
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
        llmProgress.completeProcessing();
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
      llmProgress.setError(error instanceof Error ? error.message : "Unknown error");
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
      cleanup?.();
    }
  };

  const handleFolderClick = () => {
    if (selectedDocuments.length === 1) {
      setSelectedDocumentId(selectedDocuments[0]._id);
      setDocumentViewerOpen(true);
    }
  };

  return (
    <>
      <div className="flex flex-col h-[600px] bg-gray-900/95 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Header with better contrast */}
        <div className="relative border-b border-gray-600/50 bg-gray-800/90 backdrop-blur-sm">
          {/* Geometric accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"></div>
          
          {/* Top navigation bar */}
          <div className="flex justify-between items-center p-4 sm:p-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onBackToSelection}
                  className="group relative p-3 text-gray-300 rounded-2xl border border-gray-600 transition-all duration-200 hover:bg-gray-700 hover:scale-105 hover:shadow-lg hover:text-white"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  {renderIcon(ArrowLeft, { className: "w-5 h-5 relative z-10" })}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Back to Selection
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                {renderIcon(Sparkles, { className: "w-4 h-4 text-white" })}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Chat
              </h2>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onShowHistory}
                  className="group relative p-3 text-gray-300 rounded-2xl border border-gray-600 transition-all duration-200 hover:bg-gray-700 hover:scale-105 hover:shadow-lg hover:text-white"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  {renderIcon(History, { className: "w-5 h-5 relative z-10" })}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                History
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Document context with accordion and folder */}
          <div className="px-4 sm:px-6 pb-4">
            <Accordion className="w-full">
              <AccordionItem value="document-info" className="border-gray-600">
                <AccordionTrigger className="text-left hover:no-underline py-3">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        {renderIcon(FileText, { className: "w-4 h-4" })}
                        <span className="font-medium">Context:</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        {selectedDocuments.slice(0, 2).map((doc) => (
                          <div key={doc._id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 rounded-xl border border-blue-700/50">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-300 truncate max-w-[120px]">
                              {doc.title}
                            </span>
                          </div>
                        ))}
                        {selectedDocuments.length > 2 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-xl border border-gray-600/50">
                            <span className="text-sm font-medium text-gray-300">
                              +{selectedDocuments.length - 2} more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interactive folder */}
                    <div className="flex-shrink-0 ml-4">
                      <Folder
                        color="#3B82F6"
                        size={0.7}
                        fileName={selectedDocuments.length > 1 ? `${selectedDocuments.length} docs` : selectedDocuments[0]?.title || "Documents"}
                        className="hover:scale-110 transition-transform duration-200"
                        onFolderClick={handleFolderClick}
                      />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0">
                  <div className="space-y-2">
                    {selectedDocuments.map((doc) => (
                      <div key={doc._id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-600/30">
                        <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-200 truncate block">
                            {doc.title}
                          </span>
                          <span className="text-xs text-gray-400">
                            {doc.contentType} • {doc.wordCount.toLocaleString()} words
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Status indicator */}
          <div className="px-4 sm:px-6 pb-3">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="font-medium">
                Powered by all-MiniLM-L6-v2 embeddings + Llama 3.2 1B LLM
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6 bg-gray-900/50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-4 mx-auto">
                  {renderIcon(MessageCircle, { className: "w-8 h-8 text-white" })}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  {renderIcon(Sparkles, { className: "w-3 h-3 text-white" })}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Ready to explore your documents
              </h3>
              <p className="text-gray-400 max-w-md">
                Ask me anything about your selected documents. I'll provide detailed answers with source references.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] ${message.type === "user"
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-3xl rounded-br-lg"
                  : "bg-gray-800 text-gray-100 rounded-3xl rounded-bl-lg border border-gray-700"
                  } p-4 shadow-lg`}
              >
                <div className="flex gap-3 items-start">
                  {message.type === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      {renderIcon(Bot, { className: "w-4 h-4 text-white" })}
                    </div>
                  )}
                  {message.type === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-2xl flex items-center justify-center">
                      {renderIcon(User, { className: "w-4 h-4 text-white" })}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                            Sources
                          </p>
                        </div>
                        {message.sources.map((source, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-700/50 rounded-2xl border border-gray-600/50"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-blue-400 text-sm">
                                {source.title}
                              </span>
                              <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded-full">
                                {(source.score * 100).toFixed(1)}% match
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {source.snippet}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Enhanced loading component with progress */}
          {isLoading && (
            <div className="flex justify-start">
              <ProgressLoader
                isVisible={llmProgress.isProcessing}
                message={llmProgress.message}
                steps={llmProgress.steps}
                currentStep={llmProgress.currentStep}
                progress={llmProgress.progress}
                estimatedTime={llmProgress.estimatedTime}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 sm:p-6 border-t border-gray-600/50 bg-gray-800/90 backdrop-blur-sm">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask me anything about your documents..."
                className="w-full px-4 py-3 pr-12 placeholder-gray-500 text-white bg-gray-700 rounded-2xl border border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                rows={2}
                disabled={isLoading}
              />
              {/* Character count or input status */}
              <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                {inputMessage.length > 0 && (
                  <span className={inputMessage.length > 500 ? "text-orange-500" : ""}>
                    {inputMessage.length}
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`group relative p-3 rounded-2xl transition-all duration-200 ${
                !inputMessage.trim() || isLoading
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
              {renderIcon(Send, { className: "w-5 h-5 relative z-10" })}
            </button>
          </div>
          
          {/* Quick actions or suggestions */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>Ready to answer</span>
            </div>
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      {documentViewerOpen && selectedDocumentId && (
        <DocumentViewer
          documentId={selectedDocumentId}
          isOpen={documentViewerOpen}
          onClose={() => {
            setDocumentViewerOpen(false);
            setSelectedDocumentId(null);
          }}
          small={true}
        />
      )}
    </>
  );
}