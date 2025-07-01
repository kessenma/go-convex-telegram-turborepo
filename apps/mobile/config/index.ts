// apps/mobile/config/index.ts
import { Platform } from "react-native"

// Get the environment from NODE_ENV
const environment = process.env.NODE_ENV || "development"

// Function to get the API URL based on environment and platform
export const getApiUrl = (): string => {
    if (environment === "development") {
        // For iOS simulator, we need to use localhost
        if (Platform.OS === "ios") {
            return "http://localhost:3000"
        }
        // For Android emulator, we need to use 10.0.2.2 (special IP that connects to host loopback)
        else if (Platform.OS === "android") {
            return "http://10.0.2.2:3000"
        }
    }

    // Production environment
    if (environment === "production") {
        return "https://medflow.cloud"
    }

    // Staging environment
    if (environment === "staging") {
        return "https://stage.medflow.cloud"
    }

    // Default fallback
    return "http://localhost:3000"
}

// Export other configuration values
export const APP_CONFIG = {
    API_URL: getApiUrl(),
    APP_NAME: "MedFlow",
    VERSION: "1.0.0",
}

