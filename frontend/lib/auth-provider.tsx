"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token")
    const storedUser = localStorage.getItem("auth_user")

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        setIsAuthenticated(true)
      } catch (error) {
        // Handle invalid JSON in localStorage
        console.error("Failed to parse user data from localStorage:", error)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
      }
    }

    setLoading(false)
  }, [])

  const login = (newToken: string, userData: User) => {
    setToken(newToken)
    setUser(userData)
    setIsAuthenticated(true)

    // Store in localStorage
    localStorage.setItem("auth_token", newToken)
    localStorage.setItem("auth_user", JSON.stringify(userData))
  }

  const logout = async () => {
    // Call logout API if needed
    if (token) {
      try {
        await fetch("https://s4-dbms-micro-project.onrender.com/api/users/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch (error) {
        console.error("Error during logout:", error)
      }
    }

    // Clear state and localStorage
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")

    // Redirect to login
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {!loading && children}
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

