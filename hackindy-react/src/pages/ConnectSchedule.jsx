import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authRequest } from '../lib/authApi'
import Icon from '../components/Icons'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_CODES = {
  Monday: 'M',
  Tuesday: 'T',
  Wednesday: 'W',
  Thursday: 'Th',
  Friday: 'F',
}

function getDayName(dateValue) {
  return new Date(dateValue).toLocaleDateString(undefined, { weekday: 'long' })
}

function getTimeRange(startTime, endTime) {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : null
  const startLabel = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const endLabel = end ? end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
  return endLabel ? `${startLabel} – ${endLabel}` : startLabel
}

function getPatternLabel(days) {
  const normalized = [...new Set(days)].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
  const compact = normalized.map((day) => DAY_CODES[day] || day.slice(0, 1)).join('')

  const knownPatterns = {
    MWF: 'MWF',
    MW: 'MW',
    MF: 'MF',
    WF: 'WF',
    TTh: 'TTh',
    T: 'T',
    Th: 'Th',
    W: 'W',
    F: 'F',
    MTWThF: 'MTWThF',
  }

  return knownPatterns[compact] || compact
}

function getWeeklyPreview(items) {
  const seen = new Map()
  const seriesDays = new Map()

  for (const item of items || []) {
    const day = getDayName(item.startTime)
    if (!DAYS.includes(day)) continue

    const start = new Date(item.startTime)
    const end = item.endTime ? new Date(item.endTime) : null
    const key = [
      day,
      item.title,
      item.description || '',
      item.location || '',
      start.getHours(),
      start.getMinutes(),
      end?.getHours() || '',
      end?.getMinutes() || '',
    ].join('|')
    const seriesKey = [
      item.title,
      item.description || '',
      item.location || '',
    ].join('|')

    const existingDays = seriesDays.get(seriesKey) || new Set()
    existingDays.add(day)
    seriesDays.set(seriesKey, existingDays)

    if (!seen.has(key)) {
      seen.set(key, {
        id: key,
        seriesKey,
        title: item.title,
        description: item.description || 'Class meeting',
        location: item.location,
        day,
        time: getTimeRange(item.startTime, item.endTime),
      })
    }
  }

  return [...seen.values()]
    .map((item) => ({
      ...item,
      pattern: getPatternLabel(seriesDays.get(item.seriesKey) || [item.day]),
    }))
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.time.localeCompare(b.time))
    .slice(0, 5)
}

