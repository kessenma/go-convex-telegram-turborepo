'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import type { GenericId as Id } from 'convex/values';
import { api } from '../../generated-convex';
import { useSafeQuery } from '../../hooks/use-safe-convex';

// Hooks
import { useGeneralChat } from '../../hooks/use-general-chat';
import { useAIChat } from '../../hooks/use-ai-chat';
import { useUnifiedChatPersistence } from '../../hooks/useUnifiedChatPersistence';
import { useLLMProgress } from '../../hooks/useLLMProgress';
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
  useUnifiedChatStore,
} from '../../stores/unifiedChatStore';

// UI Components
import { BackgroundGradient } from '../ui/backgrounds/background-gradient';
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle } from '../ui/responsive-modal';
import { DocumentSelector } from '../rag/chat/DocumentSelector';
import { UnifiedChatHistory } from './UnifiedChatHistory';
import { DocumentViewer } from '../rag/DocumentViewer';

// Extracted Components
import {
  ChatHeader,
  ChatMessageList,
  ChatInputForm
} from './unified-chat-interface';

// Types
import type { Document } from '../../types/rag';
import type { ChatMessage } from '../../stores/unifiedChatStore';

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
  // State
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loadedConversation, setLoadedConversation] = useState<{ conversation: any; type: 'general' | 'rag' } | null>(initialConversation || null);

  // Title generation state
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [titleGenerationProgress, setTitleGenerationProgress] = useState(0);

  // Document viewer state
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);

  // Model selection state
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.2-1b');

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

  // Chat persistence hook
  const chatPersistence = useUnifiedChatPersistence({
    onConversationCreated: (conversationId) => {
      console.log('🎯 Conversation created:', conversationId);
      setCurrentConversation(conversationId);
      console.log('🎯 Set current conversation to:', conversationId);
    },
    onMessageSaved: (messageId) => {
      console.log('Message saved:', messageId);
    },
    onError: (error) => {
      console.error('Persistence error:', error);
      toast.error('Failed to save conversation: ' + error.message);
    }
  });

  // Fetch documents for the modal
  const {
    data: documents,
    error: documentsError,
    isLoading: documentsLoading,
    retry: refetchDocuments,
  } = useSafeQuery(api.documents.getAllDocuments, { limit: 50 });

  // API mutation to update conversation type
  const updateConversationType = useMutation(api.conversations.index.updateConversationType);

  // Use general chat hook for general mode
  const generalChat = useGeneralChat({
    api: '/api/general-chat',
    onError: (err) => {
      console.error('General chat error:', err);
      toast.error(err.message || 'An error occurred');
      llmProgress.setError(err.message || 'Unknown error');
    },
    onFinish: (message) => {
      console.log('🎯 General chat response:', message);
      console.log('🎯 Message has generated_title:', !!message.generated_title);
      console.log('🎯 Current conversation ID in onFinish:', currentConversationId);

      // Handle title generation from the response (backup in case onTitleGenerated doesn't fire)
      if (message.generated_title) {
        console.log('🎯 Title generated from general chat response:', message.generated_title);
        
        // Try to get the conversation ID from the persistence hook as a fallback
        const persistenceConversationId = chatPersistence.getCurrentConversationId();
        console.log('🎯 Persistence conversation ID in onFinish:', persistenceConversationId);
        
        const conversationIdToUse = currentConversationId || persistenceConversationId;
        
        if (conversationIdToUse) {
          setConversationTitle(message.generated_title);
          setIsGeneratingTitle(false);
          setTitleGenerationProgress(100);

          // Save the title to the database via our API
          saveConversationTitle(conversationIdToUse, message.generated_title);
        } else {
          console.warn('🎯 Title generated but no conversation ID available in onFinish');
        }
      }

      // Save the assistant message to database
      const persistenceConversationId = chatPersistence.getCurrentConversationId();
      const conversationIdToUse = currentConversationId || persistenceConversationId;
      
      if (conversationIdToUse) {
        const messageWithTimestamp: ChatMessage = {
          id: message.id,
          role: 'assistant',
          content: message.content,
          timestamp: message.timestamp || Date.now(),
          sources: message.sources || [],
          metadata: message.generated_title ? { generated_title: message.generated_title } : (message.metadata || {})
        };
        
        chatPersistence.saveMessage({ 
          message: messageWithTimestamp, 
          chatMode: 'general', 
          conversationId: conversationIdToUse 
        }).catch(error => {
          console.error('Failed to save general assistant message:', error);
        });
      }
    },
    onMessageSent: (message) => {
      // Save user message to database
      const persistenceConversationId = chatPersistence.getCurrentConversationId();
      const conversationIdToUse = currentConversationId || persistenceConversationId;
      
      if (conversationIdToUse) {
        const messageWithTimestamp: ChatMessage = {
          id: message.id,
          role: 'user',
          content: message.content,
          timestamp: message.timestamp || Date.now(),
          sources: message.sources || [],
          metadata: message.metadata || {}
        };
        
        chatPersistence.saveMessage({ 
          message: messageWithTimestamp, 
          chatMode: 'general', 
          conversationId: conversationIdToUse 
        }).catch(error => {
          console.error('Failed to save general user message:', error);
        });
      }
    },
    onMessageReceived: (message) => {
      // This callback is handled in onFinish to avoid duplicate saves
      console.log('General message received:', message.id);
    },
    onTitleGenerated: (title) => {
      console.log('🎯 Title generated in generalChat onTitleGenerated:', title);
      console.log('🎯 Current conversation ID in onTitleGenerated:', currentConversationId);
      
      // Try to get the conversation ID from the persistence hook as a fallback
      const persistenceConversationId = chatPersistence.getCurrentConversationId();
      console.log('🎯 Persistence conversation ID:', persistenceConversationId);
      
      setConversationTitle(title);
      setIsGeneratingTitle(false);
      setTitleGenerationProgress(100);

      // Save the title to the database via our API
      const conversationIdToUse = currentConversationId || persistenceConversationId;
      if (conversationIdToUse) {
        console.log('🎯 Calling saveConversationTitle with:', { conversationIdToUse, title });
        saveConversationTitle(conversationIdToUse, title);
      } else {
        console.warn('🎯 No conversation ID available when trying to save title in onTitleGenerated');
      }
    },
  });

  // Use AI chat hook for RAG mode
  const ragChat = useAIChat({
    api: '/api/ai-chat',
    body: {
      documentIds: selectedDocuments.map(doc => doc._id),
      selectedModel,
    },
    onError: (err) => {
      console.error('RAG chat error:', err);
      toast.error(err.message || 'An error occurred');
      llmProgress.setError(err.message || 'Unknown error');
    },
    onFinish: (message) => {
      console.log('RAG chat response:', message);
      if (message.sources) {
        console.log('RAG sources found:', message.sources.length);
      } else {
        console.warn('No RAG sources in response');
      }

      // Handle title generation from the AI response
      if (message.generated_title) {
        console.log('Title generated from AI response:', message.generated_title);
        
        // Try to get the conversation ID from the persistence hook as a fallback
        const persistenceConversationId = chatPersistence.getCurrentConversationId();
        const conversationIdToUse = currentConversationId || persistenceConversationId;
        
        if (conversationIdToUse) {
          setConversationTitle(message.generated_title);
          setIsGeneratingTitle(false);
          setTitleGenerationProgress(100);

          // Save the title to the database via our API
          saveConversationTitle(conversationIdToUse, message.generated_title);
        }
      }

      // Save the assistant message to database
      const persistenceConversationId = chatPersistence.getCurrentConversationId();
      const conversationIdToUse = currentConversationId || persistenceConversationId;
      
      if (conversationIdToUse) {
        const messageWithTimestamp: ChatMessage = {
          id: message.id,
          role: 'assistant',
          content: message.content,
          timestamp: Date.now(),
          sources: message.sources,
          metadata: message.generated_title ? { generated_title: message.generated_title } : {}
        };
        
        chatPersistence.saveMessage({ 
          message: messageWithTimestamp, 
          chatMode: 'rag', 
          conversationId: conversationIdToUse 
        }).catch(error => {
          console.error('Failed to save RAG assistant message:', error);
        });
      }
    },
    onMessageSent: (message) => {
      // Save user message to database
      const persistenceConversationId = chatPersistence.getCurrentConversationId();
      const conversationIdToUse = currentConversationId || persistenceConversationId;
      
      if (conversationIdToUse) {
        const messageWithTimestamp: ChatMessage = {
          id: message.id,
          role: 'user',
          content: message.content,
          timestamp: Date.now(),
          sources: message.sources || [],
          metadata: {}
        };
        
        chatPersistence.saveMessage({ 
          message: messageWithTimestamp, 
          chatMode: 'rag', 
          conversationId: conversationIdToUse 
        }).catch(error => {
          console.error('Failed to save RAG user message:', error);
        });
      }
    },
    onMessageReceived: (message) => {
      // This callback is handled in onFinish to avoid duplicate saves
      console.log('RAG message received:', message.id);
    },
    onTitleGenerated: (title) => {
      console.log('Title generated in RAG chat:', title);
      
      // Try to get the conversation ID from the persistence hook as a fallback
      const persistenceConversationId = chatPersistence.getCurrentConversationId();
      const conversationIdToUse = currentConversationId || persistenceConversationId;
      
      setConversationTitle(title);
      setIsGeneratingTitle(false);
      setTitleGenerationProgress(100);

      // Save the title to the database via our API
      if (conversationIdToUse) {
        saveConversationTitle(conversationIdToUse, title);
      }
    },
  });

  // Choose which chat to use based on mode - memoized
  const currentChat = useMemo(() =>
    chatMode === 'general' ? generalChat : ragChat,
    [chatMode, generalChat, ragChat]
  );

  // Sync store messages to chat hooks only on mode change or when messages change
  // Use refs to track previous values to prevent infinite loops
  const prevGeneralMessagesRef = useRef<ChatMessage[]>([]);
  const prevRagMessagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    // Only update if the messages have actually changed (deep comparison)
    const generalMessagesChanged = JSON.stringify(generalMessages) !== JSON.stringify(prevGeneralMessagesRef.current);
    const ragMessagesChanged = JSON.stringify(ragMessages) !== JSON.stringify(prevRagMessagesRef.current);

    if (chatMode === 'general' && generalMessages.length > 0 && generalMessagesChanged) {
      prevGeneralMessagesRef.current = [...generalMessages];
      generalChat.setMessages(generalMessages);
    } else if (chatMode === 'rag' && ragMessages.length > 0 && ragMessagesChanged) {
      prevRagMessagesRef.current = [...ragMessages];
      ragChat.setMessages(ragMessages);
    }
  }, [chatMode, generalChat, ragChat, generalMessages, ragMessages]);

  // Sync chat hook messages to store when they change
  // Use refs to track previous message content to avoid infinite loops
  const prevGeneralMessagesContent = useRef('');
  const prevRagMessagesContent = useRef('');

  // Single useEffect for both chat types to reduce complexity
  useEffect(() => {
    // For general chat
    if (chatMode === 'general' && generalChat.messages.length > 0) {
      const formattedMessages = generalChat.messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => {
          const msgAny = msg as any;
          return {
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msgAny.timestamp || Date.now(),
            sources: msgAny.sources || [],
            metadata: msgAny.metadata || {}
          } as Message;
        });

      // Create a content hash to compare instead of full JSON stringify
      const contentHash = formattedMessages.map(m => `${m.id}:${m.content}`).join('|');

      // Only update if content has actually changed
      if (contentHash !== prevGeneralMessagesContent.current) {
        prevGeneralMessagesContent.current = contentHash;
        // Skip the update if it would cause a loop
        if (JSON.stringify(formattedMessages) !== JSON.stringify(generalMessages)) {
          setGeneralMessages(formattedMessages);
        }
      }
    }

    // For RAG chat
    if (chatMode === 'rag' && ragChat.messages.length > 0) {
      const formattedMessages = ragChat.messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => {
          const msgAny = msg as any;
          return {
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msgAny.timestamp || Date.now(),
            sources: msgAny.sources || [],
            metadata: msgAny.metadata || {}
          } as Message;
        });

      // Create a content hash to compare instead of full JSON stringify
      const contentHash = formattedMessages.map(m => `${m.id}:${m.content}`).join('|');

      // Only update if content has actually changed
      if (contentHash !== prevRagMessagesContent.current) {
        prevRagMessagesContent.current = contentHash;
        // Skip the update if it would cause a loop
        if (JSON.stringify(formattedMessages) !== JSON.stringify(ragMessages)) {
          setRagMessages(formattedMessages);
        }
      }
    }
  }, [
    chatMode,
    generalChat.messages,
    ragChat.messages,
    generalMessages,
    ragMessages,
    setGeneralMessages,
    setRagMessages
  ]);

  // Load conversation messages when a conversation is selected
  useEffect(() => {
    if (loadedConversation) {
      // The store's loadConversationState should have already loaded the messages
      // We just need to ensure the chat mode is set correctly
      setChatMode(loadedConversation.type);
      setCurrentConversation(loadedConversation.conversation._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedConversation?.conversation?._id, loadedConversation?.type]);

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

  // Custom submit handler with persistence
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentChat.input.trim() || currentChat.isLoading) return;

    const userMessage = currentChat.input.trim();

    // Create or get conversation if this is the first message
    if (!currentConversationId) {
      try {
        // Start title generation animation for first message
        setIsGeneratingTitle(true);
        setTitleGenerationProgress(0);

        // Create a timer to simulate progress
        const titleProgressInterval = setInterval(() => {
          setTitleGenerationProgress(prev => {
            if (prev >= 90) {
              clearInterval(titleProgressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 300);

        const conversationId = await chatPersistence.createConversation({
          type: chatMode,
          chatMode,
          selectedDocuments: chatMode === 'rag' ? selectedDocuments : [],
          llmModel: 'llama-3.2' // You might want to make this configurable
        });

        console.log('🎯 Created conversation with ID:', conversationId);

        // Set the conversation ID in the chat hook
        if (chatMode === 'general') {
          console.log('🎯 Setting conversation ID in general chat hook:', conversationId);
          generalChat.setConversationId(conversationId);
        } else {
          console.log('🎯 Setting conversation ID in RAG chat hook:', conversationId);
          ragChat.setConversationId(conversationId);
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
        toast.error('Failed to start conversation');
        setIsGeneratingTitle(false);
        return;
      }
    }

    // Submit the message to the chat hook
    // Message saving is now handled in the chat hook callbacks
    currentChat.handleSubmit(e);
  };

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

  // Handle conversation selection from history - memoized
  const handleConversationSelect = useCallback(async (conversation: any, type: 'general' | 'rag') => {
    console.log('Selected conversation:', conversation, 'type:', type);

    // Use the store's loadConversationState function to properly load the conversation
    const { loadConversationState, setGeneralMessages, setRagMessages } = useUnifiedChatStore.getState();

    // Load conversation metadata
    loadConversationState({
      id: conversation._id,
      type: conversation.type || type,
      title: conversation.title,
      documentIds: conversation.documentIds,
      documentTitles: conversation.documentTitles,
      metadata: conversation.metadata || {}
    });

    // Fetch messages from the database
    try {
      const response = await fetch(`/api/unified-chat/messages?conversationId=${encodeURIComponent(conversation._id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const messages = data.messages || [];

        // Set messages in the appropriate store
        if (type === 'general') {
          setGeneralMessages(messages);
          generalChat.setMessages(messages);
        } else {
          setRagMessages(messages);
          ragChat.setMessages(messages);
        }

        console.log(`Loaded ${messages.length} messages for conversation ${conversation._id}`);
      } else {
        console.error('Failed to load messages:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }

    setIsHistoryModalOpen(false);

    // Set the loaded conversation to trigger message loading
    setLoadedConversation({ conversation, type });

    // Update document count for RAG conversations
    if (type === 'rag' && conversation.documentIds) {
      onDocumentCountChange?.(conversation.documentIds.length);
    } else {
      onDocumentCountChange?.(0);
    }
  }, [onDocumentCountChange, generalChat, ragChat, setGeneralMessages, setRagMessages]);

  // Function to save conversation title to database
  const saveConversationTitle = useCallback(async (conversationId: string, title: string) => {
    try {
      console.log('Saving conversation title to database:', { conversationId, title });

      const response = await fetch('/api/conversations/update-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          title,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save title: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Title saved successfully:', result);

      // Show success toast
      toast.success(`Conversation titled: "${title}"`);
    } catch (error) {
      console.error('Error saving conversation title:', error);
      toast.error('Failed to save conversation title');
    }
  }, []);

  // Get appropriate steps for progress loader - memoized
  const getProgressSteps = useCallback(() => {
    if (chatMode === 'general') {
      return ["Processing query", "Connecting to LLM", "Generating response", "Finalizing"];
    } else {
      return ["Analyzing documents", "Connecting to LLM", "Generating response", "Finalizing"];
    }
  }, [chatMode]);

  // Event handlers for the extracted components
  const handleHistoryClick = () => setIsHistoryModalOpen(true);
  const handleNewConversationClick = () => {
    startNewConversation();
    setConversationTitle(null); // Reset the conversation title
    toast.info('Started new conversation');
  };
  const handleRemoveDocumentsClick = () => {
    clearDocuments();
    onDocumentCountChange?.(0);
  };
  const handleDocumentsClick = () => setIsDocumentModalOpen(true);
  const handleDocumentModalClose = () => setIsDocumentModalOpen(false);

  // Model selection handler
  const handleModelChange = useCallback(async (modelName: string) => {
    setSelectedModel(modelName);
    
    // Switch model in the backend
    try {
      const response = await fetch('/api/lightweight-llm/admin/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_id: modelName }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      toast.success(`Switched to ${modelName}`);
      console.log('Model switched successfully:', result);
      
    } catch (error) {
      console.error('Failed to switch model:', error);
      toast.error(`Failed to switch to ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return; // Don't save to conversation if model switch failed
    }
    
    // Note: Model selection is now handled per-message rather than per-conversation
    // No need to save model selection to conversation level
    
    console.log('Selected model changed to:', modelName);
  }, [chatPersistence]);

  return (
    <>
      <BackgroundGradient color="cyan" containerClassName="w-full" tronMode={true} intensity="normal">
        <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[700px] from-slate-800/40 via-slate-900/60 to-slate-800/40 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">

          <ChatHeader
            conversationTitle={conversationTitle}
            isGeneratingTitle={isGeneratingTitle}
            titleGenerationProgress={titleGenerationProgress}
            selectedDocuments={selectedDocuments}
            onHistoryClick={handleHistoryClick}
            onNewConversationClick={handleNewConversationClick}
            onRemoveDocumentsClick={handleRemoveDocumentsClick}
            onDocumentsClick={handleDocumentsClick}
            onDocumentClick={handleDocumentClick}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
          />

          <ChatMessageList
            messages={chatMode === 'general' ? generalMessages : ragMessages}
            isLoading={currentChat.isLoading}
            chatMode={chatMode}
            selectedDocuments={selectedDocuments}
            llmProgress={llmProgress}
            getProgressSteps={getProgressSteps}
          />

          <ChatInputForm
            input={currentChat.input}
            isLoading={currentChat.isLoading}
            chatMode={chatMode}
            onInputChange={currentChat.handleInputChange}
            onSubmit={handleSendMessage}
          />

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
