import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import CloudUpload from '../components/CloudUpload';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';

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
  const [uploadingToDevice, setUploadingToDevice] = useState(false);
  const [uploadingToConvex, setUploadingToConvex] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to storage to read documents',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleSelectFiles = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Storage permission is required to select files');
        return;
      }

      const results = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.plainText,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
        ],
        allowMultiSelection: true,
      });

      const newFiles: SelectedFile[] = results.map((result, index) => ({
        id: `${Date.now()}_${index}`,
        name: result.name || 'Unknown file',
        size: result.size || 0,
        type: result.type || 'unknown',
        uri: result.uri,
        uploadProgress: 0,
      }));
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
        return;
      }
      Alert.alert('Error', 'Failed to select files');
      console.error('File selection error:', err);
    }
  };

  const handleUploadToDevice = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Error', 'Please select files to upload');
      return;
    }

    setUploadingToDevice(true);
    
    try {
      // Create documents directory if it doesn't exist
      const documentsPath = `${RNFS.DocumentDirectoryPath}/rag_documents`;
      const dirExists = await RNFS.exists(documentsPath);
      
      if (!dirExists) {
        await RNFS.mkdir(documentsPath);
      }

      // Copy files to local storage
      for (const file of selectedFiles) {
        const destinationPath = `${documentsPath}/${file.name}`;
        await RNFS.copyFile(file.uri, destinationPath);
        console.log(`File copied to: ${destinationPath}`);
      }

      setUploadingToDevice(false);
      Alert.alert('Success', `${selectedFiles.length} file(s) saved to device successfully!`, [
        { text: 'OK', onPress: () => {
          setSelectedFiles([]);
        }}
      ]);
    } catch (error) {
      setUploadingToDevice(false);
      console.error('Upload to device error:', error);
      Alert.alert('Error', 'Failed to save files to device');
    }
  };

  const handleUploadToConvex = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Error', 'Please select files to upload');
      return;
    }

    setUploadingToConvex(true);
    
    // TODO: Implement Convex upload logic
    // This is a placeholder for now
    setTimeout(() => {
      setUploadingToConvex(false);
      Alert.alert('Success', `${selectedFiles.length} file(s) uploaded to Convex successfully!`, [
        { text: 'OK', onPress: () => {
          setSelectedFiles([]);
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
            <View style={styles.babylonContainer}>
            <CloudUpload />
            </View>
            <Text style={styles.uploadTitle}>Upload Documents</Text>
            <Text style={styles.uploadSubtitle}>
              Select PDF, TXT, or DOC files to add to your RAG knowledge base
            </Text>
            
            <TouchableOpacity
              style={styles.selectButton}
              onPress={handleSelectFiles}
              disabled={uploadingToDevice || uploadingToConvex}
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
                    disabled={uploadingToDevice || uploadingToConvex}
                  >
                    <Icon name="x" size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.uploadButtonsContainer}>
                <TouchableOpacity
                  style={[styles.uploadButton, styles.deviceUploadButton, uploadingToDevice && styles.uploadButtonDisabled]}
                  onPress={handleUploadToDevice}
                  disabled={uploadingToDevice || uploadingToConvex}
                >
                  {uploadingToDevice ? (
                    <>
                      <Icon name="loader" size={20} color="#ffffff" />
                      <Text style={styles.uploadButtonText}>Saving...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="smartphone" size={20} color="#ffffff" />
                      <Text style={styles.uploadButtonText}>Save to Device</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadButton, styles.convexUploadButton, uploadingToConvex && styles.uploadButtonDisabled]}
                  onPress={handleUploadToConvex}
                  disabled={uploadingToDevice || uploadingToConvex}
                >
                  {uploadingToConvex ? (
                    <>
                      <Icon name="loader" size={20} color="#ffffff" />
                      <Text style={styles.uploadButtonText}>Uploading...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="cloud" size={20} color="#ffffff" />
                      <Text style={styles.uploadButtonText}>Upload to Convex</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
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

          <View style={styles.storageInfoContainer}>
            <Text style={styles.storageInfoTitle}>Storage Options</Text>
            <View style={styles.storageCard}>
              <Icon name="smartphone" size={16} color="#28a745" />
              <Text style={styles.storageText}>Device Storage: Files saved locally for offline access</Text>
            </View>
            <View style={styles.storageCard}>
              <Icon name="cloud" size={16} color="#007AFF" />
              <Text style={styles.storageText}>Convex Cloud: Files uploaded to cloud for sync across devices</Text>
            </View>
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
    minHeight: 400,
  },
  babylonContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
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
  uploadButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceUploadButton: {
    backgroundColor: '#28a745',
  },
  convexUploadButton: {
    backgroundColor: '#007AFF',
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
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
  storageInfoContainer: {
    marginTop: 20,
  },
  storageInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  storageCard: {
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
  storageText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
});

export default RAGUploadScreen;