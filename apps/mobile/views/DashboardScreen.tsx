import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useAuth } from "../utils/authContext"
import { useNavigation } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"

// Define the navigation param list type
type RootStackParamList = {
    LandingPage: undefined
    LoginScreen: undefined
    Dashboard: undefined
}

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, "Dashboard">

const DashboardScreen = () => {
    const { user, logout } = useAuth()
    const navigation = useNavigation<DashboardScreenNavigationProp>()

    const handleLogout = async () => {
        try {
            await logout()
            navigation.navigate("LandingPage")
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dashboard</Text>

            <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>
                    Welcome, {user?.firstName} {user?.lastName}!
                </Text>
                <Text style={styles.emailText}>{user?.email}</Text>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#ffffff",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30,
        color: "#333",
    },
    userInfo: {
        backgroundColor: "#f9f9f9",
        padding: 20,
        borderRadius: 10,
        width: "100%",
        alignItems: "center",
        marginBottom: 30,
        borderWidth: 1,
        borderColor: "#eee",
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 8,
        color: "#333",
    },
    emailText: {
        fontSize: 16,
        color: "#666",
    },
    logoutButton: {
        backgroundColor: "#ff8c00",
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    logoutButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
})

export default DashboardScreen

