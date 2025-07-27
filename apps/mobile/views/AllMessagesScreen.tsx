import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from 'convex/react';
import { api } from '../generated-convex';

const AllMessagesScreen = () => {
  const navigation = useNavigation();
  const messages = useQuery(api.messages.getAllMessages, { limit: 50 });

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Messages</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="message-circle" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{messages?.length || 0}</Text>
            <Text style={styles.statLabel}>Total Messages</Text>
          </View>
        </View>

        <View style={styles.messagesContainer}>
          <Text style={styles.sectionTitle}>Recent Messages</Text>
          {messages && messages.length > 0 ? (
            messages.slice(0, 10).map((message: { _id?: string; firstName?: string; username?: string; _creationTime?: number; text?: string }, index: number) => (
              <View key={message._id || index} style={styles.messageCard}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageFrom}>
                    {message.firstName || message.username || 'Unknown'}
                  </Text>
                  <Text style={styles.messageTime}>
                    {message._creationTime 
                      ? new Date(message._creationTime).toLocaleDateString()
                      : 'Unknown time'
                    }
                  </Text>
                </View>
                <Text style={styles.messageText} numberOfLines={3}>
                  {message.text || 'No content'}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="message-circle" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No messages found</Text>
              <Text style={styles.emptyStateSubtext}>
                Messages will appear here when they are received
              </Text>
            </View>
          )}
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
  statsContainer: {
    padding: 16,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  messagesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  messageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageFrom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});

export default AllMessagesScreen;