export default function ConnectSchedule() {
  const navigate = useNavigate()
  const { onboarding, refreshSession, startPurdueLink, user } = useAuth()
  const [icsUrl, setIcsUrl] = useState('')
  const [label, setLabel] = useState('My Purdue Schedule')
  const [sources, setSources] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [autoDetecting, setAutoDetecting] = useState(false)
  const [automationJob, setAutomationJob] = useState(null)
  const [banner, setBanner] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const handledAutomationId = useRef(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [sourceRes, classRes] = await Promise.all([
        authRequest('/api/me/sources'),
        authRequest('/api/me/classes?limit=500&mode=chronological'),
      ])
      setSources(sourceRes.sources || [])
      setClasses(classRes.items || [])
    } catch (error) {
      setBanner(error.message || 'Could not load linked sources.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleConnect(e) {
    e.preventDefault()
    await connectScheduleUrl(icsUrl)
  }

  const connectScheduleUrl = useCallback(async (sourceUrl) => {
    setBanner('')
    setSaving(true)
    try {
      await authRequest('/api/sources/purdue/schedule', {
        method: 'POST',
        body: JSON.stringify({ icsUrl: sourceUrl, label }),
      })
      setIcsUrl(sourceUrl || '')
      await refreshSession()
      await loadData()
      setBanner('Purdue schedule connected and synced successfully.')
    } catch (error) {
      setBanner(error.message || 'Could not connect this schedule source.')
    } finally {
      setSaving(false)
    }
  }, [label, refreshSession, loadData])

  async function handleAutoDetect() {
    setBanner('')
    handledAutomationId.current = null
    try {
      const response = await authRequest('/api/purdue/calendar-link/start', {
        method: 'POST',
      })
      setAutomationJob(response.job || null)
      setAutoDetecting(true)
    } catch (error) {
      setBanner(error.message || 'Could not start Purdue timetable automation.')
    }
  }

  async function handleCancelAutoDetect() {
    try {
      await authRequest('/api/purdue/calendar-link/cancel', { method: 'POST' })
      setAutomationJob(null)
      setAutoDetecting(false)
      setBanner('Automatic Purdue schedule detection cancelled.')
    } catch (error) {
      setBanner(error.message || 'Could not cancel Purdue timetable automation.')
    }
  }

  async function handleSync(sourceId) {
    setBanner('')
    try {
      await authRequest(`/api/sync/${sourceId}`, { method: 'POST' })
      await refreshSession()
      await loadData()
      setBanner('Schedule synced.')
    } catch (error) {
      setBanner(error.message || 'Could not sync source.')
    }
  }

  async function confirmRemoveSource(source) {
    setPendingDeleteId(null)
    setBanner('')
    setDeletingId(source.id)
    try {
      await authRequest(`/api/me/sources/${encodeURIComponent(source.id)}/remove`, { method: 'POST' })
      await refreshSession()
      await loadData()
      setBanner('Schedule source removed.')
    } catch (error) {
      setBanner(error.message || 'Could not remove this source.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleLinkPurdue() {
    setLinking(true)
    startPurdueLink('/setup')
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

        if (!job) {
          setAutoDetecting(false)
          window.clearInterval(poll)
          return
        }

        if (job.status === 'ready' && job.icsUrl && handledAutomationId.current !== job.id) {
          handledAutomationId.current = job.id
          setIcsUrl(job.icsUrl)
          setBanner('Purdue iCalendar URL captured. Connecting your schedule...')
          await connectScheduleUrl(job.icsUrl)
          setAutoDetecting(false)
          window.clearInterval(poll)
          return
        }

        if (['error', 'cancelled'].includes(job.status)) {
          setAutoDetecting(false)
          setBanner(job.error || job.message || 'Automatic Purdue schedule detection stopped.')
          window.clearInterval(poll)
        }
      } catch (error) {
        if (!cancelled) {
          setAutoDetecting(false)
          setBanner(error.message || 'Could not poll Purdue timetable automation.')
          window.clearInterval(poll)
        }
      }
    }, 2000)

    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [autoDetecting, connectScheduleUrl])

  const needsPurdueConnection = onboarding?.needsPurdueConnection
  const hasLinkedPurdue = onboarding?.hasPurdueLinked
  const previewClasses = useMemo(() => getWeeklyPreview(classes), [classes])

  return (
    <div className="max-w-[960px] mx-auto px-6 py-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Set up your Purdue connection</h1>
        <p className="text-[14px] text-[var(--color-txt-2)] mt-1 max-w-[720px]">
          Start with a normal app account, then link Purdue inside the product. Once Purdue is linked, you can connect the personal iCalendar export from Purdue Timetabling and sync your classes into the dashboard.
        </p>
      </div>

      {banner && (
        <div className="mb-4 card p-4 text-[13px] text-[var(--color-txt-1)]">
          {banner}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4 mb-6">
        <div className="card p-5">
          <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-4">
            Step 1: Link Purdue
          </div>
          {needsPurdueConnection ? (
            <>
              <p className="text-[13px] text-[var(--color-txt-1)] leading-relaxed">
                Your local app account is active as <span className="font-medium text-[var(--color-txt-0)]">{user?.email}</span>. Link your Purdue identity next so the app can allow Purdue-specific sources like timetable feeds.
              </p>
              <button
                type="button"
                onClick={handleLinkPurdue}
                disabled={linking}
                className="btn btn-primary text-[13px] px-5 py-2.5 mt-4 disabled:opacity-50"
              >
                <Icon name="graduation" size={15} />
                {linking ? 'Redirecting…' : 'Link Purdue account'}
              </button>
            </>
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface)]">
              <div className="text-[14px] font-medium text-[var(--color-txt-0)]">Purdue account linked</div>
              <div className="text-[12px] text-[var(--color-txt-2)] mt-1">
                {user?.purdueEmail || 'Purdue identity connected'}
              </div>
              <p className="text-[13px] text-[var(--color-txt-1)] mt-3 leading-relaxed">
                You can now attach Purdue-owned data sources that you explicitly provide, starting with the Purdue Timetabling iCalendar export.
              </p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-4">
            Purdue steps
          </div>
          <ol className="space-y-3 text-[13px] text-[var(--color-txt-1)] leading-relaxed list-decimal pl-5">
            <li>Create or sign in to your normal HackIndy account.</li>
            <li>Link your Purdue identity from this setup screen.</li>
            <li>Open Purdue Timetabling and copy your Personal Schedule iCalendar export URL.</li>
            <li>Paste that URL here to sync classes into the app.</li>
          </ol>
          <div className="mt-5 pt-4 border-t border-[var(--color-border)] space-y-2">
            <div className="text-[12px] text-[var(--color-txt-2)]">
              Purdue linked: <span className="font-medium text-[var(--color-txt-1)]">{hasLinkedPurdue ? 'Yes' : 'No'}</span>
            </div>
            <div className="text-[12px] text-[var(--color-txt-2)]">
              Connected sources: <span className="font-medium text-[var(--color-txt-1)]">{onboarding.linkedSourceCount}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary text-[13px] px-4 py-2 mt-1"
            >
              <Icon name="arrowUpRight" size={14} />
              Go to dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">
              Step 2: Connect Purdue timetable iCal
            </div>
            <button type="button" onClick={loadData} className="btn btn-ghost text-[12px] px-3 py-1.5">
              Refresh
            </button>
          </div>

          {needsPurdueConnection ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 bg-[var(--color-bg-2)] text-[13px] text-[var(--color-txt-2)] leading-relaxed">
              Link your Purdue account first. After that, this form will unlock and let you attach your Purdue Timetabling iCalendar feed.
            </div>
          ) : (
            <form onSubmit={handleConnect}>
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-2)] p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-medium text-[var(--color-txt-0)]">Detect from Purdue automatically</div>
                      <div className="text-[12px] text-[var(--color-txt-2)] mt-1">
                        Runs on the machine where the API server runs: opens a visible browser, waits for Purdue login and Duo, then
                        watches UniTime for Export → Export iCalendar. If this fails, run <code className="text-[11px]">npm run playwright:install</code>{' '}
                        in the repo root once to install Chromium.
                      </div>
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
                        <button
                          type="button"
                          onClick={handleCancelAutoDetect}
                          className="btn btn-ghost text-[12px] px-4 py-2"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  {automationJob?.message && (
                    <div className="text-[12px] text-[var(--color-txt-2)] mt-3">
                      {automationJob.message}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[var(--color-txt-1)] mb-1.5">
                    Source label
                  </label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="input w-full px-4 py-3 text-[14px]"
                    placeholder="My Purdue Schedule"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[var(--color-txt-1)] mb-1.5">
                    iCalendar URL
                  </label>
                  <textarea
                    value={icsUrl}
                    onChange={(e) => setIcsUrl(e.target.value)}
                    className="input w-full px-4 py-3 text-[13px] min-h-[140px] resize-y"
                    placeholder="Paste the Purdue Timetabling iCalendar export URL here"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!icsUrl.trim() || saving}
                  className="btn btn-primary text-[13px] px-5 py-2.5 disabled:opacity-50"
                >
                  <Icon name="calendar" size={15} />
                  {saving ? 'Connecting…' : 'Connect schedule'}
                </button>
              </div>
            </form>
          )}

          {!loading && sources.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[var(--color-border)] space-y-3">
              {sources.map((source) => (
                <div key={source.id} className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-medium text-[var(--color-txt-0)]">{source.label}</div>
                      <div className="text-[12px] text-[var(--color-txt-2)] mt-1 break-all">{source.sourceUrl}</div>
                    </div>
                    <span className="badge">{source.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between mt-3 text-[12px] text-[var(--color-txt-2)] gap-2">
                    <span>{source.lastSyncedAt ? `Last synced ${new Date(source.lastSyncedAt).toLocaleString()}` : 'Never synced'}</span>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleSync(source.id)} className="btn btn-secondary text-[12px] px-3 py-1.5">
                        Sync now
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId((cur) => (cur === source.id ? null : source.id))}
                        disabled={deletingId === source.id}
                        className="btn btn-ghost text-[12px] px-3 py-1.5 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {pendingDeleteId === source.id && (
                    <div className="mt-3 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3 py-2.5 text-[12px] text-[var(--color-txt-1)]">
                      <p className="mb-2">Remove this feed and all classes imported from it?</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void confirmRemoveSource(source)}
                          disabled={deletingId === source.id}
                          className="btn btn-secondary text-[12px] px-3 py-1.5 bg-[var(--color-error)]/15 text-[var(--color-error)] border-[var(--color-error)]/30 hover:bg-[var(--color-error)]/25 disabled:opacity-50"
                        >
                          {deletingId === source.id ? 'Removing…' : 'Yes, remove'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          disabled={deletingId === source.id}
                          className="btn btn-ghost text-[12px] px-3 py-1.5 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {source.lastError && (
                    <div className="mt-2 text-[12px] text-[var(--color-error)]">{source.lastError}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-4">
            Synced class preview
          </div>
          {loading ? (
            <div className="text-[13px] text-[var(--color-txt-2)]">Loading classes…</div>
          ) : previewClasses.length === 0 ? (
            <div className="text-[13px] text-[var(--color-txt-2)]">
              {needsPurdueConnection
                ? 'No classes yet. Link Purdue first, then connect your schedule feed.'
                : 'No classes synced yet. Connect an iCal feed to populate this preview.'}
            </div>
          ) : (
            <div className="space-y-3">
              {previewClasses.map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[14px] font-medium text-[var(--color-txt-0)]">{item.title}</div>
                    <span className="badge">{item.pattern}</span>
                  </div>
                  <div className="text-[12px] text-[var(--color-txt-2)] mt-1">
                    Meets {item.pattern} · {item.time}
                  </div>
                  <div className="text-[12px] text-[var(--color-txt-2)] mt-1">{item.description}</div>
                  {item.location && (
                    <div className="text-[12px] text-[var(--color-txt-2)] mt-1">{item.location}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <Link to="/dashboard" className="text-[13px] text-[var(--color-accent)] hover:underline">
              Open dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
