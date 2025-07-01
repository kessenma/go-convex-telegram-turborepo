import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { SafeAreaProvider } from "react-native-safe-area-context"
import Icon from 'react-native-vector-icons/Feather'
import { AuthProvider } from "./utils/authContext"
import LandingPage from "./views/LandingPage"
import LoginScreen from "./views/LoginScreen"
import DashboardScreen from "./views/DashboardScreen"
import TelegramManager from "./views/TelegramManager"
import AboutScreen from "./views/AboutScreen"

// Define the navigation param list types
type RootStackParamList = {
    MainTabs: undefined
    LoginScreen: undefined
}

type TabParamList = {
    Home: undefined
    Dashboard: undefined
    TelegramManager: undefined
    About: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

// Bottom Tab Navigator Component
const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#666',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#e9ecef',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tab.Screen 
                name="Home" 
                component={LandingPage} 
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen 
                name="Dashboard" 
                component={DashboardScreen} 
                options={{
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="grid" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen 
                name="TelegramManager" 
                component={TelegramManager} 
                options={{
                    tabBarLabel: 'Telegram',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="message-circle" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen 
                name="About" 
                component={AboutScreen} 
                options={{
                    tabBarLabel: 'About',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="info" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    )
}

const App = () => {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="MainTabs">
                        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
                        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
                    </Stack.Navigator>
                </NavigationContainer>
            </AuthProvider>
        </SafeAreaProvider>
    )
}

export default App

