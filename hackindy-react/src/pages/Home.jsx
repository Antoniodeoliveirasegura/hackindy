import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authRequest } from '../lib/authApi'
import Icon from '../components/Icons'

const quickActions = [
  { path: '/map', label: 'Campus Map', sub: 'Find any building', icon: 'mapPin', color: 'map' },
  { path: '/dining', label: 'Dining', sub: 'See what\'s open', icon: 'dining', color: 'dining' },
  { path: '/transit', label: 'Transit', sub: 'Live bus times', icon: 'bus', color: 'bus' },
  { path: '/events', label: 'Events', sub: '3 happening today', icon: 'calendar', color: 'events' },
]

const fallbackSuggestions = [
  { icon: 'coffee', text: 'Grab coffee at the Union', time: '5 min walk' },
  { icon: 'book', text: 'Study at Cavanaugh Hall', time: 'Quiet hours' },
  { icon: 'dining', text: 'Lunch at Tower Dining', time: 'Opens 11 AM' },
]

const events = [
  { title: 'Hackathon Kickoff Workshop', time: '10:00 AM', location: 'ET 108', type: 'e', badge: 'Engineering' },
  { title: 'Spring Career Fair', time: '12:00 PM', location: 'Campus Center', type: 'c', badge: 'Career' },
  { title: 'Student Org Showcase', time: '3:00 PM', location: 'IUPUI Commons', type: 's', badge: 'Social' },
]

const busSchedule = [
  { time: '12:38 PM', route: 'Union → ET → Campus Ctr', mins: 8 },
  { time: '1:08 PM', route: 'Union → ET → Campus Ctr', mins: 38 },
  { time: '1:38 PM', route: 'Union → ET → Campus Ctr', mins: 68 },
]

const boardPosts = [
  { title: 'Anyone know if ET 215 has outlets near the windows?', user: 'Anonymous', votes: 14, replies: 5, hot: true },
  { title: 'Best place to study during finals week?', user: 'sarah_k', votes: 31, replies: 12, hot: true },
  { title: 'Is the Career Fair open to freshmen?', user: 'Anonymous', votes: 8, replies: 3, hot: false },
]

const menuItems = {
  entrees: ['Grilled Chicken', 'Pasta Marinara', 'Black Bean Burger', 'Mac & Cheese'],
  sides: ['Caesar Salad', 'Roasted Veggies', 'Garlic Bread'],
}

const colorMap = {
  map: 'bg-[var(--color-map-bg)] text-[var(--color-map-color)]',
  dining: 'bg-[var(--color-dining-bg)] text-[var(--color-dining-color)]',
  bus: 'bg-[var(--color-bus-bg)] text-[var(--color-bus-title)]',
  events: 'bg-[var(--color-events-bg)] text-[var(--color-events-color)]',
}

const badgeColors = {
  e: 'bg-[var(--color-map-bg)] text-[var(--color-map-color)]',
  c: 'bg-[var(--color-dining-bg)] text-[var(--color-dining-color)]',
  s: 'bg-[var(--color-events-bg)] text-[var(--color-events-color)]',
}

const dotColors = {
  e: 'bg-[var(--color-map-color)]',
  c: 'bg-[var(--color-dining-color)]',
  s: 'bg-[var(--color-events-color)]',
}

function getGreeting(now) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getCurrentDate(now) {
  return now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTimeRange(startTime, endTime) {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : null
  const startLabel = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const endLabel = end ? end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
  return endLabel ? `${startLabel} – ${endLabel}` : startLabel
}

function formatDuration(minutes) {
  if (minutes <= 0) return '0m'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (!hours) return `${mins}m`
  if (!mins) return `${hours}h`
  return `${hours}h ${mins}m`
}

function getMinutesBetween(later, earlier) {
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / 60000))
}

function isLikelyExamItem(item) {
  const haystack = `${item.title || ''} ${item.description || ''}`.toLowerCase()
  return /\b(midterm|final|exam|quiz|test)\b/.test(haystack)
}

function isLikelyClassMeeting(item) {
  const haystack = `${item.description || ''} ${item.title || ''}`.toLowerCase()
  return /\b(lecture|laboratory|lab|recitation|discussion|seminar|studio|practicum|clinic|workshop|synchronous online)\b/.test(haystack)
}

function getRecurringClassItems(items) {
  const patterns = new Map()

  for (const item of items || []) {
    const start = new Date(item.startTime)
    const end = item.endTime ? new Date(item.endTime) : null
    const key = [
      item.title || '',
      item.description || '',
      item.location || '',
      start.getDay(),
      start.getHours(),
      start.getMinutes(),
      end?.getHours() || '',
      end?.getMinutes() || '',
    ].join('|')

    const group = patterns.get(key) || []
    group.push(item)
    patterns.set(key, group)
  }

  const recurringItems = [...patterns.values()]
    .filter((group) => group.length > 1)
    .flat()
    .filter((item) => !isLikelyExamItem(item))

  if (recurringItems.length) {
    return recurringItems
  }

  return (items || []).filter((item) => !isLikelyExamItem(item))
}

