import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  authRequest,
  getDisplayName,
  getFirstName,
  getInitials,
  startPurdueLink,
} from '../lib/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authConfig, setAuthConfig] = useState({ authProvider: 'local', purdueAuthMode: 'mock' })

  const refreshSession = useCallback(async () => {
    try {
      const data = await authRequest('/api/session')
      setSession(data.session ?? null)
      return data.session ?? null
    } catch {
      setSession(null)
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [sessionData, config] = await Promise.all([
          authRequest('/api/session'),
          authRequest('/api/auth-config'),
        ])
        if (cancelled) return
        setSession(sessionData.session ?? null)
        setAuthConfig(config)
      } catch {
        if (!cancelled) {
          setSession(null)
          setAuthConfig({ authProvider: 'local', purdueAuthMode: 'mock' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const signOut = useCallback(async () => {
    await authRequest('/api/sign-out', { method: 'POST' })
    setSession(null)
  }, [])

  const user = session?.user ?? null
  const onboarding = session?.onboarding ?? {
    linkedSourceCount: 0,
    classCount: 0,
    hasPurdueLinked: false,
    needsPurdueConnection: true,
    needsScheduleSource: false,
  }

  const value = useMemo(
    () => ({
      session,
      user,
      onboarding,
      loading,
      authConfig,
      refreshSession,
      signOut,
      startPurdueLink,
      getInitials: () => getInitials(user?.name, user?.email),
      getDisplayName: () => getDisplayName(user),
      getFirstName: () => getFirstName(user),
    }),
    [session, user, onboarding, loading, authConfig, refreshSession, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export function useSignOutAndRedirect() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  return useCallback(async () => {
    await signOut()
    navigate('/', { replace: true })
  }, [navigate, signOut])
}
