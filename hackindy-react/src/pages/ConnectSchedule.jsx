import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authRequest } from '../lib/authApi'
import Icon from '../components/Icons'

const sourceConfigs = {
  brightspace: {
    label: 'Brightspace Calendar',
    description: 'Import assignments, exams, labs, and due dates from Brightspace',
    placeholder: 'https://purdue.brightspace.com/d2l/le/calendar/feed/user/feed.ics?token=...',
    helpText: 'Brightspace → Calendar → Subscribe → Copy the iCal feed URL',
    icon: 'document',
  },
  purdue: {
    label: 'Class Schedule',
    description: 'Import your actual class meeting times from Purdue Timetabling',
    placeholder: 'https://timetable.mypurdue.purdue.edu/Timetabling/export?x=...',
    helpText: 'Purdue Timetabling → Export → Personal Schedule → iCalendar',
    icon: 'schedule',
  },
}

export default function ConnectSchedule() {
  const navigate = useNavigate()
  const { onboarding, refreshSession, user } = useAuth()

  const [purdueEmail, setPurdueEmail] = useState('')
  const [linking, setLinking] = useState(false)

  const [icsUrl, setIcsUrl] = useState('')
  const [sourceType, setSourceType] = useState('brightspace')
  const [sources, setSources] = useState([])
  const [saving, setSaving] = useState(false)
  const [autoDetecting, setAutoDetecting] = useState(false)
  const [automationJob, setAutomationJob] = useState(null)
  const handledAutomationId = useRef(null)

  const [banner, setBanner] = useState('')
  const [bannerType, setBannerType] = useState('info')

  const needsPurdueConnection = onboarding?.needsPurdueConnection
  const config = sourceConfigs[sourceType]

  const loadData = useCallback(async () => {
    try {
      const sourceRes = await authRequest('/api/me/sources')
      setSources(sourceRes.sources || [])
    } catch (error) {
      setBannerType('error')
      setBanner(error.message || 'Could not load linked sources.')
    }
  }, [])

  useEffect(() => {
    if (!needsPurdueConnection) loadData()
  }, [loadData, needsPurdueConnection])

  // ── Step 1: Link Purdue ──

  async function handleLinkPurdue(e) {
    e.preventDefault()
    if (!purdueEmail.trim() || !purdueEmail.includes('@')) {
      setBannerType('error')
      setBanner('Please enter a valid Purdue email address.')
      return
    }
    setLinking(true)
    setBanner('')
    try {
      await authRequest('/api/purdue/mock-link', {
        method: 'POST',
        body: JSON.stringify({ email: purdueEmail.trim() }),
      })
      await refreshSession()
      setPurdueEmail('')
      setBannerType('success')
      setBanner('Purdue account linked! You can now connect your calendars.')
    } catch (error) {
      setBannerType('error')
      setBanner(error.message || 'Could not link Purdue account.')
    } finally {
      setLinking(false)
    }
  }

  // ── Step 2: Connect source ──

  const connectSource = useCallback(async (nextUrl = icsUrl) => {
    setBanner('')
    setBannerType('info')
    setSaving(true)
    try {
      const endpoint = sourceType === 'brightspace'
        ? '/api/sources/brightspace/schedule'
        : '/api/sources/purdue/schedule'
      await authRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ icsUrl: nextUrl, label: config.label }),
      })
      setIcsUrl('')
      await refreshSession()
      await loadData()
      setBannerType('success')
      setBanner(sourceType === 'brightspace'
        ? 'Brightspace calendar connected!'
        : 'Class schedule connected!')
    } catch (error) {
      setBannerType('error')
      setBanner(error.message || 'Could not connect this source.')
    } finally {
      setSaving(false)
    }
  }, [config.label, icsUrl, loadData, refreshSession, sourceType])

  async function handleConnect(e) {
    e.preventDefault()
    await connectSource()
  }

  async function handleSync(sourceId) {
    setBanner('')
    try {
      await authRequest(`/api/sync/${sourceId}`, { method: 'POST' })
      await refreshSession()
      await loadData()
      setBannerType('success')
      setBanner('Synced successfully!')
    } catch (error) {
      setBannerType('error')
      setBanner(error.message || 'Could not sync source.')
    }
  }

  async function handleDelete(sourceId) {
    if (!confirm('Delete this source and all its imported items?')) return
    setBanner('')
    try {
      await authRequest(`/api/me/sources/${encodeURIComponent(sourceId)}/remove`, { method: 'POST' })
      await refreshSession()
      await loadData()
      setBannerType('success')
      setBanner('Source deleted.')
    } catch (error) {
      setBannerType('error')
      setBanner(error.message || 'Could not delete source.')
    }
  }

  async function handleAutoDetect() {
    setBanner('')
    setBannerType('info')
    handledAutomationId.current = null
    try {
      const response = await authRequest('/api/purdue/calendar-link/start', { method: 'POST' })
      setAutomationJob(response.job || null)
      setAutoDetecting(true)
    } catch (error) {
      setBannerType('error')
      setBanner(error.message || 'Could not start Purdue timetable automation.')
    }
  }

  async function handleCancelAutoDetect() {
    try {
      await authRequest('/api/purdue/calendar-link/cancel', { method: 'POST' })
      setAutomationJob(null)
      setAutoDetecting(false)
      setBannerType('info')
      setBanner('Automatic Purdue timetable detection cancelled.')
    } catch (error) {
      setBannerType('error')
      setBanner(error.message || 'Could not cancel Purdue timetable automation.')
    }
  }

  useEffect(() => {
    if (!autoDetecting) return undefined
    let cancelled = false
    const poll = window.setInterval(async () => {
      try {
        const response = await authRequest('/api/purdue/calendar-link/status')
        if (cancelled) return
        const job = response.job || null
        setAutomationJob(job)
        if (!job) { setAutoDetecting(false); window.clearInterval(poll); return }
        if (job.status === 'ready' && job.icsUrl && handledAutomationId.current !== job.id) {
          handledAutomationId.current = job.id
          setIcsUrl(job.icsUrl)
          setBannerType('info')
          setBanner('Purdue iCalendar URL captured. Connecting…')
          await connectSource(job.icsUrl)
          setAutomationJob(job)
          setAutoDetecting(false)
          window.clearInterval(poll)
          return
        }
        if (['error', 'cancelled'].includes(job.status)) {
          setAutoDetecting(false)
          setBannerType(job.status === 'error' ? 'error' : 'info')
          setBanner(job.error || job.message || 'Automatic Purdue timetable detection stopped.')
          window.clearInterval(poll)
        }
      } catch (error) {
        if (!cancelled) {
          setAutoDetecting(false)
          setBannerType('error')
          setBanner(error.message || 'Could not poll Purdue timetable automation.')
          window.clearInterval(poll)
        }
      }
    }, 2000)
    return () => { cancelled = true; window.clearInterval(poll) }
  }, [autoDetecting, connectSource])

  // ── Helpers ──

  function getSourceTypeLabel(st) {
    if (st === 'brightspace_ical') return 'Brightspace'
    if (st === 'purdue_schedule_ical') return 'Class Schedule'
    return st
  }

  function getSourceIcon(st) {
    if (st === 'brightspace_ical') return 'document'
    return 'schedule'
  }

  // ── Render ──

  const bannerEl = banner && (
    <div className={`mb-6 card p-4 text-[13px] flex items-start gap-3 ${
      bannerType === 'success' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20' :
      bannerType === 'error' ? 'bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20' :
      'text-[var(--color-txt-1)]'
    }`}>
      <Icon name={bannerType === 'success' ? 'check' : bannerType === 'error' ? 'close' : 'info'} size={16} className="shrink-0 mt-0.5" />
      {banner}
    </div>
  )

  // ────────────────────────────────────────
  // STEP 1 — Link Purdue email
  // ────────────────────────────────────────
  if (needsPurdueConnection) {
    return (
      <div className="max-w-[520px] mx-auto px-6 py-12 pb-24">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-gold)]/15 text-[var(--color-gold)] flex items-center justify-center mx-auto mb-4">
            <Icon name="graduation" size={28} />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Connect your Purdue email</h1>
          <p className="text-[14px] text-[var(--color-txt-2)] mt-2 max-w-[400px] mx-auto">
            Link your Purdue identity so you can import your class schedule and assignments.
          </p>
        </div>

        {bannerEl}

        <div className="card p-6">
          <form onSubmit={handleLinkPurdue}>
            <label htmlFor="purdue-email" className="block text-[13px] font-medium text-[var(--color-txt-1)] mb-2">
              Purdue email address
            </label>
            <input
              id="purdue-email"
              type="email"
              value={purdueEmail}
              onChange={(e) => setPurdueEmail(e.target.value)}
              placeholder="you@purdue.edu"
              className="input w-full px-4 py-3 text-[14px] mb-4"
              autoFocus
            />
            <button
              type="submit"
              disabled={linking || !purdueEmail.trim()}
              className="btn btn-primary w-full text-[14px] px-5 py-3 justify-center disabled:opacity-50"
            >
              <Icon name="graduation" size={16} />
              {linking ? 'Linking…' : 'Link Purdue Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[var(--color-txt-3)] mt-4">
          Signed in as <span className="font-medium text-[var(--color-txt-2)]">{user?.email}</span>
        </p>
      </div>
    )
  }

  // ────────────────────────────────────────
  // STEP 2 — Connect calendar sources
  // ────────────────────────────────────────
  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Connect Your Calendars</h1>
        <p className="text-[14px] text-[var(--color-txt-2)] mt-1">
          Import your assignments and class schedule from Purdue systems.
        </p>
      </div>

      {bannerEl}

      {/* Connected Sources */}
      {sources.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[12px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-3">
            Connected Sources
          </h2>
          <div className="space-y-3">
            {sources.map((source) => (
              <div key={source.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    source.sourceType === 'brightspace_ical'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-[var(--color-gold)]/15 text-[var(--color-gold)]'
                  }`}>
                    <Icon name={getSourceIcon(source.sourceType)} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-txt-0)]">{source.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        source.status === 'ready'
                          ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                          : source.status === 'error'
                          ? 'bg-[var(--color-error)]/15 text-[var(--color-error)]'
                          : 'bg-[var(--color-txt-3)]/15 text-[var(--color-txt-2)]'
                      }`}>
                        {source.status}
                      </span>
                    </div>
                    <div className="text-[12px] text-[var(--color-txt-2)] mt-0.5">
                      {getSourceTypeLabel(source.sourceType)}
                      {source.lastSyncedAt && (
                        <span> · Synced {new Date(source.lastSyncedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    {source.lastError && (
                      <div className="text-[12px] text-[var(--color-error)] mt-1">{source.lastError}</div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => handleSync(source.id)} className="btn btn-secondary text-[12px] px-3 py-1.5">
                      Sync
                    </button>
                    <button type="button" onClick={() => handleDelete(source.id)} className="btn text-[12px] px-3 py-1.5 text-[var(--color-error)] hover:bg-[var(--color-error)]/10">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Source */}
      <div className="card p-6">
        <h2 className="text-[16px] font-semibold text-[var(--color-txt-0)] mb-4">
          Add Calendar Source
        </h2>

        {/* Source Type Toggle */}
        <div className="mb-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSourceType('brightspace')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                sourceType === 'brightspace'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-2)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  sourceType === 'brightspace'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  <Icon name="document" size={16} />
                </div>
                <span className="font-medium text-[var(--color-txt-0)]">Brightspace</span>
              </div>
              <p className="text-[12px] text-[var(--color-txt-2)]">
                Assignments, exams, labs, due dates
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('purdue')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                sourceType === 'purdue'
                  ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-2)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  sourceType === 'purdue'
                    ? 'bg-[var(--color-gold)] text-[var(--color-gold-dark)]'
                    : 'bg-[var(--color-gold)]/15 text-[var(--color-gold)]'
                }`}>
                  <Icon name="schedule" size={16} />
                </div>
                <span className="font-medium text-[var(--color-txt-0)]">Class Schedule</span>
              </div>
              <p className="text-[12px] text-[var(--color-txt-2)]">
                Class meeting times from Purdue Timetabling
              </p>
            </button>
          </div>
        </div>

        {/* Auto-detect (purdue only) */}
        {sourceType === 'purdue' && (
          <div className="mb-5 p-4 rounded-xl bg-[var(--color-bg-2)] border border-[var(--color-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-[14px] font-medium text-[var(--color-txt-0)]">
                  Detect schedule automatically
                </div>
                <p className="text-[12px] text-[var(--color-txt-2)] mt-1">
                  Opens a browser, waits for Purdue login and Duo, then captures the iCalendar URL.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  disabled={autoDetecting || saving}
                  className="btn btn-secondary text-[12px] px-4 py-2 disabled:opacity-50"
                >
                  <Icon name="sparkles" size={14} />
                  {autoDetecting ? 'Watching Purdue…' : 'Auto-detect URL'}
                </button>
                {autoDetecting && (
                  <button type="button" onClick={handleCancelAutoDetect} className="btn btn-ghost text-[12px] px-4 py-2">
                    Cancel
                  </button>
                )}
              </div>
            </div>
            {automationJob?.message && (
              <div className="text-[12px] text-[var(--color-txt-2)] mt-3">{automationJob.message}</div>
            )}
          </div>
        )}

        {/* URL Input Form */}
        <form onSubmit={handleConnect}>
          <div className="mb-4">
            <label className="block text-[12px] font-medium text-[var(--color-txt-1)] mb-1.5">
              iCalendar Feed URL
            </label>
            <textarea
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              className="input w-full px-4 py-3 text-[13px] min-h-[100px] resize-y font-mono"
              placeholder={config.placeholder}
              required
            />
            <p className="text-[11px] text-[var(--color-txt-3)] mt-1.5">
              {config.helpText}
            </p>
          </div>
          <button
            type="submit"
            disabled={!icsUrl.trim() || saving}
            className="btn btn-primary text-[13px] px-5 py-2.5 disabled:opacity-50"
          >
            <Icon name={config.icon} size={15} />
            {saving ? 'Connecting…' : `Connect ${sourceType === 'brightspace' ? 'Brightspace' : 'Schedule'}`}
          </button>
        </form>
      </div>

      {/* Footer links */}
      <div className="mt-6 flex items-center justify-between text-[13px]">
        <div className="flex gap-4">
          <Link to="/assignments" className="text-[var(--color-accent)] hover:underline flex items-center gap-1">
            <Icon name="document" size={14} />
            View Tasks
          </Link>
          <Link to="/schedule" className="text-[var(--color-accent)] hover:underline flex items-center gap-1">
            <Icon name="schedule" size={14} />
            View Schedule
          </Link>
        </div>
        <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary text-[13px] px-4 py-2">
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
