import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { authRequest, parseNextPath } from '../lib/authApi'
import Icon from '../components/Icons'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden>
      <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022" />
      <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00" />
      <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF" />
      <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900" />
    </svg>
  )
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" fill="currentColor" aria-hidden>
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

const asideFeatures = [
  ['schedule', 'Smart class schedule & free-time insights'],
  ['bus', 'Live bus countdowns for every route'],
  ['dining', 'Real-time dining menus & hours'],
  ['sparkles', 'AI campus assistant, always available'],
]

export default function Login() {
  const { dark, toggleTheme } = useTheme()
  const { user, loading: authLoading, socialProviders, refreshSession } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [tab, setTab] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [remember, setRemember] = useState(false)
  const [pwVisible, setPwVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [banner, setBanner] = useState('')
  const [fieldErr, setFieldErr] = useState({})

  const socialEnabled = (p) => socialProviders.includes(p)

  useEffect(() => {
    if (searchParams.get('error') === 'social') {
      setBanner('Social sign-in failed or was cancelled. Try again or use email.')
    }
  }, [searchParams])

  useEffect(() => {
    if (authLoading) return
    if (user) {
      navigate(parseNextPath(window.location.search), { replace: true })
    }
  }, [authLoading, user, navigate])

  function clearErrors() {
    setBanner('')
    setFieldErr({})
  }

  function socialAuth(provider) {
    if (!socialEnabled(provider)) {
      setBanner(`${provider} sign-in is not configured on this server yet.`)
      return
    }
    window.location.href = `/auth/social/${provider}`
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    clearErrors()
    const em = email.trim()
    if (!em || !em.includes('@')) {
      setFieldErr({ email: 'Enter your email first, then request a reset.' })
      return
    }
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      await authRequest('/api/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email: em, redirectTo }),
      })
      setBanner('If an account exists for that email, check the console or your inbox for reset instructions.')
    } catch (err) {
      setBanner(err.message || 'Could not start password reset.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    clearErrors()
    let valid = true
    const nextErr = {}

    if (tab === 'signup') {
      if (!name.trim()) {
        nextErr.name = 'Please enter your name.'
        valid = false
      }
      if (!email.trim() || !email.includes('@')) {
        nextErr.email = 'Please enter a valid email.'
        valid = false
      }
      if (password.length < 8) {
        nextErr.password = 'Password must be at least 8 characters.'
        valid = false
      }
      if (password !== confirm) {
        nextErr.confirm = 'Passwords do not match.'
        valid = false
      }
    } else {
      if (!email.trim() || !email.includes('@')) {
        nextErr.email = 'Please enter a valid email.'
        valid = false
      }
      if (!password) {
        nextErr.password = 'Please enter your password.'
        valid = false
      }
    }

    if (!valid) {
      setFieldErr(nextErr)
      return
    }

    setSubmitting(true)
    try {
      if (tab === 'signup') {
        await authRequest('/api/auth/sign-up/email', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        })
      } else {
        await authRequest('/api/auth/sign-in/email', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
            rememberMe: remember,
          }),
        })
      }
      await refreshSession()
      navigate(parseNextPath(window.location.search), { replace: true })
    } catch (err) {
      setBanner(err.message || 'Authentication failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isSignup = tab === 'signup'
  const inputBase =
    'w-full py-2.5 px-3.5 rounded-lg border border-[var(--color-border-2)] bg-[var(--color-bg-0)] dark:bg-[var(--color-bg-2)] text-[var(--color-txt-0)] text-sm outline-none transition-shadow focus:border-[var(--color-gold)] focus:shadow-[var(--shadow-glow)] placeholder:text-[var(--color-txt-3)]'

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-1)] text-[var(--color-txt-2)] text-sm">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-1)] text-[var(--color-txt-0)]">
      <div className="flex-1 grid lg:grid-cols-2 min-h-[100vh]">
        <aside className="hidden lg:flex flex-col relative overflow-hidden p-10 bg-gradient-to-br from-[var(--color-gold-dark)] via-[#5c3a00] to-[#2a1800] dark:from-[#1e1000] dark:via-[#2e1800] dark:to-[#1a0e00]">
          <div
            className="absolute -top-[20%] -right-[20%] w-[400px] h-[400px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(207,185,145,0.18) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute -bottom-[10%] -left-[10%] w-[300px] h-[300px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(207,185,145,0.1) 0%, transparent 70%)',
            }}
          />
          <div className="relative flex items-center gap-2.5 mb-auto">
            <span className="bg-[var(--color-gold)] text-[var(--color-gold-dark)] text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide">
              PIH
            </span>
            <span className="text-[15px] font-semibold text-[var(--color-gold)]">Purdue Indy Hub</span>
          </div>
          <div className="relative my-auto">
            <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold tracking-tight text-[var(--color-gold)] leading-tight mb-3">
              Everything campus,
              <br />
              in one place.
            </h2>
            <p className="text-sm text-[var(--color-gold)]/65 leading-relaxed max-w-[320px]">
              Sign in to access your schedule, dining, live transit, events, and your AI campus assistant.
            </p>
          </div>
          <div className="relative flex flex-col gap-2.5 mt-auto">
            {asideFeatures.map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 text-[13px] text-[var(--color-gold)]/75">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-gold)]/12 border border-[var(--color-gold)]/15 flex items-center justify-center text-[var(--color-gold)] shrink-0">
                  <Icon name={icon} size={15} />
                </div>
                {text}
              </div>
            ))}
          </div>
        </aside>

        <main className="flex flex-col items-center justify-center px-6 py-12 relative">
          <div className="absolute top-5 right-5 flex gap-2 items-center">
            <Link
              to="/"
              className="text-[13px] text-[var(--color-txt-1)] px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-2)] no-underline inline-flex items-center gap-1.5"
            >
              <span className="inline-flex rotate-[225deg]">
                <Icon name="arrowUpRight" size={14} />
              </span>
              Back
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-[34px] h-[34px] rounded-lg border border-[var(--color-border-2)] bg-[var(--color-bg-2)] flex items-center justify-center"
              aria-label={dark ? 'Dark mode' : 'Light mode'}
            >
              {dark ? <Icon name="moon" size={16} /> : <Icon name="sun" size={16} />}
            </button>
          </div>

          <div className="w-full max-w-[400px]">
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-5">
                <span className="bg-[var(--color-gold)] text-[var(--color-gold-dark)] text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide">
                  PIH
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-txt-0)] mb-1">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="text-[13px] text-[var(--color-txt-1)]">
                {isSignup
                  ? "Join Purdue Indy Hub — it's free for all students."
                  : 'Sign in to your Purdue Indy Hub account.'}
              </p>
            </div>

            <div className="flex bg-[var(--color-bg-2)] rounded-[10px] p-1 gap-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setTab('signin')
                  clearErrors()
                }}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium border-0 cursor-pointer transition-all ${
                  !isSignup
                    ? 'bg-[var(--color-surface)] text-[var(--color-txt-0)] shadow-sm'
                    : 'bg-transparent text-[var(--color-txt-1)]'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup')
                  clearErrors()
                }}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium border-0 cursor-pointer transition-all ${
                  isSignup
                    ? 'bg-[var(--color-surface)] text-[var(--color-txt-0)] shadow-sm'
                    : 'bg-transparent text-[var(--color-txt-1)]'
                }`}
              >
                Create account
              </button>
            </div>

            {banner && (
              <div className="flex items-start gap-2.5 bg-[var(--color-error)]/10 border border-[var(--color-error)]/25 rounded-lg px-3.5 py-2.5 mb-4 text-[13px] text-[var(--color-error)]">
                <Icon name="close" size={16} className="shrink-0 mt-0.5" />
                <span>{banner}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 mb-5">
              <button
                type="button"
                disabled={!socialEnabled('google')}
                onClick={() => socialAuth('google')}
                className="w-full py-2.5 px-4 rounded-[10px] border border-[var(--color-border-2)] bg-[var(--color-surface)] text-[13px] font-medium flex items-center justify-center gap-2.5 hover:bg-[var(--color-bg-2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GoogleMark />
                Continue with Google
              </button>
              <button
                type="button"
                disabled={!socialEnabled('microsoft')}
                onClick={() => socialAuth('microsoft')}
                className="w-full py-2.5 px-4 rounded-[10px] border border-[var(--color-border-2)] bg-[var(--color-surface)] text-[13px] font-medium flex items-center justify-center gap-2.5 hover:bg-[var(--color-bg-2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MicrosoftMark />
                Continue with Microsoft
              </button>
              <button
                type="button"
                disabled={!socialEnabled('github')}
                onClick={() => socialAuth('github')}
                className="w-full py-2.5 px-4 rounded-[10px] border border-[var(--color-border-2)] bg-[var(--color-surface)] text-[13px] font-medium flex items-center justify-center gap-2.5 hover:bg-[var(--color-bg-2)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-txt-0)]"
              >
                <GitHubMark />
                Continue with GitHub
              </button>
            </div>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex-1 h-px bg-[var(--color-border-2)]" />
              <span className="text-[11px] text-[var(--color-txt-2)] whitespace-nowrap">or continue with email</span>
              <div className="flex-1 h-px bg-[var(--color-border-2)]" />
            </div>

            <form onSubmit={handleSubmit}>
              {isSignup && (
                <div className="mb-4">
                  <label htmlFor="name" className="block text-[12px] font-medium text-[var(--color-txt-1)] mb-1.5">
                    Full name
                  </label>
                  <input
                    id="name"
                    className={`${inputBase} ${fieldErr.name ? 'border-[var(--color-error)]' : ''}`}
                    value={name}
                    onChange={(ev) => setName(ev.target.value)}
                    placeholder="Antonio Segura"
                    autoComplete="name"
                  />
                  {fieldErr.name && (
                    <p className="text-[11px] text-[var(--color-error)] mt-1">{fieldErr.name}</p>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="email" className="block text-[12px] font-medium text-[var(--color-txt-1)] mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className={`${inputBase} ${fieldErr.email ? 'border-[var(--color-error)]' : ''}`}
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="you@purdue.edu"
                  autoComplete="email"
                />
                {fieldErr.email && (
                  <p className="text-[11px] text-[var(--color-error)] mt-1">{fieldErr.email}</p>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-[12px] font-medium text-[var(--color-txt-1)]">
                    Password
                  </label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[12px] text-[var(--color-accent)] bg-transparent border-0 p-0 cursor-pointer hover:opacity-75"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={pwVisible ? 'text' : 'password'}
                    className={`${inputBase} pr-11 ${fieldErr.password ? 'border-[var(--color-error)]' : ''}`}
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    placeholder="••••••••"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setPwVisible((v) => !v)}
                    className="absolute right-0 top-0 h-full px-3.5 border-0 bg-transparent text-[var(--color-txt-2)] hover:text-[var(--color-txt-0)] cursor-pointer flex items-center"
                    title="Show or hide password"
                  >
                    <Icon name={pwVisible ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </div>
                {fieldErr.password && (
                  <p className="text-[11px] text-[var(--color-error)] mt-1">{fieldErr.password}</p>
                )}
              </div>

              {isSignup && (
                <div className="mb-4">
                  <label htmlFor="confirm" className="block text-[12px] font-medium text-[var(--color-txt-1)] mb-1.5">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type={pwVisible ? 'text' : 'password'}
                    className={`${inputBase} ${fieldErr.confirm ? 'border-[var(--color-error)]' : ''}`}
                    value={confirm}
                    onChange={(ev) => setConfirm(ev.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  {fieldErr.confirm && (
                    <p className="text-[11px] text-[var(--color-error)] mt-1">{fieldErr.confirm}</p>
                  )}
                </div>
              )}

              {!isSignup && (
                <div className="flex items-center gap-2.5 mb-5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={remember}
                    onClick={() => setRemember((r) => !r)}
                    className={`w-[17px] h-[17px] rounded-md border border-[var(--color-border-2)] flex items-center justify-center shrink-0 cursor-pointer ${
                      remember ? 'bg-[var(--color-gold-dark)] border-[var(--color-gold-dark)]' : 'bg-[var(--color-bg-0)]'
                    }`}
                  >
                    {remember && <Icon name="check" size={10} className="text-[var(--color-gold)]" strokeWidth={3} />}
                  </button>
                  <span
                    className="text-[12px] text-[var(--color-txt-1)] cursor-pointer select-none"
                    onClick={() => setRemember((r) => !r)}
                  >
                    Remember me for 30 days
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-[10px] border-0 bg-[var(--color-gold-dark)] text-[var(--color-gold)] text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed mb-5"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-[var(--color-gold)]/30 border-t-[var(--color-gold)] rounded-full animate-spin" />
                ) : (
                  <>
                    <Icon name={isSignup ? 'sparkles' : 'home'} size={16} />
                    {isSignup ? 'Create account' : 'Sign in'}
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[13px] text-[var(--color-txt-1)]">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setTab(isSignup ? 'signin' : 'signup')
                  clearErrors()
                }}
                className="text-[var(--color-accent)] font-medium bg-transparent border-0 p-0 cursor-pointer text-[13px] hover:opacity-75"
              >
                {isSignup ? 'Sign in' : 'Sign up free'}
              </button>
            </p>

            {isSignup && (
              <p className="text-[11px] text-[var(--color-txt-2)] text-center leading-relaxed mt-3">
                By creating an account you agree to our{' '}
                <a href="#" className="underline underline-offset-2">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="underline underline-offset-2">
                  Privacy Policy
                </a>
                .
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
