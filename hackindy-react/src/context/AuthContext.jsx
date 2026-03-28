import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  authRequest,
  getDisplayName,
  getFirstName,
  getInitials,
} from '../lib/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [socialProviders, setSocialProviders] = useState([])

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
        setSocialProviders(config.socialProviders || [])
      } catch {
        if (!cancelled) {
          setSession(null)
          setSocialProviders([])
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

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      socialProviders,
      refreshSession,
      signOut,
      getInitials: () => getInitials(user?.name, user?.email),
      getDisplayName: () => getDisplayName(user),
      getFirstName: () => getFirstName(user),
    }),
    [session, user, loading, socialProviders, refreshSession, signOut],
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

/** Call from a component inside Router when you need navigate after signOut */
export function useSignOutAndRedirect() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  return useCallback(async () => {
    await signOut()
    navigate('/', { replace: true })
  }, [navigate, signOut])
}
