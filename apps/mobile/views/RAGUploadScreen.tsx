import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
// Note: In a real implementation, you would use react-native-document-picker
// For now, we'll simulate file selection

interface SelectedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uri: string;
  uploadProgress: number;
}

const RAGUploadScreen = () => {
  const navigation = useNavigation();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSelectFiles = async () => {
    try {
      // Simulate file selection for demo purposes
      const mockFiles: SelectedFile[] = [
        {
          id: Date.now().toString(),
          name: 'sample-document.pdf',
          size: 1024000, // 1MB
          type: 'application/pdf',
          uri: 'file://sample-document.pdf',
          uploadProgress: 0,
        },
      ];
      
      setSelectedFiles(prev => [...prev, ...mockFiles]);
    } catch (err) {
      Alert.alert('Error', 'Failed to select files');
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Error', 'Please select files to upload');
      return;
    }

    setUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      setUploading(false);
      Alert.alert('Success', 'Files uploaded successfully!', [
        { text: 'OK', onPress: () => {
          setSelectedFiles([]);
          navigation.goBack();
        }}
      ]);
    }, 2000);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RAG Upload</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.uploadContainer}>
          <View style={styles.uploadArea}>
            <Icon name="upload-cloud" size={48} color="#007AFF" />
            <Text style={styles.uploadTitle}>Upload Documents</Text>
            <Text style={styles.uploadSubtitle}>
              Select PDF, TXT, or DOC files to add to your RAG knowledge base
            </Text>
            
            <TouchableOpacity
              style={styles.selectButton}
              onPress={handleSelectFiles}
              disabled={uploading}
            >
              <Icon name="file-plus" size={20} color="#ffffff" />
              <Text style={styles.selectButtonText}>Select Files</Text>
            </TouchableOpacity>
          </View>

          {selectedFiles.length > 0 && (
            <View style={styles.selectedFilesContainer}>
              <Text style={styles.selectedFilesTitle}>Selected Files ({selectedFiles.length})</Text>
              {selectedFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <View style={styles.fileInfo}>
                    <Icon name="file-text" size={20} color="#007AFF" />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFile(index)}
                    style={styles.removeButton}
                    disabled={uploading}
                  >
                    <Icon name="x" size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Icon name="loader" size={20} color="#ffffff" />
                    <Text style={styles.uploadButtonText}>Uploading...</Text>
                  </>
                ) : (
                  <>
                    <Icon name="upload" size={20} color="#ffffff" />
                    <Text style={styles.uploadButtonText}>Upload Files</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Supported Formats</Text>
          
          <View style={styles.formatCard}>
            <Icon name="file-text" size={16} color="#007AFF" />
            <Text style={styles.formatText}>PDF documents (.pdf)</Text>
          </View>

          <View style={styles.formatCard}>
            <Icon name="type" size={16} color="#007AFF" />
            <Text style={styles.formatText}>Text files (.txt)</Text>
          </View>

          <View style={styles.formatCard}>
            <Icon name="file" size={16} color="#007AFF" />
            <Text style={styles.formatText}>Word documents (.doc, .docx)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  uploadContainer: {
    padding: 16,
  },
  uploadArea: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedFilesContainer: {
    marginTop: 20,
  },
  selectedFilesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  fileItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  uploadButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContainer: {
    padding: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  formatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
  formatText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
});

export default RAGUploadScreen;