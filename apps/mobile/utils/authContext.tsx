// apps/mobile/utils/authContext.tsx
"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { loginUser, logoutUser, getCurrentUser, isAuthenticated } from "../api/auth.ts"

type User = {
    id: string
    email: string
    firstName: string
    lastName: string
    token?: string
    accountType?: string
    [key: string]: any
}

type AuthContextType = {
    user: User | null
    loading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    checkAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Check if user is already logged in
        const initAuth = async () => {
            try {
                const currentUser = await getCurrentUser()
                if (currentUser) {
                    setUser(currentUser)
                }
            } catch (err) {
                console.error("Auth initialization error:", err)
            } finally {
                setLoading(false)
            }
        }

        initAuth()
    }, [])

    const login = async (email: string, password: string) => {
        setLoading(true)
        setError(null)
        try {
            const userData = await loginUser(email, password)
            setUser(userData)
        } catch (err: any) {
            setError(err.message || "Login failed")
            throw err
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        setLoading(true)
        try {
            await logoutUser()
            setUser(null)
        } catch (err: any) {
            setError(err.message || "Logout failed")
        } finally {
            setLoading(false)
        }
    }

    const checkAuth = async () => {
        try {
            return await isAuthenticated()
        } catch (err) {
            console.error("Auth check error:", err)
            return false
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                login,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

