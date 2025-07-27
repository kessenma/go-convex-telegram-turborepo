import React, { useState, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "./utils/authContext"
import { ConvexClientProvider } from "./providers/ConvexClientProvider"
import { ClientOnlyProvider } from "./providers/ClientOnlyProvider"
// import { HealthCheckProvider } from "./providers/health-check-provider" // Removed - causing connection issues
import { SessionProvider } from "./providers/SessionProvider"
import { MessageNotificationProvider } from "./providers/MessageNotificationProvider"
import ToastContainer from './components/Toast';
import LandingPage from "./views/LandingPage"
import LoginScreen from "./views/LoginScreen"
import DashboardScreen from "./views/DashboardScreen"
import TelegramManager from "./views/TelegramManager"
import AboutScreen from "./views/AboutScreen"
import ExpandableNavigation from "./components/ExpandableNavigation"
import AllMessagesScreen from "./views/AllMessagesScreen"
import MessageThreadsScreen from "./views/MessageThreadsScreen"
import SendMessageScreen from "./views/SendMessageScreen"
import RAGUploadScreen from "./views/RAGUploadScreen"
import RAGDataScreen from "./views/RAGDataScreen"
import RAGChatScreen from "./views/RAGChatScreen"
import ConnectionGuideScreen from "./views/ConnectionGuideScreen"
import OpenConsoleScreen from "./views/OpenConsoleScreen"

// Define the navigation param list types
type RootStackParamList = {
    Home: undefined
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

const Stack = createStackNavigator<RootStackParamList>()

// Main App Content with Navigation
interface AppContentProps {
    currentRoute: string;
}

const AppContent: React.FC<AppContentProps> = ({ currentRoute }) => {
    const [activeTab, setActiveTab] = useState('home');

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
    };

    // Screens that should hide the bottom navigation
    const screensWithoutNavigation = ['LoginScreen'];
    const shouldShowNavigation = !screensWithoutNavigation.includes(currentRoute);

    return (
        <View style={styles.container}>
            <View style={[styles.content, !shouldShowNavigation && styles.contentFullHeight]}>
                <Stack.Navigator 
                    initialRouteName="Home"
                    screenOptions={{ headerShown: false }}
                >
                    <Stack.Screen name="Home" component={LandingPage} />
                    <Stack.Screen name="LoginScreen" component={LoginScreen} />
                    <Stack.Screen name="AllMessages" component={AllMessagesScreen} />
                    <Stack.Screen name="MessageThreads" component={MessageThreadsScreen} />
                    <Stack.Screen name="SendMessage" component={SendMessageScreen} />
                    <Stack.Screen name="RAGUpload" component={RAGUploadScreen} />
                    <Stack.Screen name="RAGData" component={RAGDataScreen} />
                    <Stack.Screen name="RAGChat" component={RAGChatScreen} />
                    <Stack.Screen name="ConnectionGuide" component={ConnectionGuideScreen} />
                    <Stack.Screen name="OpenConsole" component={OpenConsoleScreen} />
                    <Stack.Screen name="Dashboard" component={DashboardScreen} />
                    <Stack.Screen name="TelegramManager" component={TelegramManager} />
                    <Stack.Screen name="About" component={AboutScreen} />
                </Stack.Navigator>
            </View>
            {shouldShowNavigation && (
                <ExpandableNavigation
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    currentRoute={currentRoute}
                />
            )}
        </View>
    );
}



const App = () => {
    const [currentRoute, setCurrentRoute] = useState('Home');

    return (
        <SafeAreaProvider>
            <ConvexClientProvider>
                <ClientOnlyProvider>
                    <SessionProvider>
                        <MessageNotificationProvider>
                            <AuthProvider>
                                <NavigationContainer
                                    onStateChange={(state) => {
                                        if (state && state.routes && state.routes.length > 0 && state.index !== undefined) {
                                            const currentRouteName = state.routes[state.index].name;
                                            setCurrentRoute(currentRouteName);
                                        }
                                    }}
                                >
                                    <AppContent currentRoute={currentRoute} />
                                </NavigationContainer>
                                <ToastContainer />
                            </AuthProvider>
                        </MessageNotificationProvider>
                    </SessionProvider>
                </ClientOnlyProvider>
            </ConvexClientProvider>
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingBottom: 80, // Space for bottom navigation
  },
  contentFullHeight: {
    paddingBottom: 0, // No space needed when navigation is hidden
  },
});

export default App

