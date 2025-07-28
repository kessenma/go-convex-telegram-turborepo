import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { GenericId as Id } from 'convex/values';

// Initialize MMKV storage for RAG chat
const ragChatStorage = new MMKV({ id: 'rag-chat-store' });

// Custom MMKV storage adapter for Zustand
const mmkvStorage = {
  getItem: (name: string) => {
    const value = ragChatStorage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    ragChatStorage.set(name, value);
  },
  removeItem: (name: string) => {
    ragChatStorage.delete(name);
  },
};

export type ViewState = 'selection' | 'chat' | 'history';
export type SlideDirection = 'left' | 'right';

interface Document {
  _id: Id<"rag_documents">;
  title: string;
  content?: string;
  fileType?: string;
  uploadedAt?: number;
}

interface ChatConversation {
  _id: Id<"rag_conversations">;
  _creationTime: number;
  sessionId: string;
  title: string;
  documentIds: Id<"rag_documents">[];
  documentTitles?: string[];
  messageCount: number;
  lastMessage?: string;
  lastUpdated?: number;
  isActive: boolean;
}

interface RagChatState {
  // Document selection
  selectedDocuments: Id<"rag_documents">[];
  selectedDocumentObjects: Document[];
  
  // View management
  currentView: ViewState;
  previousView: ViewState;
  slideDirection: SlideDirection;
  
  // Chat session
  currentSessionId: string;
  currentConversationId: Id<"rag_conversations"> | null;
  
  // Actions
  setSelectedDocuments: (documents: Id<"rag_documents">[]) => void;
  toggleDocument: (documentId: Id<"rag_documents">) => void;
  setSelectedDocumentObjects: (documents: Document[]) => void;
  
  // View navigation
  setCurrentView: (view: ViewState, direction?: SlideDirection) => void;
  navigateToChat: () => void;
  navigateToSelection: () => void;
  navigateToHistory: () => void;
  navigateBack: () => void;
  
  // Session management
  setCurrentSessionId: (sessionId: string) => void;
  setCurrentConversationId: (conversationId: Id<"rag_conversations"> | null) => void;
  generateNewSession: () => void;
  
  // Conversation handling
  selectConversation: (conversation: ChatConversation) => void;
  startNewChat: () => void;
  
  // Reset
  reset: () => void;
}

export const useRagChatStore = create<RagChatState>()(subscribeWithSelector(persist(
  (set, get) => ({
    // Initial state
    selectedDocuments: [],
    selectedDocumentObjects: [],
    currentView: 'selection',
    previousView: 'selection',
    slideDirection: 'left',
    currentSessionId: '',
    currentConversationId: null,
    
    // Document selection actions
    setSelectedDocuments: (documents: Id<"rag_documents">[]) => {
      set({ selectedDocuments: documents });
    },
    
    toggleDocument: (documentId: Id<"rag_documents">) => {
      const { selectedDocuments } = get();
      const isCurrentlySelected = selectedDocuments.includes(documentId);
      
      // If trying to select and already at limit, don't allow selection
      if (!isCurrentlySelected && selectedDocuments.length >= 3) {
        return;
      }
      
      const newSelectedDocuments = isCurrentlySelected
        ? selectedDocuments.filter((id) => id !== documentId)
        : [...selectedDocuments, documentId];
      
      set({ selectedDocuments: newSelectedDocuments });
    },
    
    setSelectedDocumentObjects: (documents: Document[]) => {
      set({ selectedDocumentObjects: documents });
    },
    
    // View navigation actions
    setCurrentView: (view: ViewState, direction: SlideDirection = 'left') => {
      const { currentView } = get();
      set({ 
        previousView: currentView,
        currentView: view,
        slideDirection: direction
      });
    },
    
    navigateToChat: () => {
      const { selectedDocuments } = get();
      if (selectedDocuments.length > 0) {
        get().generateNewSession();
        get().setCurrentView('chat', 'left');
      }
    },
    
    navigateToSelection: () => {
      get().setCurrentView('selection', 'right');
    },
    
    navigateToHistory: () => {
      get().setCurrentView('history', 'left');
    },
    
    navigateBack: () => {
      const { previousView } = get();
      get().setCurrentView(previousView, 'right');
    },
    
    // Session management
    setCurrentSessionId: (sessionId: string) => {
      set({ currentSessionId: sessionId });
    },
    
    setCurrentConversationId: (conversationId: Id<"rag_conversations"> | null) => {
      set({ currentConversationId: conversationId });
    },
    
    generateNewSession: () => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      set({ currentSessionId: sessionId, currentConversationId: null });
    },
    
    // Conversation handling
    selectConversation: (conversation: ChatConversation) => {
      set({
        selectedDocuments: conversation.documentIds,
        currentSessionId: conversation.sessionId,
        currentConversationId: conversation._id
      });
      get().setCurrentView('chat', 'right');
    },
    
    startNewChat: () => {
      set({
        selectedDocuments: [],
        selectedDocumentObjects: [],
        currentSessionId: '',
        currentConversationId: null
      });
      get().setCurrentView('selection', 'right');
    },
    
    // Reset all state
    reset: () => {
      set({
        selectedDocuments: [],
        selectedDocumentObjects: [],
        currentView: 'selection',
        previousView: 'selection',
        slideDirection: 'left',
        currentSessionId: '',
        currentConversationId: null
      });
    }
  }),
  {
    name: 'rag-chat-store',
    storage: createJSONStorage(() => mmkvStorage),
    // Only persist essential state
    partialize: (state) => ({
      currentView: state.currentView,
      selectedDocuments: state.selectedDocuments,
      currentSessionId: state.currentSessionId,
      currentConversationId: state.currentConversationId,
    }),
  }
)));

export type { Document, ChatConversation };