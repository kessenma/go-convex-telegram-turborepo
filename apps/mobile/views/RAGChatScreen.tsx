import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { api } from '../generated-convex';
import DocumentSelector from '../components/rag/DocumentSelector';
import ChatInterface from '../components/rag/ChatInterface';
import DocumentHistory from '../components/rag/DocumentHistory';

interface Document {
  _id: string;
  title: string;
  content: string;
  contentType: string;
  fileSize: number;
  wordCount: number;
  uploadedAt: number;
  summary?: string;
  hasEmbedding: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  documentIds: string[];
  documentTitles: string[];
  messageCount: number;
  lastMessage: string;
  createdAt: number;
  updatedAt: number;
}

type ScreenState = 'selector' | 'chat' | 'history';

const RAGChatScreen = () => {
  const navigation = useNavigation();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('selector');
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [sessionId] = useState(() => `mobile-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Fetch documents from Convex
  const documentsQuery = useQuery(api.documents.getAllDocuments, { limit: 50 });
  const documents = documentsQuery?.page || [];
  const loading = documentsQuery === undefined;
  const hasError = documentsQuery === null;

  // Update selected documents when IDs change
  useEffect(() => {
    if (documents.length > 0) {
      const selected = documents.filter((doc: Document) => selectedDocumentIds.includes(doc._id));
      setSelectedDocuments(selected);
    }
  }, [selectedDocumentIds, documents.length]); // Use documents.length instead of documents array

  // Handle Convex query errors
  useEffect(() => {
    if (hasError) {
      Alert.alert('Error', 'Failed to load documents. Please check your connection and try again.');
    }
  }, [hasError]);

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocumentIds(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };

  const handleStartChat = () => {
    if (selectedDocumentIds.length === 0) {
      Alert.alert('No Documents Selected', 'Please select at least one document to start chatting.');
      return;
    }
    setCurrentScreen('chat');
  };

  const handleBackToSelection = () => {
    setCurrentScreen('selector');
  };

  const handleShowHistory = () => {
    setCurrentScreen('history');
  };

  const handleContinueChat = (session: ChatSession) => {
    // Load the session's documents
    setSelectedDocumentIds(session.documentIds);
    setCurrentScreen('chat');
  };

  const handleGoBack = () => {
    if (currentScreen === 'selector') {
      navigation.goBack();
    } else {
      setCurrentScreen('selector');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'selector':
        return (
          <DocumentSelector
            documents={documents}
            selectedDocuments={selectedDocumentIds}
            onDocumentToggle={handleDocumentToggle}
            onStartChat={handleStartChat}
            onShowHistory={handleShowHistory}
            loading={loading}
          />
        );
      
      case 'chat':
        return (
          <ChatInterface
            selectedDocuments={selectedDocuments}
            onBackToSelection={handleBackToSelection}
            onShowHistory={handleShowHistory}
            sessionId={sessionId}
          />
        );
      
      case 'history':
        return (
          <DocumentHistory
            onBackToSelection={handleBackToSelection}
            onContinueChat={handleContinueChat}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});

export default RAGChatScreen;