import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

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

interface DocumentHistoryProps {
  onBackToSelection: () => void;
  onContinueChat: (session: ChatSession) => void;
}

export function DocumentHistory({
  onBackToSelection,
  onContinueChat,
}: DocumentHistoryProps): React.ReactElement {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const loadChatHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // TODO: Replace with actual API call to fetch chat history
      // For now, using mock data
      const mockSessions: ChatSession[] = [
        {
          id: '1',
          title: 'Discussion about AI Ethics',
          documentIds: ['doc1', 'doc2'],
          documentTitles: ['AI Ethics Paper', 'Machine Learning Guidelines'],
          messageCount: 15,
          lastMessage: 'Thank you for the detailed explanation about bias in AI systems.',
          createdAt: Date.now() - 86400000, // 1 day ago
          updatedAt: Date.now() - 3600000, // 1 hour ago
        },
        {
          id: '2',
          title: 'Technical Documentation Review',
          documentIds: ['doc3'],
          documentTitles: ['API Documentation'],
          messageCount: 8,
          lastMessage: 'Can you explain the authentication flow in more detail?',
          createdAt: Date.now() - 172800000, // 2 days ago
          updatedAt: Date.now() - 7200000, // 2 hours ago
        },
      ];

      setSessions(mockSessions);
    } catch (error) {
      console.error('Error loading chat history:', error);
      Alert.alert('Error', 'Failed to load chat history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteSessions = async () => {
    if (selectedSessions.length === 0) return;

    Alert.alert(
      'Delete Chat Sessions',
      `Are you sure you want to delete ${selectedSessions.length} chat session(s)? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Replace with actual API call to delete sessions
              setSessions(prev => prev.filter(session => !selectedSessions.includes(session.id)));
              setSelectedSessions([]);
              setIsSelectionMode(false);
            } catch (error) {
              console.error('Error deleting sessions:', error);
              Alert.alert('Error', 'Failed to delete chat sessions. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        const newSelection = prev.filter(id => id !== sessionId);
        if (newSelection.length === 0) {
          setIsSelectionMode(false);
        }
        return newSelection;
      } else {
        return [...prev, sessionId];
      }
    });
  };

  const startSelectionMode = (sessionId: string) => {
    setIsSelectionMode(true);
    setSelectedSessions([sessionId]);
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedSessions([]);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onBackToSelection}>
            <Icon name="arrow-left" size={20} color="#007AFF" />
            <Text style={styles.headerButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat History</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading chat history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isSelectionMode ? (
          <>
            <TouchableOpacity style={styles.headerButton} onPress={cancelSelectionMode}>
              <Text style={styles.headerButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {selectedSessions.length} selected
            </Text>
            <TouchableOpacity style={styles.headerButton} onPress={handleDeleteSessions}>
              <Icon name="trash-2" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.headerButton} onPress={onBackToSelection}>
              <Icon name="arrow-left" size={20} color="#007AFF" />
              <Text style={styles.headerButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chat History</Text>
            <View style={styles.headerButton} />
          </>
        )}
      </View>

      {sessions.length > 0 ? (
        <ScrollView
          style={styles.sessionsContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadChatHistory(true)}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {sessions.map((session) => {
            const isSelected = selectedSessions.includes(session.id);

            return (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionCard,
                  isSelected && styles.sessionCardSelected,
                ]}
                onPress={() => {
                  if (isSelectionMode) {
                    toggleSessionSelection(session.id);
                  } else {
                    onContinueChat(session);
                  }
                }}
                onLongPress={() => {
                  if (!isSelectionMode) {
                    startSelectionMode(session.id);
                  }
                }}
              >
                <View style={styles.sessionContent}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionTitleRow}>
                      <Icon name="message-circle" size={16} color="#007AFF" />
                      <Text style={styles.sessionTitle} numberOfLines={1}>
                        {session.title}
                      </Text>
                      {isSelectionMode && (
                        <View style={[
                          styles.checkbox,
                          isSelected ? styles.checkboxSelected : styles.checkboxDefault,
                        ]}>
                          {isSelected && (
                            <Icon name="check" size={12} color="#ffffff" />
                          )}
                        </View>
                      )}
                    </View>
                    <Text style={styles.sessionDate}>
                      {formatDate(session.updatedAt)}
                    </Text>
                  </View>

                  <Text style={styles.sessionLastMessage} numberOfLines={2}>
                    {session.lastMessage}
                  </Text>

                  <View style={styles.sessionMeta}>
                    <View style={styles.sessionMetaItem}>
                      <Icon name="file-text" size={12} color="#666" />
                      <Text style={styles.sessionMetaText}>
                        {session.documentTitles.length === 1
                          ? session.documentTitles[0]
                          : `${session.documentTitles.length} documents`}
                      </Text>
                    </View>
                    <View style={styles.sessionMetaItem}>
                      <Icon name="message-square" size={12} color="#666" />
                      <Text style={styles.sessionMetaText}>
                        {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </View>

                {!isSelectionMode && (
                  <Icon name="chevron-right" size={16} color="#ccc" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="message-circle" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No Chat History</Text>
          <Text style={styles.emptyDescription}>
            Your previous conversations with documents will appear here.
          </Text>
          <TouchableOpacity style={styles.startChatButton} onPress={onBackToSelection}>
            <Text style={styles.startChatButtonText}>Start Your First Chat</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    minWidth: 60,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  sessionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionCardSelected: {
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  sessionDate: {
    fontSize: 12,
    color: '#999',
  },
  sessionLastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionMetaText: {
    fontSize: 12,
    color: '#666',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDefault: {
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    marginBottom: 24,
  },
  startChatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startChatButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default DocumentHistory;