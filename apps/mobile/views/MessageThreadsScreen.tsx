import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from 'convex/react';
import { api } from '../generated-convex';

const MessageThreadsScreen = () => {
  const navigation = useNavigation();
  const threadStats = useQuery(api.threads.getThreadStats);

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Threads</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="message-square" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{threadStats?.totalThreads || 0}</Text>
            <Text style={styles.statLabel}>Active Threads</Text>
          </View>
        </View>

        <View style={styles.threadsContainer}>
          <Text style={styles.sectionTitle}>Thread Management</Text>
          
          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Icon name="users" size={20} color="#007AFF" />
              <Text style={styles.featureTitle}>Group Conversations</Text>
            </View>
            <Text style={styles.featureDescription}>
              Organize messages by conversation groups and participants
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Icon name="clock" size={20} color="#007AFF" />
              <Text style={styles.featureTitle}>Thread History</Text>
            </View>
            <Text style={styles.featureDescription}>
              View chronological message threads and conversation flow
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Icon name="search" size={20} color="#007AFF" />
              <Text style={styles.featureTitle}>Search Threads</Text>
            </View>
            <Text style={styles.featureDescription}>
              Find specific conversations and message threads quickly
            </Text>
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
  threadsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featureCard: {
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
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default MessageThreadsScreen;