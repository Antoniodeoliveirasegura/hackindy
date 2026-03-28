import { useEffect, useState } from 'react'
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
    color: 'blue',
  },
  purdue: {
    label: 'Class Schedule',
    description: 'Import your actual class meeting times from Purdue Timetabling',
    placeholder: 'https://timetable.mypurdue.purdue.edu/Timetabling/export?x=...',
    helpText: 'Purdue Timetabling → Export → Personal Schedule → iCalendar',
    icon: 'schedule',
    color: 'gold',
  },
}

export default function ConnectSchedule() {
  const navigate = useNavigate()
  const { onboarding, refreshSession, startPurdueLink, user } = useAuth()
  const [icsUrl, setIcsUrl] = useState('')
  const [sourceType, setSourceType] = useState('brightspace')
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [banner, setBanner] = useState('')
  const [bannerType, setBannerType] = useState('info')

  const config = sourceConfigs[sourceType]

  async function loadData() {
    setLoading(true)
    try {
      const sourceRes = await authRequest('/api/me/sources')
      setSources(sourceRes.sources || [])
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
    setBannerType('info')
    setSaving(true)
    try {
      const endpoint = sourceType === 'brightspace' 
        ? '/api/sources/brightspace/schedule' 
        : '/api/sources/purdue/schedule'
      await authRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ icsUrl, label: config.label }),
      })
      setIcsUrl('')
      await refreshSession()
      await loadData()
      setBannerType('success')
      setBanner(sourceType === 'brightspace' 
        ? 'Brightspace calendar connected! View your tasks in the Tasks page.'
        : 'Class schedule connected! View your classes in the Schedule page.')
    } catch (error) {
      setBannerType('error')
      setBanner(error.message || 'Could not connect this source.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSync(sourceId) {
    setBanner('')
    setBannerType('info')
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
    if (!confirm('Delete this source and all its imported items?')) {
      return
    }
    setBanner('')
    try {
      await authRequest(`/api/sources/${sourceId}`, { method: 'DELETE' })
      await refreshSession()
      await loadData()
      setBannerType('success')
      setBanner('Source deleted.')
    } catch (error) {
      setBannerType('error')
      setBanner(error.message || 'Could not delete source.')
    }
  }

  function handleLinkPurdue() {
    setLinking(true)
    startPurdueLink('/setup')
  }

  function getSourceTypeLabel(sourceType) {
    if (sourceType === 'brightspace_ical') return 'Brightspace'
    if (sourceType === 'purdue_schedule_ical') return 'Class Schedule'
    return sourceType
  }

  function getSourceIcon(sourceType) {
    if (sourceType === 'brightspace_ical') return 'document'
    return 'schedule'
  }

  const needsPurdueConnection = onboarding?.needsPurdueConnection
  const hasLinkedPurdue = onboarding?.hasPurdueLinked

  const brightspaceSources = sources.filter(s => s.sourceType === 'brightspace_ical')
  const scheduleSources = sources.filter(s => s.sourceType === 'purdue_schedule_ical')

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Connect Your Calendars</h1>
        <p className="text-[14px] text-[var(--color-txt-2)] mt-1">
          Import your assignments and class schedule from Purdue systems.
        </p>
      </div>

      {banner && (
        <div className={`mb-6 card p-4 text-[13px] flex items-start gap-3 ${
          bannerType === 'success' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20' :
          bannerType === 'error' ? 'bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20' :
          'text-[var(--color-txt-1)]'
        }`}>
          <Icon name={bannerType === 'success' ? 'check' : bannerType === 'error' ? 'close' : 'info'} size={16} className="shrink-0 mt-0.5" />
          {banner}
        </div>
      )}

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
                    <button 
                      type="button" 
                      onClick={() => handleSync(source.id)} 
                      className="btn btn-secondary text-[12px] px-3 py-1.5"
                    >
                      Sync
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDelete(source.id)} 
                      className="btn text-[12px] px-3 py-1.5 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                    >
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
              onClick={() => !needsPurdueConnection && setSourceType('purdue')}
              disabled={needsPurdueConnection}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                needsPurdueConnection ? 'opacity-50 cursor-not-allowed' : ''
              } ${
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
                {needsPurdueConnection ? 'Link Purdue account first' : 'Class meeting times'}
              </p>
            </button>
          </div>
        </div>

        {/* Link Purdue prompt if needed */}
        {sourceType === 'purdue' && needsPurdueConnection && (
          <div className="mb-5 p-4 rounded-xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20">
            <div className="text-[14px] font-medium text-[var(--color-txt-0)] mb-2">
              Link your Purdue account first
            </div>
            <p className="text-[13px] text-[var(--color-txt-2)] mb-3">
              To import your class schedule, you need to link your Purdue identity.
            </p>
            <button
              type="button"
              onClick={handleLinkPurdue}
              disabled={linking}
              className="btn btn-primary text-[13px] px-4 py-2"
            >
              <Icon name="graduation" size={15} />
              {linking ? 'Redirecting…' : 'Link Purdue Account'}
            </button>
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
            disabled={!icsUrl.trim() || saving || (sourceType === 'purdue' && needsPurdueConnection)}
            className="btn btn-primary text-[13px] px-5 py-2.5 disabled:opacity-50"
          >
            <Icon name={config.icon} size={15} />
            {saving ? 'Connecting…' : `Connect ${sourceType === 'brightspace' ? 'Brightspace' : 'Schedule'}`}
          </button>
        </form>
      </div>

      {/* Quick Links */}
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
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary text-[13px] px-4 py-2"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
