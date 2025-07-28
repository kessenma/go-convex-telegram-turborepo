import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface CloudUploadProps {
  animationEnabled?: boolean;
}

const CloudUpload: React.FC<CloudUploadProps> = ({
  animationEnabled = true,
}) => {
  return (
    <View style={styles.container}>
      <Icon name="cloud" size={80} color="#007AFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
});

export default CloudUpload;