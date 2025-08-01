import { create } from 'zustand';
import type { Document } from '../app/RAG-chat/types';

export interface ChatMessage {
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

export type ChatMode = 'general' | 'rag';

interface UnifiedChatState {
  // Chat mode and documents
  chatMode: ChatMode;
  selectedDocuments: Document[];
  
  // Messages for each mode
  generalMessages: ChatMessage[];
  ragMessages: ChatMessage[];
  
  // Current conversation tracking
  currentConversationId: string | null;
  
  // Actions
  setChatMode: (mode: ChatMode) => void;
  setSelectedDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  removeDocument: (documentId: string) => void;
  clearDocuments: () => void;
  
  // Message management
  setGeneralMessages: (messages: ChatMessage[]) => void;
  setRagMessages: (messages: ChatMessage[]) => void;
  addGeneralMessage: (message: ChatMessage) => void;
  addRagMessage: (message: ChatMessage) => void;
  clearMessages: (mode?: ChatMode) => void;
  
  // Conversation management
  setCurrentConversation: (conversationId: string | null) => void;
  startNewConversation: () => void;
  
  // Reset
  reset: () => void;
}

// Document interface is imported from ../app/RAG-chat/types

// Memoized selectors for performance optimization
export const useUnifiedChatStore = create<UnifiedChatState>((set, get) => ({
  // Initial state
  chatMode: 'general',
  selectedDocuments: [],
  generalMessages: [],
  ragMessages: [],
  currentConversationId: null,
  
  // Chat mode and document actions
  setChatMode: (mode: ChatMode) => {
    const { selectedDocuments } = get();
    
    // If switching to RAG mode but no documents selected, don't switch
    if (mode === 'rag' && selectedDocuments.length === 0) {
      return;
    }
    
    // If switching to general mode, clear documents
    if (mode === 'general') {
      set({ 
        chatMode: mode,
        selectedDocuments: [],
        currentConversationId: null
      });
    } else {
      set({ 
        chatMode: mode,
        currentConversationId: null // Start fresh conversation when switching modes
      });
    }
  },
  
  setSelectedDocuments: (documents: Document[]) => {
    const { selectedDocuments: currentDocs, chatMode, currentConversationId, generalMessages } = get();
    
    // Check if documents actually changed
    const currentIds = currentDocs.map(d => d._id).sort();
    const newIds = documents.map(d => d._id).sort();
    const documentsChanged = currentIds.length !== newIds.length || 
                            currentIds.some((id, index) => id !== newIds[index]);
    
    if (documentsChanged) {
      const newMode = documents.length > 0 ? 'rag' : 'general';
      
      // If we're adding documents to an existing general chat with messages
      if (chatMode === 'general' && newMode === 'rag' && generalMessages.length > 0 && currentConversationId === null) {
        // Keep the existing messages when transitioning from general to RAG
        set({ 
          selectedDocuments: documents,
          chatMode: newMode,
          // Copy general messages to RAG messages to maintain conversation flow
          ragMessages: generalMessages
        });
      } else {
        // Otherwise, standard behavior - start new conversation
        set({ 
          selectedDocuments: documents,
          chatMode: newMode,
          currentConversationId: null, // Reset conversation
          // Only clear messages if we're changing modes
          ...(chatMode !== newMode ? 
              (newMode === 'rag' ? { ragMessages: [] } : { generalMessages: [] }) 
              : {})
        });
      }
    }
  },
  
  addDocument: (document: Document) => {
    const { selectedDocuments } = get();
    
    // Don't add if already selected or at limit
    if (selectedDocuments.some(d => d._id === document._id) || selectedDocuments.length >= 3) {
      return;
    }
    
    const newDocuments = [...selectedDocuments, document];
    get().setSelectedDocuments(newDocuments);
  },
  
  removeDocument: (documentId: string) => {
    const { selectedDocuments } = get();
    const newDocuments = selectedDocuments.filter(d => d._id !== documentId);
    get().setSelectedDocuments(newDocuments);
  },
  
  clearDocuments: () => {
    set({ 
      selectedDocuments: [],
      chatMode: 'general',
      currentConversationId: null,
      ragMessages: [] // Clear RAG messages when clearing documents
    });
  },
  
  // Message management
  setGeneralMessages: (messages: ChatMessage[]) => {
    set({ generalMessages: messages });
  },
  
  setRagMessages: (messages: ChatMessage[]) => {
    set({ ragMessages: messages });
  },
  
  addGeneralMessage: (message: ChatMessage) => {
    set(state => ({ 
      generalMessages: [...state.generalMessages, message] 
    }));
  },
  
  addRagMessage: (message: ChatMessage) => {
    set(state => ({ 
      ragMessages: [...state.ragMessages, message] 
    }));
  },
  
  clearMessages: (mode?: ChatMode) => {
    if (mode === 'general' || !mode) {
      set({ generalMessages: [] });
    }
    if (mode === 'rag' || !mode) {
      set({ ragMessages: [] });
    }
  },
  
  // Conversation management
  setCurrentConversation: (conversationId: string | null) => {
    set({ currentConversationId: conversationId });
  },
  
  startNewConversation: () => {
    const { chatMode } = get();
    set({ 
      currentConversationId: null,
      // Clear messages for current mode
      ...(chatMode === 'general' ? { generalMessages: [] } : { ragMessages: [] })
    });
  },
  
  // Reset all state
  reset: () => {
    set({
      chatMode: 'general',
      selectedDocuments: [],
      generalMessages: [],
      ragMessages: [],
      currentConversationId: null,
    });
  }
}));

// Optimized selectors for specific state slices to prevent unnecessary re-renders
export const useChatMode = () => useUnifiedChatStore(state => state.chatMode);
export const useSelectedDocuments = () => useUnifiedChatStore(state => state.selectedDocuments);
export const useGeneralMessages = () => useUnifiedChatStore(state => state.generalMessages);
export const useRagMessages = () => useUnifiedChatStore(state => state.ragMessages);
export const useCurrentConversationId = () => useUnifiedChatStore(state => state.currentConversationId);

// Action selectors - memoized to prevent re-creation
// Export individual action selectors to prevent infinite loops
export const useSetChatMode = () => useUnifiedChatStore(state => state.setChatMode);
export const useSetSelectedDocuments = () => useUnifiedChatStore(state => state.setSelectedDocuments);
export const useClearDocuments = () => useUnifiedChatStore(state => state.clearDocuments);
export const useSetGeneralMessages = () => useUnifiedChatStore(state => state.setGeneralMessages);
export const useSetRagMessages = () => useUnifiedChatStore(state => state.setRagMessages);
export const useStartNewConversation = () => useUnifiedChatStore(state => state.startNewConversation);
export const useSetCurrentConversation = () => useUnifiedChatStore(state => state.setCurrentConversation);

// Document-related selectors
export const useDocumentCount = () => useUnifiedChatStore(state => state.selectedDocuments.length);
export const useHasDocuments = () => useUnifiedChatStore(state => state.selectedDocuments.length > 0);
export const useCanAddMoreDocuments = () => useUnifiedChatStore(state => state.selectedDocuments.length < 3);

// Message-related selectors
export const useMessageCount = (mode?: ChatMode) => useUnifiedChatStore(state => {
  if (mode === 'general') return state.generalMessages.length;
  if (mode === 'rag') return state.ragMessages.length;
  return state.generalMessages.length + state.ragMessages.length;
});

export const useHasMessages = (mode?: ChatMode) => useUnifiedChatStore(state => {
  if (mode === 'general') return state.generalMessages.length > 0;
  if (mode === 'rag') return state.ragMessages.length > 0;
  return state.generalMessages.length > 0 || state.ragMessages.length > 0;
});