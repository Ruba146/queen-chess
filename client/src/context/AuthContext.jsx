/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import authApi from '../api/auth'

const TOKEN_KEY = 'qc_token'
const USER_KEY = 'qc_user'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  const isAuthenticated = Boolean(token && user)

  const persist = (nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    } else {
      localStorage.removeItem(USER_KEY)
    }
    setToken(nextToken)
    setUser(nextUser)
  }

  /**
   * Fetch the current user from the backend.
   * Backend response format (unchanged):
   *  - login    → { token, user }
   *  - register → { message, token }  (no user object)
   *  - profile  → user object directly
   */
  const fetchCurrentUser = async (authToken = token) => {
    const { data } = await authApi.getCurrentUser()
    // The profile endpoint returns the user object directly.
    const nextUser = data?.user || data
    if (authToken && nextUser) {
      persist(authToken, nextUser)
    }
    return nextUser
  }

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials)
    const nextToken = data.token || data.accessToken || data.jwt
    const nextUser = data.user || null
    persist(nextToken, nextUser)
    if (nextToken && !nextUser) {
      await fetchCurrentUser(nextToken)
    }
    return data
  }

  const register = async (payload) => {
    const { data } = await authApi.register(payload)
    const nextToken = data.token || data.accessToken || data.jwt
    persist(nextToken, data.user || null)
    if (nextToken && !data.user) {
      await fetchCurrentUser(nextToken)
    }
    return data
  }

  const logout = () => {
    // Client-side only: clear storage and context state.
    persist(null, null)
  }

  const restoreSession = async () => {
    setLoading(true)
    try {
      await fetchCurrentUser(token)
    } catch {
      persist(null, null)
    } finally {
      setLoading(false)
    }
  }

  // Restore the user automatically when the app reloads.
  useEffect(() => {
    if (token && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }
    if (token && !user) {
      restoreSession()
      return
    }
     
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      restoreSession,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, loading, isAuthenticated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

export default AuthContext
