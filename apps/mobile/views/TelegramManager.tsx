import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

// Define the navigation param list types
type RootStackParamList = {
    MainTabs: undefined;
    LoginScreen: undefined;
};

type TabParamList = {
    Home: undefined;
    Dashboard: undefined;
    TelegramManager: undefined;
    About: undefined;
};

type TelegramManagerNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'TelegramManager'>,
    StackNavigationProp<RootStackParamList>
>;

// StatCard Component
interface StatCardProps {
    title: string;
    value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    );
};

// ActionButton Component
interface ActionButtonProps {
    title: string;
    icon?: string;
    onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, icon, onPress }) => {
    return (
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
            <Text style={styles.actionButtonText}>{title}</Text>
        </TouchableOpacity>
    );
};

const TelegramManager = () => {
    const navigation = useNavigation<TelegramManagerNavigationProp>();

    // Fetch real data from Convex
    const messages = useQuery(api.messages.getAllMessages, { limit: 5 });
    const messageCount = messages?.length || 0;
    const databaseStatus = messages === undefined ? "Connecting..." : "Connected";
    const botUsername = "your_bot_username"; // This could also come from env or Convex

    const handleViewMessages = () => {
        // TODO: Navigate to messages screen
        console.log('Navigate to messages');
    };

    const handleBrowseThreads = () => {
        // TODO: Navigate to threads screen
        console.log('Navigate to threads');
    };

    const handleSendMessage = () => {
        // TODO: Navigate to send message screen
        console.log('Navigate to send message');
    };

    const handleConvexConsole = () => {
        // TODO: Open Convex console or navigate to console screen
        console.log('Open Convex console');
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
            </View>

            {/* Hero Section */}
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Telegram Bot Manager</Text>
                <Text style={styles.heroSubtitle}>
                    Monitor and manage your Telegram bot messages in real-time
                </Text>
                {botUsername && (
                    <Text style={styles.botInfo}>
                        Bot: <Text style={styles.botLink}>t.me/{botUsername}</Text>
                    </Text>
                )}
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <StatCard 
                    title="Total Messages" 
                    value={messages === undefined ? "Loading..." : messageCount} 
                />
                <StatCard title="Database Status" value={databaseStatus} />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                <ActionButton
                    title="View Messages"
                    icon="💬"
                    onPress={handleViewMessages}
                />
                <ActionButton
                    title="Browse Threads"
                    icon="🧵"
                    onPress={handleBrowseThreads}
                />
                <ActionButton
                    title="Send Message"
                    icon="📤"
                    onPress={handleSendMessage}
                />
                <ActionButton
                    title="Convex Console"
                    icon="⚡"
                    onPress={handleConvexConsole}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    contentContainer: {
        padding: 20,
        paddingTop: 60, // Account for status bar
    },
    header: {
        marginBottom: 20,
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 10,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 10,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 15,
    },
    botInfo: {
        fontSize: 16,
        color: '#333',
    },
    botLink: {
        color: '#007AFF',
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        gap: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    statTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        textAlign: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        fontFamily: 'monospace',
    },
    actionsContainer: {
        gap: 12,
    },
    actionButton: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    buttonIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
});

export default TelegramManager;