import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useQuery } from 'convex/react';
import { api } from '../generated-convex';

const RAGDataScreen = () => {
  const navigation = useNavigation();
  const documentStats = useQuery(api.documents.getDocumentStats);

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RAG Data</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="database" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{documentStats?.totalDocuments || 0}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="layers" size={24} color="#28a745" />
            <Text style={styles.statNumber}>{documentStats?.totalWords || 0}</Text>
            <Text style={styles.statLabel}>Total Words</Text>
          </View>
        </View>

        <View style={styles.dataContainer}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <View style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Icon name="search" size={20} color="#007AFF" />
              <Text style={styles.actionTitle}>Search Documents</Text>
            </View>
            <Text style={styles.actionDescription}>
              Find and explore documents in your knowledge base
            </Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Search</Text>
              <Icon name="chevron-right" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Icon name="filter" size={20} color="#007AFF" />
              <Text style={styles.actionTitle}>Filter by Type</Text>
            </View>
            <Text style={styles.actionDescription}>
              View documents by file type, upload date, or size
            </Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Filter</Text>
              <Icon name="chevron-right" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Icon name="trash-2" size={20} color="#dc3545" />
              <Text style={styles.actionTitle}>Manage Storage</Text>
            </View>
            <Text style={styles.actionDescription}>
              Delete unused documents and optimize storage space
            </Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={[styles.actionButtonText, styles.errorText]}>Manage</Text>
              <Icon name="chevron-right" size={16} color="#dc3545" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Icon name="upload" size={16} color="#28a745" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Document uploaded</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Icon name="search" size={16} color="#007AFF" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Vector search performed</Text>
              <Text style={styles.activityTime}>5 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Icon name="trash-2" size={16} color="#dc3545" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Document deleted</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dataContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionCard: {
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
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  errorText: {
    color: '#dc3545',
  },
  recentContainer: {
    padding: 16,
  },
  activityCard: {
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
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default RAGDataScreen;