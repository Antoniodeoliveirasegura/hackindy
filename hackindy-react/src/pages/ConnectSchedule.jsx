import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authRequest } from '../lib/authApi'
import Icon from '../components/Icons'

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
  const [banner, setBanner] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const [sourceRes, classRes] = await Promise.all([
        authRequest('/api/me/sources'),
        authRequest('/api/me/classes?limit=5'),
      ])
      setSources(sourceRes.sources || [])
      setClasses(classRes.items || [])
    } catch (error) {
      setBanner(error.message || 'Could not load linked sources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleConnect(e) {
    e.preventDefault()
    setBanner('')
    setSaving(true)
    try {
      await authRequest('/api/sources/purdue/schedule', {
        method: 'POST',
        body: JSON.stringify({ icsUrl, label }),
      })
      setIcsUrl('')
      await refreshSession()
      await loadData()
      setBanner('Purdue schedule connected and synced successfully.')
    } catch (error) {
      setBanner(error.message || 'Could not connect this schedule source.')
    } finally {
      setSaving(false)
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

  function handleLinkPurdue() {
    setLinking(true)
    startPurdueLink('/setup')
  }

  const needsPurdueConnection = onboarding?.needsPurdueConnection
  const hasLinkedPurdue = onboarding?.hasPurdueLinked

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
                  <div className="flex items-center justify-between mt-3 text-[12px] text-[var(--color-txt-2)] gap-3">
                    <span>{source.lastSyncedAt ? `Last synced ${new Date(source.lastSyncedAt).toLocaleString()}` : 'Never synced'}</span>
                    <button type="button" onClick={() => handleSync(source.id)} className="btn btn-secondary text-[12px] px-3 py-1.5">
                      Sync now
                    </button>
                  </div>
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
          ) : classes.length === 0 ? (
            <div className="text-[13px] text-[var(--color-txt-2)]">
              {needsPurdueConnection
                ? 'No classes yet. Link Purdue first, then connect your schedule feed.'
                : 'No classes synced yet. Connect an iCal feed to populate this preview.'}
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface)]">
                  <div className="text-[14px] font-medium text-[var(--color-txt-0)]">{item.title}</div>
                  <div className="text-[12px] text-[var(--color-txt-2)] mt-1">
                    {new Date(item.startTime).toLocaleString()}
                    {item.endTime ? ` - ${new Date(item.endTime).toLocaleTimeString()}` : ''}
                  </div>
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
