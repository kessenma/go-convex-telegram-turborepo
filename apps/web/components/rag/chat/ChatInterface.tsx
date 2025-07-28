"use client";

import { useQuery, useMutation } from "convex/react";
import type { GenericId as Id } from "convex/values";
import {
  ArrowLeft,
  Bot,
  History,
  MessageCircle,
  Send,
  User,
  Sparkles,
  Database,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../generated-convex";
import { renderIcon } from "../../../lib/icon-utils";
import { ProgressLoader } from "../../ui/loading/ProgressLoader";
import { BackgroundGradient } from "../../ui/backgrounds/background-gradient";
import { useLLMProgress } from "../../../hooks/useLLMProgress";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tool-tip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion";
import DocumentViewer from "../DocumentViewer";
import { useRagChatStore } from "../../../stores/ragChatStore";
import type { ChatMessage } from "../../../app/RAG-chat/types";

export function ChatInterface() {
  // Get state and actions from Zustand store
  const {
    selectedDocumentObjects: selectedDocuments,
    currentSessionId: sessionId,
    navigateToSelection,
    navigateToHistory
  } = useRagChatStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<Id<"rag_conversations"> | null>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [accordionOpen, setAccordionOpen] = useState(false);
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
    conversationId ? { conversationId } : "skip"
  );
  const createConversation = useMutation(api.ragChat.createConversation);
  const addMessage = useMutation(api.ragChat.addMessage);
  const updateConversationTitle = useMutation(api.ragChat.updateConversationTitle);

  // Set conversation ID when existing conversation is found
  useEffect(() => {
    if (existingConversation) {
      setConversationId(existingConversation._id as Id<"rag_conversations">);
    }
  }, [existingConversation]);

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

    const userMessageId = `user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
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
      // Create conversation if it doesn't exist
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        currentConversationId = await createConversation({
          sessionId,
          documentIds: selectedDocuments.map((doc) => doc._id as Id<"rag_documents">),
          llmModel: "Llama 3.2 1B",
          title: currentInput.slice(0, 50) + (currentInput.length > 50 ? "..." : ""),
        });
        setConversationId(currentConversationId);
      }

      // Save user message to database
      if (currentConversationId) {
        await addMessage({
          conversationId: currentConversationId,
          messageId: userMessageId,
          role: "user",
          content: currentInput,
        });
      }

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
        const assistantMessageId = `assistant_${Date.now()}`;
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          type: "assistant",
          content: result.response,
          timestamp: Date.now(),
          sources: result.sources,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Save assistant message to database
        if (currentConversationId) {
          await addMessage({
            conversationId: currentConversationId,
            messageId: assistantMessageId,
            role: "assistant",
            content: result.response,
            sources: result.sources?.map((source: any) => ({
              documentId: source.documentId as Id<"rag_documents">,
              title: source.title,
              snippet: source.snippet,
              score: source.score,
            })),
          });
        }

        // Update conversation title if this is the first exchange
        if (messages.length === 0 && currentConversationId) {
          await updateConversationTitle({
            conversationId: currentConversationId,
            title: currentInput.slice(0, 50) + (currentInput.length > 50 ? "..." : ""),
          });
        }
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



  return (
    <>
      <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="normal">
        <div className="flex flex-col h-[700px] bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">
          {/* Tron-inspired header */}
          <div className="relative border-b backdrop-blur-md border-cyan-500/30 bg-slate-800/60">
            {/* Animated accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
            
            {/* Top navigation bar */}
            <div className="flex justify-between items-center p-4 sm:p-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <BackgroundGradient color="cyan" containerClassName="p-0" tronMode={true} intensity="subtle">
                    <button
                      onClick={navigateToSelection}
                      className="relative p-3 text-cyan-300 rounded-2xl border backdrop-blur-md transition-all duration-300 group hover:text-cyan-100 bg-slate-800/60 border-cyan-500/20 hover:border-cyan-400/40"
                    >
                      {renderIcon(ArrowLeft, { className: "w-5 h-5" })}
                    </button>
                  </BackgroundGradient>
                </TooltipTrigger>
                <TooltipContent className="border backdrop-blur-md bg-slate-900/90 border-cyan-500/30">
                  Back to Selection
                </TooltipContent>
              </Tooltip>

              {/* Header with context accordion */}
              <div className="flex-1 mx-6">
                <Accordion 
                  type="single" 
                  collapsible 
                  value={accordionOpen ? "context" : ""}
                  onValueChange={(value) => setAccordionOpen(value === "context")}
                >
                  <AccordionItem value="context" className="border-none">
                    <AccordionTrigger className="px-4 py-2 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:no-underline bg-slate-800/40 border-cyan-500/20 hover:border-cyan-400/40">
                      <div className="flex gap-3 items-center">
                        <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl">
                          {renderIcon(Database, { className: "w-4 h-4 text-white" })}
                        </div>
                        <div className="text-left">
                          <h2 className="text-lg font-bold text-cyan-100">
                            AI Chat
                          </h2>
                          <p className="text-xs text-cyan-300/70">
                            {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} loaded
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-2">
                      <div className="space-y-2">
                        {selectedDocuments.map((doc) => (
                          <div key={doc._id} className="flex gap-3 items-center p-3 rounded-xl border backdrop-blur-md bg-slate-800/40 border-cyan-500/10">
                            <div className="flex-shrink-0 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-sm font-medium text-cyan-200 truncate">
                                {doc.title}
                              </span>
                              <span className="text-xs text-cyan-300/70">
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

              <Tooltip>
                <TooltipTrigger asChild>
                  <BackgroundGradient color="purple" containerClassName="p-0" tronMode={true} intensity="subtle">
                    <button
                      onClick={navigateToHistory}
                      className="relative p-3 text-purple-300 rounded-2xl border backdrop-blur-md transition-all duration-300 group hover:text-purple-100 bg-slate-800/60 border-purple-500/20 hover:border-purple-400/40"
                    >
                      {renderIcon(History, { className: "w-5 h-5" })}
                    </button>
                  </BackgroundGradient>
                </TooltipTrigger>
                <TooltipContent className="border backdrop-blur-md bg-slate-900/90 border-purple-500/30">
                  History
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Status indicator */}
            <div className="px-6 pb-4">
              <div className="flex gap-2 justify-center items-center px-4 py-2 text-xs text-emerald-400 rounded-full border backdrop-blur-md bg-slate-800/30 border-emerald-500/20">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="font-medium">
                  Powered by all-MiniLM-L6-v2 embeddings + Llama 3.2 1B LLM
                </span>
              </div>
            </div>
        </div>

          {/* Messages */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6 backdrop-blur-sm bg-slate-900/30">
            {messages.length === 0 && (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <div className="relative mb-8">
                  <BackgroundGradient color="cyan" containerClassName="p-0" tronMode={true} intensity="subtle">
                    <div className="flex justify-center items-center w-24 h-24 rounded-3xl border backdrop-blur-md bg-slate-800/60 border-cyan-500/20">
                      {renderIcon(MessageCircle, { className: "w-10 h-10 text-cyan-400" })}
                    </div>
                  </BackgroundGradient>
                  <div className="flex absolute -top-2 -right-2 justify-center items-center w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full border-2 border-slate-900">
                    {renderIcon(Sparkles, { className: "w-4 h-4 text-white" })}
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-cyan-100">
                  Ready to explore your documents
                </h3>
                <p className="max-w-md leading-relaxed text-cyan-200/70">
                  Ask me anything about your selected documents. I'll provide detailed answers with source references.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <BackgroundGradient 
                  color={message.type === "user" ? "cyan" : "purple"} 
                  containerClassName={`max-w-[85%] ${message.type === "user" ? "ml-auto" : "mr-auto"}`}
                  tronMode={true}
                  intensity="subtle"
                >
                  <div
                    className={`${message.type === "user"
                      ? "bg-slate-800/60 text-cyan-100 rounded-3xl rounded-br-lg border border-cyan-500/20"
                      : "bg-slate-800/60 text-slate-100 rounded-3xl rounded-bl-lg border border-purple-500/20"
                      } p-5 backdrop-blur-md shadow-lg`}
                  >
                    <div className="flex gap-3 items-start">
                      {message.type === "assistant" && (
                        <div className="flex flex-shrink-0 justify-center items-center w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl border border-purple-400/30">
                          {renderIcon(Bot, { className: "w-4 h-4 text-white" })}
                        </div>
                      )}
                      {message.type === "user" && (
                        <div className="flex flex-shrink-0 justify-center items-center w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl border border-cyan-400/30">
                          {renderIcon(User, { className: "w-4 h-4 text-white" })}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>

                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <div className="flex gap-2 items-center">
                              <div className="w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"></div>
                              <p className="text-xs font-semibold tracking-wide text-cyan-300 uppercase">
                                Sources
                              </p>
                            </div>
                            {message.sources.map((source, index) => (
                              <div key={index} className="w-full">
                                <div className="p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 bg-slate-800/60 border-slate-600/40 hover:border-slate-500/60">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-cyan-300">
                                      {source.title}
                                    </span>
                                    <span className="px-2 py-1 text-xs rounded-md border text-slate-400 bg-slate-700/80 border-slate-600/50">
                                      {(source.score * 100).toFixed(1)}% match
                                    </span>
                                  </div>
                                  <p className="text-sm leading-relaxed text-slate-300">
                                    {source.snippet}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </BackgroundGradient>
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

          {/* Tron-inspired input */}
          <div className="p-6 border-t backdrop-blur-md border-cyan-500/30 bg-slate-800/60">
            <div className="flex gap-4 items-end">
              <div className="relative flex-1">
                <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="subtle">
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
                    className="px-5 py-4 pr-16 w-full text-cyan-100 rounded-2xl border shadow-sm backdrop-blur-md transition-all duration-300 resize-none placeholder-cyan-400/60 bg-slate-800/60 border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50"
                    rows={2}
                    disabled={isLoading}
                  />
                </BackgroundGradient>
                {/* Character count or input status */}
                <div className="absolute bottom-3 right-4 text-xs text-cyan-400/70">
                  {inputMessage.length > 0 && (
                    <span className={inputMessage.length > 500 ? "text-orange-400" : ""}>
                      {inputMessage.length}
                    </span>
                  )}
                </div>
              </div>
              
              <BackgroundGradient color={!inputMessage.trim() || isLoading ? "white" : "cyan"} tronMode={true} intensity="subtle">
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className={`group relative p-4 rounded-2xl transition-all duration-300 ${
                    !inputMessage.trim() || isLoading
                      ? "bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-600/30"
                      : "bg-slate-800/60 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40 hover:scale-105 shadow-lg hover:shadow-cyan-500/20"
                  } backdrop-blur-md`}
                >
                  {renderIcon(Send, { className: "w-5 h-5" })}
                </button>
              </BackgroundGradient>
            </div>
            
            {/* Status and shortcuts */}
            <div className="flex justify-between items-center mt-4 text-xs text-cyan-400/70">
              <div className="flex gap-2 items-center">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>Ready to answer</span>
              </div>
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      </BackgroundGradient>

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
