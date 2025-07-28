import { create } from 'zustand';
import type { ChatConversation, Document } from '../app/RAG-chat/types';

export type ViewState = 'selection' | 'chat' | 'history';
export type SlideDirection = 'left' | 'right';

interface RagChatState {
  // Document selection
  selectedDocuments: string[];
  selectedDocumentObjects: Document[];
  
  // View management
  currentView: ViewState;
  previousView: ViewState;
  slideDirection: SlideDirection;
  
  // Chat session
  currentSessionId: string;
  
  // Actions
  setSelectedDocuments: (documents: string[]) => void;
  toggleDocument: (documentId: string) => void;
  setSelectedDocumentObjects: (documents: Document[]) => void;
  
  // View navigation
  setCurrentView: (view: ViewState, direction?: SlideDirection) => void;
  navigateToChat: () => void;
  navigateToSelection: () => void;
  navigateToHistory: () => void;
  navigateBack: () => void;
  
  // Session management
  setCurrentSessionId: (sessionId: string) => void;
  generateNewSession: () => void;
  
  // Conversation handling
  selectConversation: (conversation: ChatConversation) => void;
  startNewChat: () => void;
  
  // Reset
  reset: () => void;
}

export const useRagChatStore = create<RagChatState>((set, get) => ({
  // Initial state
  selectedDocuments: [],
  selectedDocumentObjects: [],
  currentView: 'selection',
  previousView: 'selection',
  slideDirection: 'left',
  currentSessionId: '',
  
  // Document selection actions
  setSelectedDocuments: (documents: string[]) => {
    set({ selectedDocuments: documents });
  },
  
  toggleDocument: (documentId: string) => {
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
  
  generateNewSession: () => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    set({ currentSessionId: sessionId });
  },
  
  // Conversation handling
  selectConversation: (conversation: ChatConversation) => {
    set({
      selectedDocuments: conversation.documentIds,
      currentSessionId: conversation.sessionId
    });
    get().setCurrentView('chat', 'right');
  },
  
  startNewChat: () => {
    set({
      selectedDocuments: [],
      selectedDocumentObjects: [],
      currentSessionId: ''
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
      currentSessionId: ''
    });
  }
}));