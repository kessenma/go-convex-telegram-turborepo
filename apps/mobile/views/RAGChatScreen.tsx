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
import { useRagChatStore, type Document as StoreDocument, type ChatConversation } from '../stores/useRagChatStore';
import type { GenericId as Id } from 'convex/values';

interface Document {
  _id: Id<"rag_documents">;
  title: string;
  content: string;
  contentType: string;
  fileSize: number;
  wordCount: number;
  uploadedAt: number;
  summary?: string;
  hasEmbedding: boolean;
}

// Use the store's ChatConversation type for consistency
type ChatSession = ChatConversation;

const RAGChatScreen = () => {
  const navigation = useNavigation();
  const {
    currentView,
    selectedDocuments: selectedDocumentIds,
    selectedDocumentObjects,
    setSelectedDocuments,
    setSelectedDocumentObjects,
    navigateToChat,
    navigateToSelection,
    navigateToHistory,
    navigateBack,
    currentSessionId,
  } = useRagChatStore();

  // Fetch documents from Convex
  const documentsQuery = useQuery(api.documents.getAllDocuments, { limit: 50 });
  const documents = documentsQuery?.page || [];
  const loading = documentsQuery === undefined;
  const hasError = documentsQuery === null;

  // Update selected documents when IDs change
  useEffect(() => {
    if (documents.length > 0) {
      const selected = documents.filter((doc: Document) => 
        selectedDocumentIds.includes(doc._id as Id<"rag_documents">)
      );
      // Convert to store document format
      const storeDocuments: StoreDocument[] = selected.map((doc: Document) => ({
        _id: doc._id,
        title: doc.title,
        content: doc.content,
        fileType: doc.contentType,
        uploadedAt: doc.uploadedAt,
      }));
      setSelectedDocumentObjects(storeDocuments);
    }
  }, [selectedDocumentIds, documents.length, setSelectedDocumentObjects]);

  // Handle Convex query errors
  useEffect(() => {
    if (hasError) {
      Alert.alert('Error', 'Failed to load documents. Please check your connection and try again.');
    }
  }, [hasError]);

  const handleDocumentToggle = (documentId: string) => {
    const docId = documentId as Id<"rag_documents">;
    const newSelection = selectedDocumentIds.includes(docId)
      ? selectedDocumentIds.filter(id => id !== docId)
      : [...selectedDocumentIds, docId];
    setSelectedDocuments(newSelection);
  };

  const handleStartChat = () => {
    if (selectedDocumentIds.length === 0) {
      Alert.alert('No Documents Selected', 'Please select at least one document to start chatting.');
      return;
    }
    navigateToChat();
  };

  const handleBackToSelection = () => {
    navigateToSelection();
  };

  const handleShowHistory = () => {
    navigateToHistory();
  };

  const handleContinueChat = (session: ChatConversation) => {
    // The store's selectConversation will handle this automatically
    // No need to manually set documents or navigate
  };

  const handleGoBack = () => {
    if (currentView === 'selection') {
      navigation.goBack();
    } else {
      navigateBack();
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
    switch (currentView) {
      case 'selection':
        return (
          <DocumentSelector
            documents={documents}
            selectedDocuments={selectedDocumentIds.map(id => id as string)}
            onDocumentToggle={handleDocumentToggle}
            onStartChat={handleStartChat}
            onShowHistory={handleShowHistory}
            loading={loading}
          />
        );
      
      case 'chat':
        return (
          <ChatInterface
            selectedDocuments={selectedDocumentObjects.map((doc: StoreDocument) => ({
              _id: doc._id as string,
              title: doc.title,
              content: doc.content || '',
              contentType: doc.fileType || 'text',
              fileSize: 0,
              wordCount: 0,
              uploadedAt: doc.uploadedAt || Date.now(),
              hasEmbedding: true,
            }))}
            onBackToSelection={handleBackToSelection}
            onShowHistory={handleShowHistory}
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