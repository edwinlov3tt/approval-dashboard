import { createContext, useContext, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  )
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user') || 'null')
  )

  const login = async (email) => {
    try {
      // Call API to validate email against approval_participants table
      const response = await api.auth.login(email)

      if (response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          advertiserId: response.user.advertiserId,
          companyName: response.user.companyName,
        }

        setIsAuthenticated(true)
        setUser(userData)
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('user', JSON.stringify(userData))
        return { success: true }
      }

      return { success: false, error: 'Email not found' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message || 'Login failed' }
    }
  }

  // DEV-ONLY: bypass the DB-backed login so the mock-data pages are viewable
  // without a database. Gated on import.meta.env.DEV, so the only call site (the
  // login screen) is dead code in production builds; the inner guard is
  // defense-in-depth in case it is ever invoked from a prod bundle.
  const devLogin = () => {
    if (!import.meta.env.DEV) return
    const userData = {
      id: 0,
      email: 'demo@example.com',
      name: 'Demo User',
      advertiserId: 1,
      companyName: 'Demo Company',
    }
    setIsAuthenticated(true)
    setUser(userData)
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }

    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, devLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
