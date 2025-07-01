import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "./utils/authContext"
import LandingPage from "./views/LandingPage"
import LoginScreen from "./views/LoginScreen"
import DashboardScreen from "./views/DashboardScreen"

// Define the navigation param list type
type RootStackParamList = {
    LandingPage: undefined
    LoginScreen: undefined
    Dashboard: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

const App = () => {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="LandingPage">
                        <Stack.Screen name="LandingPage" component={LandingPage} options={{ headerShown: false }} />
                        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
                    </Stack.Navigator>
                </NavigationContainer>
            </AuthProvider>
        </SafeAreaProvider>
    )
}

export default App

