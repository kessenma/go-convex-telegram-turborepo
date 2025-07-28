import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { toast } from '../stores/useToastStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SubMenuItem {
  id: string;
  label: string;
  icon: string;
  screen: string;
  description?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  subItems?: SubMenuItem[];
  screen?: string;
}

type RootStackParamList = {
  Home: undefined;
  Dashboard: undefined;
  TelegramManager: undefined;
  About: undefined;
  // New screens for submenu items
  AllMessages: undefined;
  MessageThreads: undefined;
  SendMessage: undefined;
  RAGUpload: undefined;
  RAGData: undefined;
  RAGChat: undefined;
  OpenConsole: undefined;
  ConnectionGuide: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface ExpandableNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  currentRoute: string;
}

const ExpandableNavigation: React.FC<ExpandableNavigationProps> = ({
  activeTab,
  onTabChange,
  currentRoute,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { setActiveTab } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NavItem | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  // Update active tab based on current route
  useEffect(() => {
    if (currentRoute) {
      // Map route names to main tab categories
      const routeToMainTabMap: { [key: string]: string } = {
        'Home': 'home',
        'AllMessages': 'messages',
        'MessageThreads': 'messages',
        'SendMessage': 'messages',
        'RAGUpload': 'rag',
        'RAGData': 'rag',
        'RAGChat': 'rag',
        'ConnectionGuide': 'console',
        'OpenConsole': 'console',
      };

      const mainTabId = routeToMainTabMap[currentRoute] || 'home';
      onTabChange(mainTabId);
    }
  }, [currentRoute, onTabChange]);

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      screen: 'Home',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: 'message-square',
      subItems: [
        {
          id: 'all-messages',
          label: 'All Messages',
          icon: 'message-circle',
          screen: 'AllMessages',
          description: 'View all telegram messages',
        },
        {
          id: 'message-threads',
          label: 'Message Threads',
          icon: 'message-square',
          screen: 'MessageThreads',
          description: 'Organized message conversations',
        },
        {
          id: 'send-message',
          label: 'Send Message',
          icon: 'send',
          screen: 'SendMessage',
          description: 'Send new telegram message',
        },
      ],
    },
    {
      id: 'rag',
      label: 'RAG',
      icon: 'layers',
      subItems: [
        {
          id: 'rag-upload',
          label: 'Upload',
          icon: 'upload',
          screen: 'RAGUpload',
          description: 'Upload documents for RAG',
        },
        {
          id: 'rag-data',
          label: 'Data',
          icon: 'database',
          screen: 'RAGData',
          description: 'Manage RAG data',
        },
        {
          id: 'rag-chat',
          label: 'Chat',
          icon: 'message-circle',
          screen: 'RAGChat',
          description: 'Chat with RAG system',
        },
      ],
    },
    {
      id: 'console',
      label: 'Console',
      icon: 'terminal',
      subItems: [
        {
          id: 'connection-guide',
          label: 'Connection Guide',
          icon: 'info',
          screen: 'ConnectionGuide',
          description: 'How to connect to console',
        },
        {
          id: 'convex-console',
          label: 'Open Console',
          icon: 'external-link',
          screen: 'OpenConsole',
          description: 'Access Convex dashboard',
        },
      ],
    },
  ];

  const handleTabPress = (item: NavItem) => {
    if (item.subItems && item.subItems.length > 0) {
      setSelectedCategory(item);
      setModalVisible(true);
      showModal();
      // Removed navigation toast notification
    } else if (item.screen) {
      onTabChange(item.id);
      setActiveTab(item.id);
      navigation.navigate(item.screen as keyof RootStackParamList);
      // Removed navigation toast notification
    }
  };

  const handleSubItemPress = (subItem: SubMenuItem) => {
    setModalVisible(false);
    hideModal();
    onTabChange(subItem.id);
    setActiveTab(subItem.id);
    navigation.navigate(subItem.screen as keyof RootStackParamList);
    // Removed navigation toast notification
  };

  const showModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedCategory(null);
    });
  };

  const renderSubMenuItem = (subItem: SubMenuItem, _: number) => (
    <Animated.View
      key={subItem.id}
      style={[
        styles.subMenuItem,
        {
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.subMenuButton}
        onPress={() => handleSubItemPress(subItem)}
        activeOpacity={0.7}
      >
        <View style={styles.subMenuIconContainer}>
          <Icon name={subItem.icon} size={24} color="#007AFF" />
        </View>
        <View style={styles.subMenuTextContainer}>
          <Text style={styles.subMenuTitle}>{subItem.label}</Text>
          {subItem.description && (
            <Text style={styles.subMenuDescription}>{subItem.description}</Text>
          )}
        </View>
        <Icon name="chevron-right" size={16} color="#666" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
        {navItems.map((item) => {
          // Check if this tab should be active based on current route
          const isActive = activeTab === item.id ||
            (item.subItems && item.subItems.some(sub => {
              const routeToSubItemMap: { [key: string]: string } = {
                'AllMessages': 'all-messages',
                'MessageThreads': 'message-threads',
                'SendMessage': 'send-message',
                'RAGUpload': 'rag-upload',
                'RAGData': 'rag-data',
                'RAGChat': 'rag-chat',
                'ConnectionGuide': 'connection-guide',
                'OpenConsole': 'convex-console',
              };
              return routeToSubItemMap[currentRoute] === sub.id;
            }));

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
              onPress={() => handleTabPress(item)}
              activeOpacity={0.7}
            >
              <Icon
                name={item.icon}
                size={20}
                color={isActive ? '#007AFF' : '#666'}
              />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {item.label}
              </Text>
              {item.subItems && (
                <Icon
                  name="chevron-up"
                  size={12}
                  color={isActive ? '#007AFF' : '#666'}
                  style={styles.expandIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={hideModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={hideModal}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Icon
                    name={selectedCategory?.icon || 'menu'}
                    size={24}
                    color="#007AFF"
                  />
                  <Text style={styles.modalTitle}>
                    {selectedCategory?.label}
                  </Text>
                </View>
                <TouchableOpacity onPress={hideModal} style={styles.closeButton}>
                  <Icon name="x" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.subMenuContainer}
                showsVerticalScrollIndicator={false}
              >
                {selectedCategory?.subItems?.map((subItem, index) =>
                  renderSubMenuItem(subItem, index)
                )}
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    position: 'relative',
  },
  activeTabItem: {
    backgroundColor: '#f0f8ff',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 2,
  },
  activeTabLabel: {
    color: '#007AFF',
  },
  expandIcon: {
    position: 'absolute',
    top: 2,
    right: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  subMenuContainer: {
    maxHeight: screenHeight * 0.5,
  },
  subMenuItem: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  subMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  subMenuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subMenuTextContainer: {
    flex: 1,
  },
  subMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  subMenuDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default ExpandableNavigation;