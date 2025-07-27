import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

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

interface DocumentSelectorProps {
  documents: Document[];
  selectedDocuments: string[];
  onDocumentToggle: (documentId: string) => void;
  onStartChat: () => void;
  onShowHistory: () => void;
  loading?: boolean;
}

export function DocumentSelector({
  documents,
  selectedDocuments,
  onDocumentToggle,
  onStartChat,
  onShowHistory,
  loading = false,
}: DocumentSelectorProps): React.ReactElement {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Only show documents with embeddings
  const filteredDocuments = documents.filter((doc) => doc.hasEmbedding);
  const embeddedCount = filteredDocuments.length;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerAccent} />
        <Text style={styles.headerText}>
          Choose documents to start an intelligent conversation
        </Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>
            {embeddedCount} documents ready for chat
          </Text>
        </View>
      </View>

      {filteredDocuments.length > 0 ? (
        <>
          <ScrollView style={styles.documentsContainer} showsVerticalScrollIndicator={false}>
            {filteredDocuments.map((doc) => {
              const isSelected = selectedDocuments.includes(doc._id);

              return (
                <TouchableOpacity
                  key={doc._id}
                  style={[
                    styles.documentCard,
                    isSelected ? styles.documentCardSelected : styles.documentCardDefault,
                  ]}
                  onPress={() => onDocumentToggle(doc._id)}
                >
                  <View style={styles.documentContent}>
                    <View style={styles.documentHeader}>
                      <View style={styles.documentTitleRow}>
                        <Icon name="file-text" size={16} color="#007AFF" />
                        <Text style={styles.documentTitle} numberOfLines={1}>
                          {doc.title}
                        </Text>
                        <View style={styles.embeddingBadge}>
                          <Icon name="zap" size={12} color="#10B981" />
                          <Text style={styles.embeddingText}>Embedded</Text>
                        </View>
                      </View>
                    </View>

                    {doc.summary && (
                      <Text style={styles.documentSummary} numberOfLines={2}>
                        {doc.summary}
                      </Text>
                    )}

                    <View style={styles.documentMeta}>
                      <Text style={styles.metaText}>{formatFileSize(doc.fileSize)}</Text>
                      <Text style={styles.metaText}>{doc.wordCount.toLocaleString()} words</Text>
                      <Text style={styles.metaText}>{formatDate(doc.uploadedAt)}</Text>
                      <Text style={[styles.metaText, styles.contentType]}>
                        {doc.contentType.charAt(0).toUpperCase() + doc.contentType.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={[
                    styles.checkbox,
                    isSelected ? styles.checkboxSelected : styles.checkboxDefault,
                  ]}>
                    {isSelected && (
                      <Icon name="check" size={12} color="#ffffff" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={onShowHistory}
            >
              <Icon name="file-text" size={16} color="#666" />
              <Text style={styles.historyButtonText}>View History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chatButton,
                selectedDocuments.length === 0 && styles.chatButtonDisabled,
              ]}
              onPress={onStartChat}
              disabled={selectedDocuments.length === 0}
            >
              <Icon name="message-circle" size={16} color="#ffffff" />
              <Text style={styles.chatButtonText}>
                Chat ({selectedDocuments.length})
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="file-text" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No Embedded Documents Found</Text>
          <Text style={styles.emptyDescription}>
            You need to upload and embed documents before you can start chatting.
          </Text>
          <TouchableOpacity style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload Documents</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbfc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerAccent: {
    width: 40,
    height: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 26,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  documentsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  documentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  documentCardDefault: {
    borderColor: '#e5e7eb',
  },
  documentCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.15,
  },
  documentContent: {
    flex: 1,
  },
  documentHeader: {
    marginBottom: 8,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  documentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  embeddingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  embeddingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  documentSummary: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 22,
  },
  documentMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  contentType: {
    textTransform: 'capitalize',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxDefault: {
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  historyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  historyButtonText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  chatButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chatButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
  },
  chatButtonText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
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
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default DocumentSelector;