function getHomeClassItems(items) {
  const meetingTypeItems = (items || []).filter((item) => isLikelyClassMeeting(item) && !isLikelyExamItem(item))
  if (meetingTypeItems.length) {
    return meetingTypeItems
  }

  const recurringItems = getRecurringClassItems(items)
  if (recurringItems.length) {
    return recurringItems
  }

  const nonExamItems = (items || []).filter((item) => !isLikelyExamItem(item))
  if (nonExamItems.length) {
    return nonExamItems
  }

  return items || []
}

function deriveScheduleState(items, now) {
  const normalized = (items || [])
    .map((item) => ({
      ...item,
      startDate: new Date(item.startTime),
      endDate: item.endTime ? new Date(item.endTime) : new Date(item.startTime),
    }))
    .sort((a, b) => a.startDate - b.startDate)

  const currentClass = normalized.find((item) => item.startDate <= now && item.endDate > now) || null
  const nextClass = normalized.find((item) => item.startDate > now) || null

  const displayClass = currentClass || nextClass
  let freeMinutes = 0
  let freeLabel = 'No more classes today'
  let statusLabel = 'Schedule clear'
  let cardLabel = 'Next Class'
  let cardMeta = 'No live class data'

  if (currentClass && nextClass) {
    freeMinutes = getMinutesBetween(nextClass.startDate, currentClass.endDate)
    freeLabel = `Free after ${currentClass.title} until ${nextClass.title}`
    statusLabel = `Current class ends in ${formatDuration(getMinutesBetween(currentClass.endDate, now))}`
    cardLabel = 'Current Class'
    cardMeta = `Next: ${nextClass.title} in ${formatDuration(getMinutesBetween(nextClass.startDate, now))}`
  } else if (currentClass) {
    freeMinutes = 0
    freeLabel = `In class until ${currentClass.endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    statusLabel = `Current class ends in ${formatDuration(getMinutesBetween(currentClass.endDate, now))}`
    cardLabel = 'Current Class'
    cardMeta = 'No later class found'
  } else if (nextClass) {
    freeMinutes = getMinutesBetween(nextClass.startDate, now)
    freeLabel = `Free before ${nextClass.title}`
    statusLabel = `In ${formatDuration(freeMinutes)}`
    cardLabel = 'Next Class'
    cardMeta = `${new Date(nextClass.startTime).toLocaleDateString(undefined, { weekday: 'long' })} · ${formatTimeRange(nextClass.startTime, nextClass.endTime)}`
  }

  return {
    currentClass,
    nextClass,
    displayClass,
    freeMinutes,
    freeLabel,
    statusLabel,
    cardLabel,
    cardMeta,
  }
}

function buildSuggestions(freeMinutes) {
  if (freeMinutes >= 90) {
    return [
      { icon: 'book', text: 'Settle into a study block at Cavanaugh Hall', time: formatDuration(freeMinutes) },
      { icon: 'dining', text: 'Grab a full meal before your next class', time: 'Good window' },
      { icon: 'coffee', text: 'Reset with coffee and catch up on messages', time: 'Quick break' },
    ]
  }
  if (freeMinutes >= 45) {
    return [
      { icon: 'coffee', text: 'Pick up coffee and review notes', time: formatDuration(freeMinutes) },
      { icon: 'book', text: 'Find a quiet corner and prep for the next lecture', time: 'Focused block' },
      { icon: 'dining', text: 'Make a short dining stop', time: 'Possible now' },
    ]
  }
  if (freeMinutes > 0) {
    return [
      { icon: 'coffee', text: 'Use the short gap to recharge', time: formatDuration(freeMinutes) },
      { icon: 'mapPin', text: 'Head toward your next building now', time: 'Stay on time' },
      { icon: 'book', text: 'Skim notes before class starts', time: 'Quick review' },
    ]
  }
  return fallbackSuggestions
}

export default function Home() {
  const { getFirstName, onboarding } = useAuth()
  const firstName = getFirstName()
  const [now, setNow] = useState(() => new Date())
  const [classes, setClasses] = useState([])
  const [classLoadError, setClassLoadError] = useState('')

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await authRequest('/api/me/classes?limit=200&mode=display')
        if (cancelled) return
        setClasses(response.items || [])
        setClassLoadError('')
      } catch (error) {
        if (!cancelled) {
          setClasses([])
          setClassLoadError(error.message || 'Could not load classes.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const homeClasses = useMemo(() => getHomeClassItems(classes), [classes])
  const scheduleState = useMemo(() => deriveScheduleState(homeClasses, now), [homeClasses, now])
  const suggestions = useMemo(() => buildSuggestions(scheduleState.freeMinutes), [scheduleState.freeMinutes])

  const needsPurdueConnection = onboarding?.needsPurdueConnection
  const needsScheduleSource = onboarding?.needsScheduleSource
  const showSetupBanner = needsPurdueConnection || needsScheduleSource
  const displayClass = scheduleState.displayClass

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 pb-24">
      <div className="mb-8 transition-all duration-700 opacity-100 translate-y-0">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-txt-0)] flex items-center gap-3">
              {getGreeting(now)}, {firstName}
              <span className="animate-wave text-2xl">👋</span>
            </h1>
            <p className="text-[14px] text-[var(--color-txt-2)] mt-2">
              Here's what's happening on campus today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[var(--color-txt-2)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 shadow-sm">
            <Icon name="calendar" size={14} className="text-[var(--color-txt-3)]" />
            {getCurrentDate(now)}
          </div>
        </div>
      </div>

      {showSetupBanner && (
        <div className="card p-5 mb-6 border-[var(--color-gold)]/30 bg-[var(--color-gold)]/8 transition-all duration-700 delay-75 opacity-100 translate-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-1">
                Finish Setup
              </div>
              <div className="text-[16px] font-semibold text-[var(--color-txt-0)]">
                {needsPurdueConnection ? 'Link your Purdue account next' : 'Your Purdue schedule is not connected yet'}
              </div>
              <p className="text-[13px] text-[var(--color-txt-2)] mt-1 max-w-[640px]">
                {needsPurdueConnection
                  ? 'Your HackIndy account is active. Link your Purdue identity from setup before connecting Purdue-specific sources.'
                  : 'Your Purdue identity is linked, but classes only appear after you attach the Purdue Timetabling iCalendar export.'}
              </p>
            </div>
            <Link to="/setup" className="btn btn-primary text-[13px] px-5 py-2.5 w-fit">
              <Icon name={needsPurdueConnection ? 'graduation' : 'calendar'} size={15} />
              {needsPurdueConnection ? 'Link Purdue' : 'Connect schedule'}
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 transition-all duration-700 delay-100 opacity-100 translate-y-0">
        {quickActions.map(({ path, label, sub, icon, color }, idx) => (
          <Link
            key={path}
            to={path}
            className="group card card-interactive p-4 flex items-center gap-4"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]} transition-transform duration-300 group-hover:scale-110`}>
              <Icon name={icon} size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-[var(--color-txt-0)] group-hover:text-[var(--color-accent)] transition-colors">
                {label}
              </div>
              <div className="text-[12px] text-[var(--color-txt-2)] mt-0.5 truncate">{sub}</div>
            </div>
            <Icon name="arrowUpRight" size={16} className="text-[var(--color-txt-3)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-5 transition-all duration-700 delay-200 opacity-100 translate-y-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">
              {scheduleState.cardLabel}
            </span>
            <span className="text-[11px] text-[var(--color-txt-2)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              {scheduleState.statusLabel}
            </span>
          </div>

          {displayClass ? (
            <div className="bg-gradient-to-br from-[var(--color-cls-bg)] to-[var(--color-cls-bg)]/50 rounded-xl p-4 border border-[var(--color-cls-sub)]/10">
              <div className="text-[11px] font-semibold text-[var(--color-cls-sub)] tracking-wide">{displayClass.title}</div>
              <div className="text-[16px] font-semibold text-[var(--color-cls-title)] mt-1">{displayClass.description || 'Class meeting'}</div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--color-cls-sub)] mt-2">
                <span className="flex items-center gap-1.5">
                  <Icon name="mapPin" size={12} />
                  {displayClass.location || 'Location unavailable'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="clock" size={12} />
                  {formatTimeRange(displayClass.startTime, displayClass.endTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="calendar" size={12} />
                  {new Date(displayClass.startTime).toLocaleDateString(undefined, { weekday: 'long' })}
                </span>
              </div>
              <div className="text-[12px] text-[var(--color-cls-sub)]/90 mt-3">
                {scheduleState.cardMeta}
              </div>
            </div>
          ) : (
            <div className="bg-[var(--color-stat)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="text-[16px] font-semibold text-[var(--color-txt-0)]">No upcoming classes</div>
              <div className="text-[13px] text-[var(--color-txt-2)] mt-1">
                {classLoadError || 'You have no more imported class meetings coming up right now.'}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Link to="/schedule" className="btn btn-secondary text-[12px] px-4 py-2 flex-1">
              <Icon name="calendar" size={14} />
              Full Schedule
            </Link>
            <Link to="/map" className="btn btn-secondary text-[12px] px-4 py-2 flex-1">
              <Icon name="navigation" size={14} />
              Get Directions
            </Link>
          </div>
        </div>

        <div className="card p-5 transition-all duration-700 delay-300 opacity-100 translate-y-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">
              Free Time
            </span>
            <span className="badge bg-[var(--color-gold)]/10 text-[var(--color-gold-muted)]">
              <Icon name="sparkles" size={10} />
              Live Suggestions
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[42px] font-semibold text-[var(--color-txt-0)] leading-none tracking-tight">
              {formatDuration(scheduleState.freeMinutes)}
            </span>
          </div>
          <p className="text-[13px] text-[var(--color-txt-2)] mb-4">
            {scheduleState.freeLabel}
          </p>

          <div className="bg-[var(--color-stat)] rounded-xl p-4">
            <div className="text-[10px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-3">
              What you could do
            </div>
            <div className="space-y-2.5">
              {suggestions.map(({ icon, text, time }, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-[var(--color-bg-2)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-2)] group-hover:bg-[var(--color-bg-3)] flex items-center justify-center transition-colors">
                      <Icon name={icon} size={16} className="text-[var(--color-txt-2)]" />
                    </div>
                    <span className="text-[13px] text-[var(--color-txt-0)]">{text}</span>
                  </div>
                  <span className="text-[11px] text-[var(--color-txt-3)]">{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 mb-4">
        <div className="card p-5 transition-all duration-700 delay-[400ms] opacity-100 translate-y-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">Today's Events</span>
            <Link to="/events" className="text-[12px] text-[var(--color-accent)] hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {events.map((event, idx) => (
              <div key={idx} className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface)]">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="text-[14px] font-medium text-[var(--color-txt-0)] leading-snug">{event.title}</div>
                  <span className={`badge ${badgeColors[event.type]}`}>{event.badge}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--color-txt-2)]">
                  <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${dotColors[event.type]}`} />{event.time}</span>
                  <span className="flex items-center gap-1.5"><Icon name="mapPin" size={12} />{event.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 transition-all duration-700 delay-[500ms] opacity-100 translate-y-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">Shuttle Times</span>
            <Link to="/transit" className="text-[12px] text-[var(--color-accent)] hover:underline">See routes</Link>
          </div>
          <div className="space-y-3">
            {busSchedule.map((bus, idx) => (
              <div key={idx} className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface)] flex items-center justify-between gap-4">
                <div>
                  <div className="text-[14px] font-medium text-[var(--color-txt-0)]">{bus.route}</div>
                  <div className="text-[12px] text-[var(--color-txt-2)] mt-1">Departs at {bus.time}</div>
                </div>
                <div className="text-right">
                  <div className="text-[18px] font-semibold text-[var(--color-txt-0)]">{bus.mins}m</div>
                  <div className="text-[11px] text-[var(--color-txt-3)]">away</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-4">
        <div className="card p-5 transition-all duration-700 delay-[600ms] opacity-100 translate-y-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">Dining Snapshot</span>
            <Link to="/dining" className="text-[12px] text-[var(--color-accent)] hover:underline">Open dining</Link>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[12px] font-medium text-[var(--color-txt-1)] mb-2">Entrees</div>
              <div className="flex flex-wrap gap-2">
                {menuItems.entrees.map((item) => (
                  <span key={item} className="badge">{item}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[12px] font-medium text-[var(--color-txt-1)] mb-2">Sides</div>
              <div className="flex flex-wrap gap-2">
                {menuItems.sides.map((item) => (
                  <span key={item} className="badge">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5 transition-all duration-700 delay-[700ms] opacity-100 translate-y-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">Student Board</span>
            <Link to="/board" className="text-[12px] text-[var(--color-accent)] hover:underline">Open board</Link>
          </div>
          <div className="space-y-3">
            {boardPosts.map((post, idx) => (
              <div key={idx} className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-medium text-[var(--color-txt-0)] leading-snug">{post.title}</div>
                    <div className="text-[12px] text-[var(--color-txt-2)] mt-1">{post.user}</div>
                  </div>
                  {post.hot && <span className="badge">Hot</span>}
                </div>
                <div className="flex items-center gap-4 mt-3 text-[12px] text-[var(--color-txt-2)]">
                  <span className="flex items-center gap-1.5"><Icon name="arrowUp" size={12} />{post.votes}</span>
                  <span className="flex items-center gap-1.5"><Icon name="messageCircle" size={12} />{post.replies}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
