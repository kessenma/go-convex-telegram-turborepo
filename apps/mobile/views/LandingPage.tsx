import React from 'react'
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useQuery } from 'convex/react'
import { api } from '../generated-convex'
import { ActionButton, StatCard, StatusIndicator } from '../components'

// Define the navigation param list type
type RootStackParamList = {
    MainTabs: undefined
    LoginScreen: undefined
    AllMessages: undefined
    MessageThreads: undefined
    SendMessage: undefined
    RAGUpload: undefined
    RAGData: undefined
    RAGChat: undefined
    ConnectionGuide: undefined
    OpenConsole: undefined
    Dashboard: undefined
    TelegramManager: undefined
    About: undefined
}

type LandingPageNavigationProp = StackNavigationProp<RootStackParamList>

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

const LandingPage = () => {
    const navigation = useNavigation<LandingPageNavigationProp>();

    // Fetch data from Convex
    const messages = useQuery(api.messages.getAllMessages, { limit: 5 });
    const threadStats = useQuery(api.threads.getThreadStats);
    const documentStats = useQuery(api.documents.getDocumentStats);

    const messageCount = messages?.length || 0;

    const handleNavigation = (screen: keyof RootStackParamList) => {
        navigation.navigate(screen);
    };

    const handleTelegramBotPress = () => {
        const botUsername = process.env.EXPO_PUBLIC_TELEGRAM_BOT_USERNAME || "your_bot_username";
        Linking.openURL(`https://t.me/${botUsername}`);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>RAG Telegram Bot</Text>
                <Text style={styles.heroSubtitle}>View Telegram bot messages and RAG-uploaded documents</Text>
            </View>

            {/* Action Buttons Grid */}
            <View style={styles.buttonGrid}>
                <View style={styles.buttonRow}>
                    <View style={styles.buttonWrapper}>
                        <ActionButton
                            title="View Messages"
                            icon="💬"
                            onPress={() => handleNavigation('AllMessages')}
                        />
                    </View>
                    <View style={styles.buttonWrapper}>
                        <ActionButton
                            title="Browse Threads"
                            icon="💬"
                            onPress={() => handleNavigation('MessageThreads')}
                        />
                    </View>
                </View>
                <View style={styles.buttonRow}>
                    <View style={styles.buttonWrapper}>
                        <ActionButton
                            title="Send Message"
                            icon="📤"
                            onPress={() => handleNavigation('SendMessage')}
                        />
                    </View>
                    <View style={styles.buttonWrapper}>
                        <ActionButton
                            title="RAG Upload"
                            icon="🔍"
                            onPress={() => handleNavigation('RAGUpload')}
                        />
                    </View>
                </View>
            </View>

            {/* Console Button with Status */}
            <View style={styles.consoleButtonContainer}>
                <ActionButton
                    title="Convex Console"
                    icon="⚡"
                    onPress={() => handleNavigation('OpenConsole')}
                />
                <View style={styles.statusContainer}>
                    <StatusIndicator status="connected" size="sm" showLabel={false} />
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                    <View style={styles.statWrapper}>
                        <StatCard
                            title="Messages"
                            value={messageCount.toString()}
                        />
                    </View>
                    <View style={styles.statWrapper}>
                        <StatCard
                            title="Threads"
                            value={(threadStats?.totalThreads || 0).toString()}
                        />
                    </View>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statWrapper}>
                        <StatCard
                            title="Documents"
                            value={(documentStats?.totalDocuments || 0).toString()}
                        />
                    </View>
                    <View style={styles.statWrapper}>
                        <StatCard
                            title="RAG Size"
                            value={formatFileSize(documentStats?.totalSize || 0)}
                        />
                    </View>
                </View>
            </View>

            {/* Bot Username Link */}
            {process.env.EXPO_PUBLIC_TELEGRAM_BOT_USERNAME && (
                <Text style={styles.botInfo}>
                    Bot username:{" "}
                    <Text style={styles.botLink} onPress={handleTelegramBotPress}>
                        t.me/{process.env.EXPO_PUBLIC_TELEGRAM_BOT_USERNAME}
                    </Text>
                </Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f23', // Dark background to match web
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 40,
        minHeight: '100%',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonGrid: {
        width: '100%',
        maxWidth: 400,
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
    },
    buttonWrapper: {
        flex: 1,
    },
    consoleButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 8,
    },
    statusContainer: {
        marginLeft: 8,
    },
    statsGrid: {
        width: '100%',
        maxWidth: 400,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
    },
    statWrapper: {
        flex: 1,
    },
    botInfo: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginTop: -8,
    },
    botLink: {
        color: '#06b6d4', // cyan color
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default LandingPage;