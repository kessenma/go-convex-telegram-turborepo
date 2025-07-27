import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from 'convex/react';
import type { GenericId as Id } from 'convex/values';
import { getApiUrl } from '../../config';
import { api } from '../../generated-convex';

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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: Array<{
    title: string;
    snippet: string;
    score: number;
    documentId: string;
  }>;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: Array<{
    title: string;
    snippet: string;
    score: number;
    documentId: string;
  }>;
}

interface ChatInterfaceProps {
  selectedDocuments: Document[];
  onBackToSelection: () => void;
  onShowHistory: () => void;
  sessionId: string;
}

export function ChatInterface({
  selectedDocuments,
  onBackToSelection,
  onShowHistory,
  sessionId,
}: ChatInterfaceProps): React.ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDocumentInfo, setShowDocumentInfo] = useState(false);
  const [_conversationId, _setConversationId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Convex queries for conversation persistence
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Prevent double submission
    if (isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/api/RAG/document-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          documentIds: selectedDocuments.map((doc) => doc._id),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.response,
          timestamp: Date.now(),
          sources: result.sources,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Handle service unavailable (503) or other errors
        if (response.status === 503 && result.serviceUnavailable) {
          Alert.alert(
            'Service Unavailable',
            result.error || 'Chat service is currently unavailable'
          );
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content:
              result.error ||
              'Someone else is using the chat service right now. Please try again in a minute or two.',
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        } else {
          throw new Error(result.error || 'Chat request failed');
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  useEffect(() => {
    // Scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBackToSelection}>
          <Icon name="arrow-left" size={20} color="#007AFF" />
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Document Chat</Text>

        <TouchableOpacity style={styles.headerButton} onPress={onShowHistory}>
          <Icon name="clock" size={20} color="#007AFF" />
          <Text style={styles.headerButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Document Info */}
      <TouchableOpacity
        style={styles.documentInfoContainer}
        onPress={() => setShowDocumentInfo(!showDocumentInfo)}
      >
        <View style={styles.documentInfoHeader}>
          <View style={styles.documentInfoLeft}>
            <Icon name="file-text" size={16} color="#007AFF" />
            <Text style={styles.documentInfoTitle}>
              {selectedDocuments.length === 1
                ? selectedDocuments[0].title
                : `${selectedDocuments.length} documents selected`}
            </Text>
          </View>
          <Icon 
            name={showDocumentInfo ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#666" 
          />
        </View>

        {showDocumentInfo && (
          <View style={styles.documentInfoDetails}>
            {selectedDocuments.map((doc) => (
              <View key={doc._id} style={styles.documentItem}>
                <Text style={styles.documentItemTitle}>{doc.title}</Text>
                <Text style={styles.documentItemId}>ID: {doc._id}</Text>
                <View style={styles.documentItemMeta}>
                  <Text style={styles.documentItemMetaText}>
                    {formatFileSize(doc.fileSize)} • {doc.wordCount.toLocaleString()} words
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="message-circle" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Start a conversation</Text>
            <Text style={styles.emptyDescription}>
              Ask questions about your selected documents to get AI-powered insights.
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.type === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.type === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.type === 'user' ? styles.userText : styles.assistantText,
                  ]}
                >
                  {message.content}
                </Text>
                
                {/* Source references for assistant messages */}
                {message.sources && message.sources.length > 0 && (
                  <View style={styles.sourcesContainer}>
                    <View style={styles.sourcesHeader}>
                      <View style={styles.sourcesLine} />
                      <Text style={styles.sourcesTitle}>Sources</Text>
                    </View>
                    {message.sources.map((source, index) => (
                      <View key={index} style={styles.sourceItem}>
                        <View style={styles.sourceHeader}>
                          <Text style={styles.sourceTitle}>{source.title}</Text>
                          <Text style={styles.sourceScore}>
                            {(source.score * 100).toFixed(1)}% match
                          </Text>
                        </View>
                        <Text style={styles.sourceSnippet}>{source.snippet}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                <Text
                  style={[
                    styles.messageTime,
                    message.type === 'user' ? styles.userTime : styles.assistantTime,
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))
        )}

        {isLoading && (
          <View style={[styles.messageContainer, styles.assistantMessage]}>
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Ask a question about your documents..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Icon name="send" size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  documentInfoContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  documentInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  documentInfoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  documentInfoDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  documentItem: {
    marginBottom: 8,
  },
  documentItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  documentItemId: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  documentItemMeta: {
    flexDirection: 'row',
  },
  documentItemMetaText: {
    fontSize: 12,
    color: '#999',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  userTime: {
    color: '#ffffff',
    textAlign: 'right',
  },
  assistantTime: {
    color: '#666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sourcesContainer: {
    marginTop: 12,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sourcesLine: {
    width: 16,
    height: 2,
    backgroundColor: '#007AFF',
    borderRadius: 1,
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    flex: 1,
  },
  sourceScore: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '500',
  },
  sourceSnippet: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
});

export default ChatInterface;