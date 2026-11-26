import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { TOKEN_KEY, authApi, errorMessage, setUnauthorizedHandler } from '../services/api'
import type { AuthContextType, User } from '../types'
import { AuthContext } from './auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => localStorage.getItem(TOKEN_KEY) !== null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setAuthError(null)
  }, [])

  const logout = useCallback(() => {
    setSessionExpired(false)
    clearSession()
  }, [clearSession])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (localStorage.getItem(TOKEN_KEY)) setSessionExpired(true)
      clearSession()
    })
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    authApi
      .me()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch((err: unknown) => {
        // A 401 is handled by the interceptor (session cleared); anything else is a load failure.
        if (!cancelled && localStorage.getItem(TOKEN_KEY)) setAuthError(errorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, retryKey])

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await authApi.login(email, password)
    localStorage.setItem(TOKEN_KEY, access_token)
    setSessionExpired(false)
    setAuthError(null)
    setIsLoading(true)
    setToken(access_token)
  }, [])

  const retry = useCallback(() => {
    setAuthError(null)
    setIsLoading(true)
    setRetryKey((k) => k + 1)
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: token !== null,
      isLoading,
      sessionExpired,
      authError,
      login,
      logout,
      retry,
    }),
    [user, token, isLoading, sessionExpired, authError, login, logout, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
