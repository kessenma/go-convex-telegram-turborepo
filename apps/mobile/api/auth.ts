import axios from "axios"
import { StorageUtils } from "./../utils/storage.ts"
import { getApiUrl } from "../config"

// Create axios instance with base URL
const api = axios.create({
    baseURL: getApiUrl(),
    headers: {
        "Content-Type": "application/json",
    },
})

// Add token to requests if available
api.interceptors.request.use(async (config) => {
    const token = StorageUtils.getString("auth_token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    token?: string
    accountType?: string
    [key: string]: any
}

export const loginUser = async (email: string, password: string): Promise<User> => {
    try {
        // First, get CSRF token if your Next.js API requires it
        await axios.get(`${getApiUrl()}/api/auth/csrf`)

        // Then make the login request
        const response = await axios.post(`${getApiUrl()}/api/auth/callback/credentials`, {
            email,
            password,
            redirect: false,
            json: true,
        })

        if (response.data.error) {
            throw new Error(response.data.error)
        }

        // Get the user session
        const session = await axios.get(`${getApiUrl()}/api/auth/session`)

        if (!session.data || !session.data.user) {
            throw new Error("Failed to get user session")
        }

        // Store the token
        const token = session.data.user.token
        if (token) {
            StorageUtils.setString("auth_token", token)
            StorageUtils.setObject("user", session.data.user)
        }

        return session.data.user
    } catch (error: any) {
        console.error("Login error:", error)
        throw error.response?.data || error
    }
}

export const logoutUser = async (): Promise<boolean> => {
    try {
        await axios.post(`${getApiUrl()}/api/auth/signout`)
        StorageUtils.remove("auth_token")
        StorageUtils.remove("user")
        return true
    } catch (error) {
        console.error("Logout error:", error)
        throw error
    }
}

export const getCurrentUser = async (): Promise<User | null> => {
    return StorageUtils.getObject<User>("user")
}

export const isAuthenticated = async (): Promise<boolean> => {
    const token = StorageUtils.getString("auth_token")
    return !!token
}

