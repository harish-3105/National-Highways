import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../../types'
import { apiClient } from '../api/client'
import { toast } from 'react-toastify'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  login: async () => undefined,
  logout: () => undefined,
  isLoading: true,
}

const AuthContext = createContext<AuthContextType>(defaultAuthContext)

export const useAuth = () => {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth on mount
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }

    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.login(username, password)

      if (response?.success && response?.data) {
        const { token: authToken, user: userData } = response.data

        localStorage.setItem('auth_token', authToken)
        localStorage.setItem('user', JSON.stringify(userData))

        setToken(authToken)
        setUser(userData)

        toast.success('Login successful!')
        return
      }

      throw new Error(response?.message || 'Login failed')
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    toast.info('Logged out successfully')
  }

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
