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
  Search,
  TextSearch,
  Eye,
  FileSearch,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../generated-convex";
import { renderIcon } from "../../../lib/icon-utils";
import { AnimatedBotIcon } from "../../ui/icons/AnimatedBotIcon";
import { AnimatedFileSearchIcon } from "../../ui/icons/AnimatedFileSearchIcon";
import { ProgressLoader } from "../../ui/loading/ProgressLoader";
import { BackgroundGradient } from "../../ui/backgrounds/background-gradient";
import { useLLMProgress } from "../../../hooks/useLLMProgress";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tool-tip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion";
import { DocumentViewer } from "../DocumentViewer";

import { useRagChatStore } from "../../../stores/ragChatStore";
import type { ChatMessage } from "../../../app/RAG-chat/types";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInterfaceProps {
  onOpenDocumentViewer?: (documentId: string) => void;
}

export function ChatInterface({ onOpenDocumentViewer }: ChatInterfaceProps = {}) {
  // Document viewer state
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"rag_documents"> | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpenDocumentViewer = (documentId: string) => {
    setSelectedDocumentId(documentId as Id<"rag_documents">);
    setIsDocumentViewerOpen(true);
    // Also call the external prop if provided
    onOpenDocumentViewer?.(documentId);
  };

  const handleCloseDocumentViewer = () => {
    setIsDocumentViewerOpen(false);
    setSelectedDocumentId(null);
  };
  // Get state and actions from Zustand store
  const {
    selectedDocumentObjects: selectedDocuments,
    selectedDocuments: selectedDocumentIds,
    currentSessionId: sessionId,
    navigateToSelection,
    navigateToHistory,
    setSelectedDocumentObjects
  } = useRagChatStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<Id<"rag_conversations"> | null>(null);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Reset carousel index when documents change
  useEffect(() => {
    setCarouselIndex(0);
  }, [selectedDocuments]);

  // Rotate through document titles in carousel
  useEffect(() => {
    if (selectedDocuments.length <= 1 || isCarouselPaused) return;

    const interval = setInterval(() => {
      setCarouselIndex((prevIndex) => (prevIndex + 1) % selectedDocuments.length);
    }, 3000); // Rotate every 3 seconds

    return () => clearInterval(interval);
  }, [selectedDocuments.length, isCarouselPaused]);

  // Enhanced progress tracking
  const llmProgress = useLLMProgress();

  // Convex queries and mutations
  const existingConversation = useQuery(
    api.ragChat.getConversationBySessionId,
    sessionId ? { sessionId } : "skip"
  );
  const conversationMessages = useQuery(
    api.ragChat.getConversationMessages,
    conversationId ? { conversationId } : "skip"
  );
  
  // Fetch full document objects when document IDs are available
  const fullDocuments = useQuery(
    api.documents.getDocumentsByIds,
    selectedDocumentIds && selectedDocumentIds.length > 0 
      ? { documentIds: selectedDocumentIds as Id<"rag_documents">[] } 
      : "skip"
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

  // Update selected document objects when full documents are loaded
  useEffect(() => {
    if (fullDocuments && selectedDocumentIds && selectedDocumentIds.length > 0) {
      setSelectedDocumentObjects(fullDocuments as any[]);
    } else {
      setSelectedDocumentObjects([]);
    }
  }, [fullDocuments, selectedDocumentIds, setSelectedDocumentObjects]);

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
        <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[700px] bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-800/40 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">
          {/* Tron-inspired header */}
          <div className="relative border-b backdrop-blur-md border-cyan-500/30 bg-gradient-to-r from-slate-800/40 via-slate-700/60 to-slate-800/40">
            {/* Animated accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

            {/* Top navigation bar */}
            <div className="flex gap-2 items-center p-3 mt-16 sm:p-4 md:p-6 sm:gap-3 sm:mt-0">
              {/* Fixed left button */}
              <div className="flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BackgroundGradient color="cyan" containerClassName="p-0" tronMode={true} intensity="subtle">
                      <button
                        onClick={navigateToSelection}
                        className="relative p-2.5 sm:p-3 text-cyan-300 rounded-2xl border backdrop-blur-md transition-all duration-300 group hover:text-cyan-100 bg-slate-800/30 border-cyan-500/20 hover:border-cyan-400/40 hover:bg-slate-700/40"
                      >
                        {renderIcon(ArrowLeft, { className: "w-4 h-4 sm:w-5 sm:h-5" })}
                      </button>
                    </BackgroundGradient>
                  </TooltipTrigger>
                  <TooltipContent className="border backdrop-blur-md bg-slate-900/90 border-cyan-500/30">
                    Back to Selection
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Flexible center accordion - constrained width */}
              <div className="flex-1 min-w-0 max-w-[calc(100%-120px)] sm:max-w-[calc(100%-140px)]">
                <Accordion
                  expandedValue={accordionOpen ? "context" : null}
                  onValueChange={(value) => setAccordionOpen(value === "context")}
                >
                  <AccordionItem value="context" className="border-none">
                    <AccordionTrigger className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:no-underline bg-slate-800/20 border-cyan-500/20 hover:border-cyan-400/40 hover:bg-slate-700/30 w-full">
                      <div className="flex flex-1 gap-2 items-center min-w-0 sm:gap-3">
                        <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 rounded-xl sm:w-7 sm:h-7">
                          {renderIcon(TextSearch, { className: "w-3 h-3 sm:w-5 sm:h-5 text-white" })}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h2 className="text-xs font-bold text-cyan-100 truncate sm:text-sm">
                            {selectedDocuments.length === 1 && selectedDocuments[0]?.title ? (
                              `Chatting with: ${selectedDocuments[0].title}`
                            ) : selectedDocuments.length === 1 ? (
                              "Chatting with: Loading..."
                            ) : (
                              <div
                                className="overflow-hidden relative h-4 sm:h-5"
                                onMouseEnter={() => setIsCarouselPaused(true)}
                                onMouseLeave={() => setIsCarouselPaused(false)}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex min-w-0 cursor-help">
                                      <span className="flex-shrink-0 mr-1">Chatting with:</span>
                                      <div className="inline-block overflow-hidden relative flex-1 min-w-0">
                                        <AnimatePresence mode="wait">
                                          <motion.span
                                            key={carouselIndex}
                                            initial={{ y: 15, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -15, opacity: 0 }}
                                            transition={{ duration: 0.4 }}
                                            className="inline-block text-xs truncate sm:text-sm"
                                          >
                                            {selectedDocuments[carouselIndex >= 0 && carouselIndex < selectedDocuments.length ? carouselIndex : 0]?.title || "Loading..."}
                                          </motion.span>
                                        </AnimatePresence>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[90vw] sm:max-w-md border backdrop-blur-md bg-slate-900/90 border-cyan-500/30">
                                    <div className="py-1">
                                      <div className="mb-1 text-sm font-medium">All documents:</div>
                                      <ul className="pl-4 space-y-1 text-xs list-disc">
                                        {selectedDocuments.map((doc, idx) => (
                                          <li key={doc._id} className={idx === carouselIndex ? "text-cyan-300" : ""}>
                                            {doc?.title || "Loading..."}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </h2>
                          <p className="text-[10px] sm:text-xs text-cyan-300/70 truncate">
                            {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} loaded
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-1 sm:pt-3 sm:pb-2">
                      <div className="space-y-2 max-w-full">
                        {selectedDocuments.map((doc) => (
                          <div key={doc._id} className="flex gap-2 items-center p-2 min-w-0 rounded-xl border backdrop-blur-md bg-slate-800/20 border-cyan-500/10 hover:bg-slate-700/30 transition-all duration-200">
                            <div className="flex-shrink-0 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-xs font-medium text-cyan-200 truncate sm:text-sm">
                                {doc?.title || "Loading..."}
                              </span>
                              <span className="text-[10px] sm:text-xs text-cyan-300/70 truncate">
                                {doc.contentType} • {doc.wordCount.toLocaleString()} words
                              </span>
                            </div>
                            <div
                              className="flex-shrink-0 p-1.5 text-cyan-400 rounded-lg border border-cyan-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-cyan-300 transition-all duration-200 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDocumentViewer(doc._id);
                              }}
                              title="View document"
                            >
                              {renderIcon(Eye, { className: "w-3 h-3" })}
                            </div>
                          </div>
                        ))}

                        {/* Status indicator - moved inside accordion */}
                        <div className="pt-2 border-t border-cyan-500/20">
                          <div className="flex gap-1.5 sm:gap-2 justify-center items-center px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-emerald-400 rounded-full border backdrop-blur-md bg-gradient-to-r from-slate-800/20 via-slate-700/30 to-slate-800/20 border-emerald-500/20 overflow-hidden">
                            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></div>
                            <div className="overflow-hidden flex-1 min-w-0">
                              {/* Mobile: Smooth scrolling carousel effect with Framer Motion */}
                              <div className="relative sm:hidden">
                                <motion.div
                                  className="whitespace-nowrap"
                                  initial={{ x: 0 }}
                                  animate={{
                                    x: [0, 0, -200, -200, 0] // Stay, wait, scroll left, stay, return
                                  }}
                                  transition={{
                                    duration: 12, // Total cycle duration
                                    times: [0, 0.2, 0.7, 0.9, 1], // Timing for each keyframe
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    repeatDelay: 1 // Pause between cycles
                                  }}
                                >
                                  <span className="font-medium">
                                    Powered by {process.env.NEXT_PUBLIC_VECTOR_CONVERT_MODEL || "all-MiniLM-L6-v2"} embeddings + {process.env.NEXT_PUBLIC_LLM_MODEL || "Meta Llama 3.2"} LLM
                                  </span>
                                </motion.div>
                              </div>
                              {/* Desktop: Normal truncated text */}
                              <div className="hidden sm:block">
                                <span className="font-medium truncate">
                                  Powered by {process.env.NEXT_PUBLIC_VECTOR_CONVERT_MODEL || "all-MiniLM-L6-v2"} embeddings + {process.env.NEXT_PUBLIC_LLM_MODEL || "Meta Llama 3.2"} LLM
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Fixed right button */}
              <div className="flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BackgroundGradient color="purple" containerClassName="p-0" tronMode={true} intensity="subtle">
                      <button
                        onClick={navigateToHistory}
                        className="relative p-2.5 sm:p-3 text-purple-300 rounded-2xl border backdrop-blur-md transition-all duration-300 group hover:text-purple-100 bg-slate-800/30 border-purple-500/20 hover:border-purple-400/40 hover:bg-slate-700/40"
                      >
                        {renderIcon(History, { className: "w-4 h-4 sm:w-5 sm:h-5" })}
                      </button>
                    </BackgroundGradient>
                  </TooltipTrigger>
                  <TooltipContent className="border backdrop-blur-md bg-slate-900/90 border-purple-500/30">
                    History
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>


          </div>

          {/* Messages */}
          <div className="overflow-y-auto flex-1 p-3 space-y-4 sm:p-4 md:p-6 sm:space-y-5 md:space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <div className="relative mb-8">
                    <div className="flex justify-center items-center w-24 h-24">
                      <AnimatedBotIcon className="w-10 h-10 text-cyan-400" />
                    </div>

                  <div className="flex absolute z-10 justify-center items-center w-8 h-8 rounded-full orbit-animation">
                    <AnimatedFileSearchIcon className="w-6 h-6" />
                  </div>
                  
                  <style jsx>{`
                    @keyframes orbit {
                      0% { transform: translate(-50%, -50%) rotate(0deg) translateX(30px) rotate(0deg); }
                      100% { transform: translate(-50%, -50%) rotate(360deg) translateX(30px) rotate(-360deg); }
                    }
                    .orbit-animation {
                      position: absolute;
                      top: 50%;
                      left: 50%;
                      transform-origin: center;
                      animation: orbit 8s infinite linear;
                    }
                  `}</style>
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
                  containerClassName={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] ${message.type === "user" ? "ml-auto" : "mr-auto"}`}
                  tronMode={true}
                  intensity="subtle"
                >
                  <div
                    className={`${message.type === "user"
                      ? "bg-slate-800/40 text-cyan-100 rounded-3xl rounded-br-lg border border-cyan-500/20"
                      : "bg-slate-800/40 text-slate-100 rounded-3xl rounded-bl-lg border border-purple-500/20"
                      } p-3 sm:p-4 md:p-5 backdrop-blur-md shadow-lg`}
                  >
                    <div className="flex gap-2 items-start sm:gap-3">
                      {message.type === "assistant" && (
                        <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl border sm:w-7 sm:h-7 md:w-8 md:h-8 border-purple-400/30">
                          {renderIcon(Bot, { className: "w-3 h-3 sm:w-4 sm:h-4 text-white" })}
                        </div>
                      )}
                      {message.type === "user" && (
                        <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl border sm:w-7 sm:h-7 md:w-8 md:h-8 border-cyan-400/30">
                          {renderIcon(User, { className: "w-3 h-3 sm:w-4 sm:h-4 text-white" })}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap sm:text-base md:text-lg">{message.content}</p>

                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-2 space-y-2 sm:mt-4 sm:space-y-3">
                            <div className="flex gap-1 items-center sm:gap-2">
                              <div className="w-4 sm:w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"></div>
                              <p className="text-xs font-semibold tracking-wide text-cyan-300 uppercase">
                                Sources
                              </p>
                            </div>
                            {message.sources.map((source, index) => (
                              <div key={index} className="w-full">
                                <div className="p-3 rounded-xl border backdrop-blur-sm transition-all duration-200 sm:p-4 bg-gradient-to-br from-slate-800/40 via-slate-700/50 to-slate-800/40 border-slate-600/40 hover:border-slate-500/60 hover:from-slate-700/50 hover:via-slate-600/60 hover:to-slate-700/50">
                                  <div className="flex flex-col mb-2 sm:flex-row sm:justify-between sm:items-center">
                                    <span className="text-sm font-medium text-cyan-300">
                                      {source?.title || "Unknown Source"}
                                    </span>
                                    <span className="mt-1 sm:mt-0 px-2 py-0.5 sm:py-1 text-xs rounded-md border text-slate-400 bg-gradient-to-r from-slate-700/60 to-slate-600/80 border-slate-600/50 inline-block w-fit backdrop-blur-sm">
                                      {(source.score * 100).toFixed(1)}% match
                                    </span>
                                  </div>
                                  <p className="text-xs leading-relaxed sm:text-sm text-slate-300">
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
          <div className="p-3 border-t backdrop-blur-md sm:p-4 md:p-6 border-cyan-500/30 bg-gradient-to-r from-slate-800/40 via-slate-700/60 to-slate-800/40">
            <div className="flex gap-2 items-end sm:gap-3 md:gap-4">
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
                    className="px-3 py-3 pr-12 w-full text-sm text-cyan-100 rounded-2xl border shadow-sm backdrop-blur-md transition-all duration-300 resize-none sm:px-4 md:px-5 sm:py-4 sm:pr-16 placeholder-cyan-400/60 bg-slate-800/30 border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 focus:bg-slate-700/40 sm:text-base"
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
                  className={`group relative p-3 sm:p-4 rounded-2xl transition-all duration-300 ${!inputMessage.trim() || isLoading
                    ? "bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-600/30"
                    : "bg-slate-800/30 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40 hover:scale-105 shadow-lg hover:shadow-cyan-500/20 hover:bg-slate-700/40"
                    } backdrop-blur-md`}
                >
                  {renderIcon(Send, { className: "w-4 h-4 sm:w-5 sm:h-5" })}
                </button>
              </BackgroundGradient>
            </div>

            {/* Status and shortcuts */}
            <div className="flex justify-between items-center mt-4 text-xs text-cyan-400/70">
              <div className="flex gap-2 items-center px-3 py-1.5 rounded-full bg-slate-800/20 border border-emerald-500/10 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>Ready to answer</span>
              </div>
              <div className="hidden sm:block px-3 py-1.5 rounded-full bg-slate-800/20 border border-cyan-500/10 backdrop-blur-sm">
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </div>
        </div>
      </BackgroundGradient>


      {/* Document Viewer Modal */}
      <div className="w-full md:w-auto">
        <DocumentViewer
          documentId={selectedDocumentId}
          isOpen={isDocumentViewerOpen}
          onClose={handleCloseDocumentViewer}
          small={isMobile}
        />
      </div>
    </>
  );
}
