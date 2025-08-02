'use client';

import {
  Bot,
  Send,
  User,
  Plus,
  FileText,
  X,
  History,
  Eye,
} from 'lucide-react';
import { useGeneralChat } from '../../hooks/use-general-chat';
import { useAIChat } from '../../hooks/use-ai-chat';
import { useConversationLoader } from '../../hooks/use-conversation-loader';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { renderIcon } from '../../lib/icon-utils';
import { AnimatedBotIcon } from '../ui/icons/AnimatedBotIcon';
import { AISDKProgressLoader } from '../ui/loading/ai_sdk_ProgressLoader';
import { BackgroundGradient } from '../ui/backgrounds/background-gradient';
import { useLLMProgress } from '../../hooks/useLLMProgress';
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle } from '../ui/responsive-modal';
import { DocumentSelector } from '../rag/chat/DocumentSelector';
import { UnifiedChatHistory } from './UnifiedChatHistory';
import { DocumentViewer } from '../rag/DocumentViewer';
import { useQuery, useMutation } from 'convex/react';
import type { GenericId as Id } from 'convex/values';
import { api } from '../../generated-convex';
import { useSafeQuery } from '../../hooks/use-safe-convex';
import type { Document } from '../../app/RAG-chat/types';
import type { ChatMessage } from '../../stores/unifiedChatStore';
import { 
  useChatMode, 
  useSelectedDocuments, 
  useGeneralMessages, 
  useRagMessages, 
  useCurrentConversationId, 
  useSetChatMode,
  useSetSelectedDocuments,
  useClearDocuments,
  useSetGeneralMessages,
  useSetRagMessages,
  useStartNewConversation,
  useSetCurrentConversation,
} from '../../stores/unifiedChatStore';

// Define the type for the message in our component
interface Message extends ChatMessage {
  // Ensure all required properties are explicitly defined
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: Array<{
    documentId: string;
    title: string;
    snippet: string;
    score: number;
  }>;
  metadata?: Record<string, any>;
}

interface UnifiedChatInterfaceProps {
  // Optional props for customization
  initialConversation?: { conversation: any; type: 'general' | 'rag' } | null;
  onDocumentCountChange?: (count: number) => void;
  onMessageCountChange?: (hasMessages: boolean) => void;
}

