/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'

/**
 * Global application context.
 * Holds only generic UI + auth state for the foundation.
 * Feature-specific state should live in dedicated contexts as pages are built.
 */
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark')
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      user,
      setUser,
      isAuthenticated,
      setIsAuthenticated,
    }),
    [theme, user, isAuthenticated],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return ctx
}

export default AppContext
