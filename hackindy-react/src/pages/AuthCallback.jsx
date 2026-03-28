import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { parseNextPath } from '../lib/authApi'

const EXCHANGE_PROMISE_KEY = '__pihSupabaseExchangePromise'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshSession } = useAuth()
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const handleCallback = async () => {
      try {
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (errorParam) {
          throw new Error(errorDescription || errorParam)
        }

        const code = searchParams.get('code')
        const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
        const hashParams = new URLSearchParams(hash)
        const hashLooksLikeAuth = Boolean(
          hashParams.get('access_token') || hashParams.get('refresh_token') || hashParams.get('type'),
        )

        if (code) {
          const w = window
          try {
            w[EXCHANGE_PROMISE_KEY] ??= supabase.auth.exchangeCodeForSession(window.location.href)
            const { data, error: exchangeError } = await w[EXCHANGE_PROMISE_KEY]
            if (exchangeError) throw exchangeError
            if (!data?.session) throw new Error('Sign-in did not return a session. Try again from the login page.')
          } finally {
            delete w[EXCHANGE_PROMISE_KEY]
          }
        } else if (hashLooksLikeAuth) {
          await new Promise((r) => requestAnimationFrame(() => r()))
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) throw sessionError
          if (!session) {
            throw new Error(
              'Could not read the session from this link. Confirm Supabase redirect URL matches this app (e.g. http://localhost:5173/auth/callback).',
            )
          }
        } else {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) throw sessionError
          if (!session) {
            throw new Error(
              'No authorization code or session found. Add this URL under Supabase Authentication → URL configuration → Redirect URLs.',
            )
          }
        }

        if (cancelled) return

        await refreshSession()
        try {
          const u = new URL(window.location.href)
          u.hash = ''
          u.searchParams.delete('code')
          const qs = u.searchParams.toString()
          window.history.replaceState({}, document.title, `${u.pathname}${qs ? `?${qs}` : ''}`)
        } catch {
          /* ignore */
        }
        navigate(parseNextPath(window.location.search), { replace: true })
      } catch (err) {
        console.error('Auth callback error:', err)
        if (!cancelled) {
          setError(err.message || 'Authentication failed.')
          setTimeout(() => {
            navigate('/login?error=oauth-error', { replace: true })
          }, 2800)
        }
      }
    }

    void handleCallback()
    return () => {
      cancelled = true
    }
  }, [navigate, refreshSession, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-1)]">
        <div className="text-center max-w-md px-6">
          <div className="text-[var(--color-error)] mb-2">Authentication failed</div>
          <div className="text-[var(--color-txt-2)] text-sm">{error}</div>
          <div className="text-[var(--color-txt-3)] text-xs mt-2">Redirecting to login…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-1)]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="text-[var(--color-txt-1)]">Completing sign in…</div>
      </div>
    </div>
  )
}