export const UnifiedChatInterface = React.memo(function UnifiedChatInterface({ 
  initialConversation, 
  onDocumentCountChange, 
  onMessageCountChange 
}: UnifiedChatInterfaceProps = {}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loadedConversation, setLoadedConversation] = useState<{ conversation: any; type: 'general' | 'rag' } | null>(initialConversation || null);
  
  // Document viewer state
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);

  // Use optimized selectors to prevent unnecessary re-renders
  const chatMode = useChatMode();
  const selectedDocuments = useSelectedDocuments();
  const generalMessages = useGeneralMessages();
  const ragMessages = useRagMessages();
  const currentConversationId = useCurrentConversationId();
  
  const setChatMode = useSetChatMode();
  const setSelectedDocuments = useSetSelectedDocuments();
  const clearDocuments = useClearDocuments();
  const setGeneralMessages = useSetGeneralMessages();
  const setRagMessages = useSetRagMessages();
  const startNewConversation = useStartNewConversation();
  const setCurrentConversation = useSetCurrentConversation();

  // Enhanced progress tracking
  const llmProgress = useLLMProgress();

  // Load conversation messages if we have a loaded conversation
  const conversationLoader = useConversationLoader(
    loadedConversation?.conversation._id || null,
    loadedConversation?.type || null
  );

  // Fetch documents for the modal
  const {
    data: documents,
    error: documentsError,
    isLoading: documentsLoading,
    retry: refetchDocuments,
  } = useSafeQuery(api.documents.getAllDocuments, { limit: 50 });

  // Use general chat hook for general mode
  const generalChat = useGeneralChat({
    api: '/api/general-chat',
    onError: (err) => {
      console.error('General chat error:', err);
      toast.error(err.message || 'An error occurred');
      llmProgress.setError(err.message || 'Unknown error');
    },
  });

  // Use AI chat hook for RAG mode
  const ragChat = useAIChat({
    api: '/api/ai-chat',
    body: {
      documentIds: selectedDocuments.map(doc => doc._id),
    },
    onError: (err) => {
      console.error('RAG chat error:', err);
      toast.error(err.message || 'An error occurred');
      llmProgress.setError(err.message || 'Unknown error');
    },
  });

  // Choose which chat to use based on mode - memoized
  const currentChat = useMemo(() => 
    chatMode === 'general' ? generalChat : ragChat, 
    [chatMode, generalChat, ragChat]
  );

  // Sync store messages with chat hooks - memoized dependencies
  const generalMessagesRef = useRef(generalMessages);
  const ragMessagesRef = useRef(ragMessages);
  
  useEffect(() => {
    generalMessagesRef.current = generalMessages;
  }, [generalMessages]);
  
  useEffect(() => {
    ragMessagesRef.current = ragMessages;
  }, [ragMessages]);
  
  useEffect(() => {
    if (chatMode === 'general') {
      generalChat.setMessages(generalMessagesRef.current);
    } else {
      ragChat.setMessages(ragMessagesRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMode]);

  // Sync hook messages back to store when they change - optimized with refs
  const generalChatMessagesRef = useRef(generalChat.messages);
  const ragChatMessagesRef = useRef(ragChat.messages);
  const generalMessagesLengthRef = useRef(generalMessages.length);
  const ragMessagesLengthRef = useRef(ragMessages.length);
  
  // Update refs when messages change
  useEffect(() => {
    generalChatMessagesRef.current = generalChat.messages;
  }, [generalChat.messages]);
  
  useEffect(() => {
    ragChatMessagesRef.current = ragChat.messages;
  }, [ragChat.messages]);
  
  // Update length refs to prevent infinite loops
  useEffect(() => {
    generalMessagesLengthRef.current = generalMessages.length;
  }, [generalMessages.length]);
  
  useEffect(() => {
    ragMessagesLengthRef.current = ragMessages.length;
  }, [ragMessages.length]);
  
  // Sync general chat messages to store
  useEffect(() => {
    if (chatMode === 'general' && 
        generalChatMessagesRef.current.length !== generalMessagesLengthRef.current) {
      const formattedMessages = generalChatMessagesRef.current
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => {
          // Explicitly cast to any to avoid TypeScript errors with optional properties
          const msgAny = msg as any;
          const message: Message = {
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msgAny.timestamp || Date.now(),
            sources: msgAny.sources || [],
            metadata: msgAny.metadata || {}
          };
          return message;
        });
      setGeneralMessages(formattedMessages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMode, generalChat.messages.length]);

  // Sync RAG chat messages to store
  useEffect(() => {
    if (chatMode === 'rag' && 
        ragChatMessagesRef.current.length !== ragMessagesLengthRef.current) {
      const formattedMessages = ragChatMessagesRef.current
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => {
          // Explicitly cast to any to avoid TypeScript errors with optional properties
          const msgAny = msg as any;
          const message: Message = {
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msgAny.timestamp || Date.now(),
            sources: msgAny.sources || [],
            metadata: msgAny.metadata || {}
          };
          return message;
        });
      setRagMessages(formattedMessages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMode, ragChat.messages.length]);

  // Load conversation messages when a conversation is selected
  useEffect(() => {
    if (conversationLoader.messages && loadedConversation) {
      const formattedMessages = conversationLoader.messages
        .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg: any): Message => ({
          id: msg.messageId,
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content,
          timestamp: msg.timestamp || Date.now(),
          sources: msg.sources || [],
          metadata: msg.metadata || {}
        }));

      // Set messages in the store and update chat mode
      setChatMode(loadedConversation.type);
      if (loadedConversation.type === 'general') {
        setGeneralMessages(formattedMessages);
      } else {
        setRagMessages(formattedMessages);
        // If it's a RAG conversation, load the documents
        if (loadedConversation.conversation.documentIds && loadedConversation.conversation.documentTitles) {
          // Fetch the actual documents to get complete document objects
          const fetchDocuments = async () => {
            try {
              // Use the documents we already fetched if available
              if (documents) {
                const docMap = new Map(documents.map(doc => [doc._id, doc]));
                const docs = loadedConversation.conversation.documentIds.map((id: string, index: number) => {
                  // Use the document from our cache if available, otherwise create a placeholder
                  const doc = docMap.get(id) || {
                    _id: id,
                    title: loadedConversation.conversation.documentTitles[index] || 'Untitled Document',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    userId: '',
                    fileType: '',
                    fileSize: 0,
                    status: 'processed'
                  };
                  return doc;
                });
                setSelectedDocuments(docs);
              } else {
                // If documents aren't loaded yet, create placeholders
                const docs = loadedConversation.conversation.documentIds.map((id: string, index: number) => ({
                  _id: id,
                  title: loadedConversation.conversation.documentTitles[index] || 'Untitled Document',
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  userId: '',
                  fileType: '',
                  fileSize: 0,
                  status: 'processed'
                }));
                setSelectedDocuments(docs);
              }
            } catch (error) {
              console.error('Error loading documents for conversation:', error);
              toast.error('Failed to load documents for this conversation');
            }
          };
          
          fetchDocuments();
        }
      }
      setCurrentConversation(loadedConversation.conversation._id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationLoader.messages, loadedConversation?.conversation?._id, loadedConversation?.type, documents]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat.messages.length]);

  // Update progress tracking based on loading state
  useEffect(() => {
    if (currentChat.isLoading) {
      const cleanup = llmProgress.startProcessing(8); // Estimate 8 seconds
      return () => cleanup?.();
    } else {
      llmProgress.completeProcessing();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat.isLoading]);

  // Update message count for background animation - memoized
  const hasMessages = useMemo(() => currentChat.messages.length > 0, [currentChat.messages.length]);
  const documentCount = useMemo(() => {
    if (hasMessages && selectedDocuments.length === 0 && chatMode === 'general') {
      return 1;
    }
    return selectedDocuments.length;
  }, [hasMessages, selectedDocuments.length, chatMode]);
  
  useEffect(() => {
    onMessageCountChange?.(hasMessages);
    onDocumentCountChange?.(documentCount);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMessages, documentCount]);

  // Handle error state
  useEffect(() => {
    if (currentChat.error) {
      llmProgress.setError(currentChat.error.message || 'Unknown error');
      toast.error(currentChat.error.message || 'An error occurred');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat.error]);

  // Custom submit handler
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentChat.input.trim() || currentChat.isLoading) return;
    
    currentChat.handleSubmit(e);
  };
  
  // API mutation to update conversation type
  const updateConversationType = useMutation(api.conversations.index.updateConversationType);

  // Handle adding documents to an existing conversation
  const handleAddDocumentsToConversation = useCallback((documents: Document[]) => {
    // Only proceed if we have documents to add
    if (documents.length === 0) return;
    
    // If we're in general mode with existing messages, we need to transition to RAG mode
    if (chatMode === 'general' && generalMessages.length > 0) {
      // First set the documents which will change the mode to RAG
      setSelectedDocuments(documents);
      
      // If we have a current conversation ID, we need to update it in the database
      // to reflect the added documents
      if (currentConversationId) {
        console.log('Updating conversation type to RAG and adding documents');
        // Now using the proper conversations.updateConversationType function
        // which updates both the type and adds the documents
        // Cast the string ID to the expected Convex ID type
        updateConversationType({
          conversationId: currentConversationId as unknown as Id<"unified_conversations">,
          newType: "rag",
          documentIds: documents.map(doc => doc._id as unknown as Id<"rag_documents">),
          documentTitles: documents.map(doc => doc.title)
        }).catch(error => {
          console.error('Failed to update conversation type:', error);
          toast.error('Failed to update conversation: ' + error.message);
        });
      }
    } else {
      // Standard document selection
      setSelectedDocuments(documents);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMode, generalMessages.length, currentConversationId, updateConversationType]);

  // Handle document selection - memoized
  const handleDocumentSelect = useCallback((docs: Document[]) => {
    setSelectedDocuments(docs);
    // Update parent component about document count change
    onDocumentCountChange?.(docs.length);
    
    // Show toast when documents change and start new conversation
    if (docs.length > 0) {
      toast.success(`Started new RAG chat with ${docs.length} document${docs.length > 1 ? 's' : ''}`);
    } else {
      toast.info('Switched to general chat mode');
    }
  }, [setSelectedDocuments, onDocumentCountChange]);

  // Handle closing document modal - memoized
  const handleDocumentModalClose = useCallback(() => {
    setIsDocumentModalOpen(false);
  }, []);

  // Handle removing documents - memoized
  const handleRemoveDocuments = useCallback(() => {
    clearDocuments();
    onDocumentCountChange?.(0);
  }, [clearDocuments, onDocumentCountChange]);

  // Handle conversation selection from history - memoized
  const handleConversationSelect = useCallback((conversation: any, type: 'general' | 'rag') => {
    console.log('Selected conversation:', conversation, 'type:', type);
    // Set the loaded conversation which will trigger the useEffect to load messages
    setLoadedConversation({ conversation, type });
    setIsHistoryModalOpen(false);
    
    // Set the current conversation ID in the store
    setCurrentConversation(conversation._id);
    
    // Set the chat mode based on the conversation type
    setChatMode(type);
    
    // If it's a RAG conversation, set the document count and load documents
    if (type === 'rag' && conversation.documentIds) {
      onDocumentCountChange?.(conversation.documentIds.length);
      
      // Create Document objects from the IDs and titles
      if (conversation.documentIds && conversation.documentTitles) {
        const docs = conversation.documentIds.map((id: string, index: number) => ({
          _id: id,
          title: conversation.documentTitles[index] || 'Untitled Document',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          userId: '',
          fileType: '',
          fileSize: 0,
          status: 'processed'
        }));
        setSelectedDocuments(docs);
      }
    } else {
      // For general chat, clear documents
      clearDocuments();
      onDocumentCountChange?.(0);
    }
  }, [onDocumentCountChange, setCurrentConversation, setChatMode, setSelectedDocuments, clearDocuments]);

  // Handle document click to open viewer - memoized
  const handleDocumentClick = useCallback((documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsDocumentViewerOpen(true);
  }, []);

  // Handle document viewer close - memoized
  const handleDocumentViewerClose = useCallback(() => {
    setIsDocumentViewerOpen(false);
    setSelectedDocumentId(null);
  }, []);

  // Get appropriate steps for progress loader - memoized
  const getProgressSteps = useCallback(() => {
    if (chatMode === 'general') {
      return ["Processing query", "Connecting to LLM", "Generating response", "Finalizing"];
    } else {
      return ["Analyzing documents", "Connecting to LLM", "Generating response", "Finalizing"];
    }
  }, [chatMode]);

  return (
    <>
      <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="normal">
        <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[700px] bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-800/40 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r border-b backdrop-blur-md border-cyan-500/30 from-slate-800/40 via-slate-700/60 to-slate-800/40">
            {/* Animated accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

            {/* Header content */}
            <div className="flex gap-2 justify-between items-center p-3 mt-16 sm:p-4 md:p-6 sm:gap-3 sm:mt-0">
              <div className="flex gap-2 items-center sm:gap-3">
                <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 rounded-xl sm:w-7 sm:h-7">
                  {renderIcon(Bot, { className: "w-3 h-3 sm:w-5 sm:h-5 text-cyan-400" })}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xs font-bold text-cyan-100 truncate sm:text-sm">
                    {chatMode === 'general' ? 'General AI Chat' : `RAG Chat (${selectedDocuments.length} documents)`}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-cyan-300/70 truncate">
                    {chatMode === 'general' ? 'Ask me anything!' : 'Chatting with your documents'}
                  </p>
                </div>
              </div>

              {/* Document controls */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="p-2 text-purple-400 rounded-lg border transition-all duration-200 border-purple-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-purple-300"
                  title="Chat History"
                >
                  {renderIcon(History, { className: "w-4 h-4" })}
                </button>

                <button
                  onClick={() => {
                    startNewConversation();
                    toast.info('Started new conversation');
                  }}
                  className="p-2 text-green-400 rounded-lg border transition-all duration-200 border-green-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-green-300"
                  title="Start new conversation"
                >
                  {renderIcon(Plus, { className: "w-4 h-4" })}
                </button>

                {chatMode === 'rag' && selectedDocuments.length > 0 && (
                  <button
                    onClick={handleRemoveDocuments}
                    className="p-2 text-red-400 rounded-lg border transition-all duration-200 border-red-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-red-300"
                    title="Remove documents"
                  >
                    {renderIcon(X, { className: "w-4 h-4" })}
                  </button>
                )}
                
                <button
                  onClick={() => setIsDocumentModalOpen(true)}
                  className="flex gap-2 items-center p-2 text-cyan-400 rounded-lg border transition-all duration-200 border-cyan-500/20 bg-slate-700/50 hover:bg-slate-600/50 hover:text-cyan-300"
                  title="Add documents"
                >
                  {renderIcon(FileText, { className: "w-4 h-4" })}
                  <span className="hidden text-sm sm:inline">Documents</span>
                </button>
              </div>
            </div>

            {/* Selected documents display */}
            {selectedDocuments.length > 0 && (
              <div className="px-3 pb-3 sm:px-4 md:px-6 sm:pb-4">
                <div className="flex flex-wrap gap-2">
                  {selectedDocuments.map((doc, index) => (
                    <div 
                      key={`doc-${doc._id}-${index}`} 
                      className="flex gap-2 items-center px-3 py-1 rounded-lg border transition-all duration-200 cursor-pointer bg-slate-700/50 border-cyan-500/20 hover:bg-slate-600/50"
                      onClick={() => handleDocumentClick(doc._id)}
                      title="Click to view document"
                    >
                      {renderIcon(FileText, { className: "w-3 h-3 text-cyan-400" })}
                      <span className="text-xs text-cyan-200 truncate max-w-[150px]">
                        {doc.title}
                      </span>
                      {renderIcon(Eye, { className: "w-3 h-3 text-cyan-400/60" })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="overflow-y-auto flex-1 p-3 space-y-4 sm:p-4 md:p-6 sm:space-y-5 md:space-y-6">
            {currentChat.messages.length === 0 && (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <div className="relative mb-8">
                  <div className="flex justify-center items-center w-24 h-24">
                    <AnimatedBotIcon className="w-10 h-10 text-cyan-400" />
                  </div>

                  {/* Show orbiting document icons only when documents are selected */}
                  {selectedDocuments.length > 0 && (
                    <>
                      {selectedDocuments.slice(0, 3).map((doc, index) => (
                        <div 
                          key={`orbit-${doc._id}-${index}`}
                          className={`flex absolute z-10 justify-center items-center w-8 h-8 rounded-full orbit-animation-${index + 1}`}
                        >
                          <div className="flex justify-center items-center w-6 h-6 rounded-full border bg-cyan-400/20 border-cyan-400/40">
                            {renderIcon(FileText, { className: "w-4 h-4 text-cyan-400" })}
                          </div>
                        </div>
                      ))}
                      
                      <style jsx>{`
                        @keyframes orbit1 {
                          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(30px) rotate(0deg); }
                          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(30px) rotate(-360deg); }
                        }
                        @keyframes orbit2 {
                          0% { transform: translate(-50%, -50%) rotate(120deg) translateX(35px) rotate(-120deg); }
                          100% { transform: translate(-50%, -50%) rotate(480deg) translateX(35px) rotate(-480deg); }
                        }
                        @keyframes orbit3 {
                          0% { transform: translate(-50%, -50%) rotate(240deg) translateX(40px) rotate(-240deg); }
                          100% { transform: translate(-50%, -50%) rotate(600deg) translateX(40px) rotate(-600deg); }
                        }
                        .orbit-animation-1 {
                          position: absolute;
                          top: 50%;
                          left: 50%;
                          transform-origin: center;
                          animation: orbit1 8s infinite linear;
                        }
                        .orbit-animation-2 {
                          position: absolute;
                          top: 50%;
                          left: 50%;
                          transform-origin: center;
                          animation: orbit2 10s infinite linear;
                        }
                        .orbit-animation-3 {
                          position: absolute;
                          top: 50%;
                          left: 50%;
                          transform-origin: center;
                          animation: orbit3 12s infinite linear;
                        }
                      `}</style>
                    </>
                  )}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-cyan-100">
                  {chatMode === 'general' ? 'Ready to chat' : 'Ready to explore your documents'}
                </h3>
                <p className="max-w-md leading-relaxed text-cyan-200/70">
                  {chatMode === 'general' 
                    ? "I'm here to help with any questions or topics you'd like to discuss. What's on your mind?"
                    : "Ask me anything about your selected documents. I'll provide detailed answers with source references."
                  }
                </p>
              </div>
            )}

            {currentChat.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <BackgroundGradient
                  color={message.role === "user" ? "cyan" : "purple"}
                  containerClassName={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] ${message.role === "user" ? "ml-auto" : "mr-auto"}`}
                  tronMode={true}
                  intensity="subtle"
                >
                  <div
                    className={`${message.role === "user"
                      ? "bg-slate-800/40 text-cyan-100 rounded-3xl rounded-br-lg border border-cyan-500/20"
                      : "bg-slate-800/40 text-slate-100 rounded-3xl rounded-bl-lg border border-purple-500/20"
                      } p-3 sm:p-4 md:p-5 backdrop-blur-md shadow-lg`}
                  >
                    <div className="flex gap-2 items-start sm:gap-3">
                      {message.role === "assistant" && (
                        <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl border sm:w-7 sm:h-7 md:w-8 md:h-8 border-purple-400/30">
                          {renderIcon(Bot, { className: "w-3 h-3 sm:w-4 sm:h-4 text-white" })}
                        </div>
                      )}
                      {message.role === "user" && (
                        <div className="flex flex-shrink-0 justify-center items-center w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl border sm:w-7 sm:h-7 md:w-8 md:h-8 border-cyan-400/30">
                          {renderIcon(User, { className: "w-3 h-3 sm:w-4 sm:h-4 text-white" })}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap sm:text-base md:text-lg">{message.content}</p>
                        
                        {/* Show sources for RAG messages */}
                        {chatMode === 'rag' && message.sources && message.sources.length > 0 && (
                          <div className="mt-2 space-y-2 sm:mt-4 sm:space-y-3">
                            <div className="flex gap-1 items-center sm:gap-2">
                              <div className="w-4 sm:w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"></div>
                              <p className="text-xs font-semibold tracking-wide text-cyan-300 uppercase">
                                Sources
                              </p>
                            </div>
                            {message.sources.map((source: any, index: number) => (
                              <div key={index} className="w-full">
                                <div className="p-3 bg-gradient-to-br rounded-xl border backdrop-blur-sm transition-all duration-200 sm:p-4 from-slate-800/40 via-slate-700/50 to-slate-800/40 border-slate-600/40 hover:border-slate-500/60 hover:from-slate-700/50 hover:via-slate-600/60 hover:to-slate-700/50">
                                  <div className="flex flex-col mb-2 sm:flex-row sm:justify-between sm:items-center">
                                    <span className="text-sm font-medium text-cyan-300">
                                      {source?.title || "Unknown Source"}
                                    </span>
                                    <span className="mt-1 sm:mt-0 px-2 py-0.5 sm:py-1 text-xs rounded-md border text-slate-400 bg-gradient-to-r from-slate-700/60 to-slate-600/80 border-slate-600/50 inline-block w-fit backdrop-blur-sm">
                                      {((source.score || 0) * 100).toFixed(1)}% match
                                    </span>
                                  </div>
                                  <p className="text-xs leading-relaxed sm:text-sm text-slate-300">
                                    {source.snippet || ''}
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
            {currentChat.isLoading && (
              <div className="flex justify-start">
                <AISDKProgressLoader
                  isVisible={llmProgress.isProcessing}
                  message={llmProgress.message}
                  steps={getProgressSteps()}
                  currentStep={llmProgress.currentStep}
                  progress={llmProgress.progress}
                  estimatedTime={llmProgress.estimatedTime}
                  chatMode={chatMode}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-gradient-to-r border-t backdrop-blur-md sm:p-4 md:p-6 border-cyan-500/30 from-slate-800/40 via-slate-700/60 to-slate-800/40">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-end sm:gap-3 md:gap-4">
              <div className="relative flex-1">
                <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="subtle">
                  <textarea
                    value={currentChat.input}
                    onChange={currentChat.handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                    placeholder={chatMode === 'general' ? "Ask me anything..." : "Ask me anything about your documents..."}
                    className="px-3 py-3 pr-12 w-full text-sm text-cyan-100 rounded-2xl border shadow-sm backdrop-blur-md transition-all duration-300 resize-none sm:px-4 md:px-5 sm:py-4 sm:pr-16 placeholder-cyan-400/60 bg-slate-800/30 border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 focus:bg-slate-700/40 sm:text-base"
                    rows={2}
                    disabled={currentChat.isLoading}
                  />
                </BackgroundGradient>
                {/* Character count */}
                <div className="absolute bottom-3 right-4 text-xs text-cyan-400/70">
                  {currentChat.input.length > 0 && (
                    <span className={currentChat.input.length > 500 ? "text-orange-400" : ""}>
                      {currentChat.input.length}
                    </span>
                  )}
                </div>
              </div>

              <BackgroundGradient color={!currentChat.input.trim() || currentChat.isLoading ? "white" : "cyan"} tronMode={true} intensity="subtle">
                <button
                  type="submit"
                  disabled={!currentChat.input.trim() || currentChat.isLoading}
                  className={`group relative p-3 sm:p-4 rounded-2xl transition-all duration-300 ${!currentChat.input.trim() || currentChat.isLoading
                    ? "bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-600/30"
                    : "bg-slate-800/30 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40 hover:scale-105 shadow-lg hover:shadow-cyan-500/20 hover:bg-slate-700/40"
                    } backdrop-blur-md`}
                >
                  {renderIcon(Send, { className: "w-4 h-4 sm:w-5 sm:h-5" })}
                </button>
              </BackgroundGradient>
            </form>

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

      {/* Document Selection Modal */}
      <ResponsiveModal open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
        <ResponsiveModalContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Select Documents for RAG Chat</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          
          <div className="mt-4">
            {documents && (
              <DocumentSelector
                documents={documents.page || []}
                onSelectionChange={handleAddDocumentsToConversation}
                selectedDocuments={selectedDocuments}
                showActionButtons={false}
                onDone={handleDocumentModalClose}
                onUploadSuccess={() => {
                  // Refresh the documents list after successful upload
                  refetchDocuments();
                }}
              />
            )}
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Chat History Modal */}
      <ResponsiveModal open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <ResponsiveModalContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Chat History</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          
          <div className="mt-4">
            <UnifiedChatHistory onConversationSelect={handleConversationSelect} />
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Document Viewer Modal */}
      {selectedDocumentId && (
        <DocumentViewer
          documentId={selectedDocumentId as any}
          isOpen={isDocumentViewerOpen}
          onClose={handleDocumentViewerClose}
        />
      )}
    </>
  );
});

UnifiedChatInterface.displayName = 'UnifiedChatInterface';