import 'dotenv/config'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import express from 'express'
import session from 'express-session'
import ical from 'node-ical'
import { createClient } from '@supabase/supabase-js'
import { cancelCalendarCapture, getCalendarCaptureJob, startCalendarCapture } from './purdueCalendarAutomation.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TERM_ORDER = { spring: 1, summer: 2, fall: 3 }

const app = express()
const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '127.0.0.1'
const publicBaseUrl = (process.env.BACKEND_PUBLIC_URL || process.env.BETTER_AUTH_URL || `http://${host}:${port}`).replace(/\/$/, '')
const clientAppUrl = (process.env.CLIENT_APP_URL || 'http://localhost:5173').replace(/\/$/, '')
const purdueAuthMode = (process.env.PURDUE_AUTH_MODE || 'mock').toLowerCase()
const defaultNextPath = '/setup'

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  console.error('Please set these in your .env file:')
  console.error('  SUPABASE_URL=https://your-project.supabase.co')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    name: 'pih.sid',
    secret: process.env.SESSION_SECRET || process.env.BETTER_AUTH_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 14,
    },
  }),
)

// Supabase email/OAuth may redirect to the API origin (e.g. localhost:3000). Forward query params to the SPA.
app.get('/auth/callback', (req, res) => {
  const search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  res.redirect(302, `${clientAppUrl}/auth/callback${search}`)
})

app.use(express.static(__dirname))

function nowIso() {
  return new Date().toISOString()
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function makeId() {
  return crypto.randomUUID()
}

function sanitizeNext(next) {
  if (!next || typeof next !== 'string' || !next.startsWith('/')) return defaultNextPath
  return next
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function deriveDisplayName(email, providedName = '') {
  if (providedName && providedName.trim()) return providedName.trim()
  if (!email) return 'Student'
  const local = email.split('@')[0] || 'student'
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || '').split(':')
  if (!salt || !expectedHash) return false
  const actualHash = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'))
}

async function getUserById(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data
}

async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizeEmail(email))
    .single()
  if (error || !data) return null
  return data
}

async function createLocalUser({ email, password, displayName }) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please enter a valid email address.')
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }
  
  const existing = await getUserByEmail(normalizedEmail)
  if (existing) {
    throw new Error('An account with that email already exists.')
  }

  const timestamp = nowIso()
  const id = makeId()
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      id,
      email: normalizedEmail,
      password_hash: hashPassword(password),
      display_name: deriveDisplayName(normalizedEmail, displayName),
      auth_provider: 'local',
      created_at: timestamp,
      updated_at: timestamp
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function authenticateLocalUser({ email, password }) {
  const user = await getUserByEmail(email)
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error('Invalid email or password.')
  }
  return user
}

async function updateLocalUserProfile(userId, { email, displayName, currentPassword, newPassword }) {
  const user = await getUserById(userId)
  if (!user) throw new Error('User not found.')

  const normalizedEmail = normalizeEmail(email || user.email)
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please enter a valid email address.')
  }

  const existingUser = await getUserByEmail(normalizedEmail)
  if (existingUser && existingUser.id !== userId) {
    throw new Error('That email address is already in use.')
  }

  let passwordHash = user.password_hash
  const wantsPasswordChange = Boolean((currentPassword && currentPassword.trim()) || (newPassword && newPassword.trim()))
  if (wantsPasswordChange) {
    if (!verifyPassword(currentPassword || '', user.password_hash)) {
      throw new Error('Current password is incorrect.')
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters.')
    }
    passwordHash = hashPassword(newPassword)
  }

  const nextDisplayName = deriveDisplayName(normalizedEmail, displayName || user.display_name)
  const timestamp = nowIso()
  
  const { data, error } = await supabase
    .from('users')
    .update({
      email: normalizedEmail,
      display_name: nextDisplayName,
      password_hash: passwordHash,
      updated_at: timestamp
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

function getAcademicTerm(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null
  const month = date.getMonth()
  const year = date.getFullYear()
  let season = 'fall'
  if (month <= 4) season = 'spring'
  else if (month <= 6) season = 'summer'
  return {
    key: `${year}-${season}`,
    year,
    season,
    label: `${season.charAt(0).toUpperCase() + season.slice(1)} ${year}`,
  }
}

function parseTermKey(termKey) {
  const [yearPart, season] = String(termKey || '').split('-')
  const year = Number(yearPart)
  if (!year || !TERM_ORDER[season]) return null
  return { key: `${year}-${season}`, year, season, label: `${season.charAt(0).toUpperCase() + season.slice(1)} ${year}` }
}

function compareTermKeys(a, b) {
  const left = parseTermKey(a)
  const right = parseTermKey(b)
  if (!left && !right) return 0
  if (!left) return -1
  if (!right) return 1
  if (left.year !== right.year) return left.year - right.year
  return TERM_ORDER[left.season] - TERM_ORDER[right.season]
}

function getPreferredClassTerm(items) {
  if (!items.length) return null

  const groups = new Map()
  for (const item of items) {
    const term = getAcademicTerm(item.start_time)
    if (!term) continue
    const start = new Date(item.start_time)
    const end = new Date(item.end_time || item.start_time)
    const current = groups.get(term.key) || {
      key: term.key,
      label: term.label,
      minStart: start,
      maxEnd: end,
    }
    if (start < current.minStart) current.minStart = start
    if (end > current.maxEnd) current.maxEnd = end
    groups.set(term.key, current)
  }

  if (!groups.size) return null

  const today = startOfToday()
  const currentTerm = getAcademicTerm(today)
  const currentGroup = currentTerm ? groups.get(currentTerm.key) : null
  if (currentGroup && currentGroup.maxEnd >= today) {
    return parseTermKey(currentGroup.key)
  }

  const upcomingGroups = [...groups.values()]
    .filter((group) => group.maxEnd >= today)
    .sort((a, b) => a.minStart - b.minStart || compareTermKeys(a.key, b.key))
  if (upcomingGroups.length) {
    return parseTermKey(upcomingGroups[0].key)
  }

  const latestGroup = [...groups.values()].sort((a, b) => compareTermKeys(b.key, a.key) || b.maxEnd - a.maxEnd)[0]
  return latestGroup ? parseTermKey(latestGroup.key) : null
}

function orderClassItemsForDisplay(items) {
  const now = new Date()
  const upcoming = items
    .filter((item) => new Date(item.end_time || item.start_time) >= now)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  if (upcoming.length) return upcoming

  return [...items].sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
}

async function getUserSummary(userId) {
  const user = await getUserById(userId)
  
  const { count: linkedSourceCount } = await supabase
    .from('linked_sources')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: classCount } = await supabase
    .from('calendar_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('category', 'class')

  const hasPurdueLinked = Boolean(user?.purdue_email)
  return {
    linkedSourceCount: linkedSourceCount || 0,
    classCount: classCount || 0,
    hasPurdueLinked,
    needsPurdueConnection: !hasPurdueLinked,
    needsScheduleSource: hasPurdueLinked && (linkedSourceCount || 0) === 0,
  }
}

async function getCurrentUser(req) {
  return await getUserById(req.session.userId)
}

async function buildSessionPayload(user) {
  if (!user) return null
  const summary = await getUserSummary(user.id)
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.display_name,
      authProvider: user.auth_provider,
      purdueEmail: user.purdue_email,
      purdueUsername: user.purdue_username,
      hasPurdueLinked: Boolean(user.purdue_email),
    },
    onboarding: summary,
  }
}

async function requireAuth(req, res, next) {
  const user = await getCurrentUser(req)
  if (!user) {
    return res.status(401).json({ error: { message: 'You must sign in to access this resource.', status: 401 } })
  }
  req.currentUser = user
  next()
}

function requirePurdueLinked(req, res, next) {
  if (!req.currentUser?.purdue_email) {
    return res.status(400).json({
      error: {
        message: 'Link your Purdue account before connecting Purdue schedule data.',
        status: 400,
      },
    })
  }
  next()
}

async function listSourcesForUser(userId) {
  const { data, error } = await supabase
    .from('linked_sources')
    .select('id, source_type, label, source_url, status, last_synced_at, last_error, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data.map(row => ({
    id: row.id,
    sourceType: row.source_type,
    label: row.label,
    sourceUrl: row.source_url,
    status: row.status,
    lastSyncedAt: row.last_synced_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

async function getSourceForUser(sourceId, userId) {
  const { data, error } = await supabase
    .from('linked_sources')
    .select('*')
    .eq('id', sourceId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data
}

async function deleteSourceForUser(sourceId, userId) {
  const source = await getSourceForUser(sourceId, userId)
  if (!source) return null

  const { data, error } = await supabase
    .from('linked_sources')
    .delete()
    .eq('id', sourceId)
    .eq('user_id', userId)
    .select('id')

  if (error) throw new Error(error.message)
  if (!data?.length) {
    throw new Error('Could not remove this source. Try refreshing the page.')
  }
  return source
}

function validateSourceUrl(sourceUrl) {
  try {
    const parsed = new URL(sourceUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only http and https URLs are supported.')
    }
    return parsed.toString()
  } catch {
    throw new Error('Please enter a valid iCalendar URL.')
  }
}

function normalizeCategory(sourceType, event) {
  if (sourceType === 'purdue_schedule_ical') return 'class'
  return /career fair|workshop|showcase|event/i.test(event.summary || '') ? 'event' : 'event'
}

async function syncSource(source) {
  const eventsByKey = await ical.async.fromURL(source.source_url)
  const events = Object.values(eventsByKey).filter((item) => item?.type === 'VEVENT')
  const syncedAt = nowIso()

  // Delete existing items for this source
  await supabase
    .from('calendar_items')
    .delete()
    .eq('source_id', source.id)

  // Insert new items
  const itemsToInsert = events.map(event => {
    const uid = String(event.uid || `${source.id}:${event.summary}:${event.start?.toISOString?.() || syncedAt}`)
    return {
      id: makeId(),
      user_id: source.user_id,
      source_id: source.id,
      source_type: source.source_type,
      title: String(event.summary || 'Untitled item'),
      description: event.description ? String(event.description) : null,
      start_time: event.start?.toISOString?.() || syncedAt,
      end_time: event.end?.toISOString?.() || null,
      location: event.location ? String(event.location) : null,
      category: normalizeCategory(source.source_type, event),
      external_uid: uid,
      all_day: event.datetype === 'date',
      raw_json: { uid, summary: event.summary, description: event.description, location: event.location },
      created_at: syncedAt,
      updated_at: syncedAt
    }
  })

  if (itemsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('calendar_items')
      .insert(itemsToInsert)

    if (insertError) {
      await supabase
        .from('linked_sources')
        .update({ status: 'error', last_error: insertError.message, updated_at: syncedAt })
        .eq('id', source.id)
      throw new Error(insertError.message)
    }
  }

  // Update source status
  await supabase
    .from('linked_sources')
    .update({ status: 'ready', last_synced_at: syncedAt, last_error: null, updated_at: syncedAt })
    .eq('id', source.id)

  return { syncedAt, itemCount: events.length }
}

async function createScheduleSource(userId, { icsUrl, label }) {
  const sourceUrl = validateSourceUrl(icsUrl)
  const timestamp = nowIso()
  const id = makeId()

  const { data, error } = await supabase
    .from('linked_sources')
    .insert({
      id,
      user_id: userId,
      source_type: 'purdue_schedule_ical',
      label: (label || 'Purdue schedule').trim() || 'Purdue schedule',
      source_url: sourceUrl,
      status: 'pending',
      created_at: timestamp,
      updated_at: timestamp
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function listCalendarItems(userId, { category, limit = 100, order = 'asc' } = {}) {
  let query = supabase
    .from('calendar_items')
    .select('id, source_id, title, description, start_time, end_time, location, category, external_uid, source_type')
    .eq('user_id', userId)

  if (category) {
    query = query.eq('category', category)
  }

  query = query.order('start_time', { ascending: order === 'asc' }).limit(Number(limit) || 100)

  const { data, error } = await query

  if (error) return []
  return data.map(row => ({
    id: row.id,
    sourceId: row.source_id,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    category: row.category,
    externalUid: row.external_uid,
    sourceType: row.source_type
  }))
}

async function getClassItemsForUser(userId, { limit = 20, term = 'auto', mode = 'display' } = {}) {
  const allItems = await listCalendarItems(userId, { category: 'class', limit: 5000, order: 'asc' })
  if (!allItems.length) {
    return {
      items: [],
      meta: {
        selectedTermKey: null,
        selectedTermLabel: null,
        totalInTerm: 0,
      },
    }
  }

  // Convert camelCase to snake_case for term processing
  const itemsForTermProcessing = allItems.map(item => ({
    ...item,
    start_time: item.startTime,
    end_time: item.endTime
  }))

  const preferredTerm = term === 'all' ? null : (term && term !== 'auto' ? parseTermKey(term) : getPreferredClassTerm(itemsForTermProcessing))
  const termItems = preferredTerm
    ? allItems.filter((item) => getAcademicTerm(item.startTime)?.key === preferredTerm.key)
    : allItems

  const orderedItems = mode === 'display'
    ? orderClassItemsForDisplay(termItems.map(item => ({ ...item, start_time: item.startTime, end_time: item.endTime })))
        .map(item => ({ ...item, startTime: item.start_time, endTime: item.end_time }))
    : [...termItems].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  return {
    items: orderedItems.slice(0, Number(limit) || 20),
    meta: {
      selectedTermKey: preferredTerm?.key || null,
      selectedTermLabel: preferredTerm?.label || null,
      totalInTerm: termItems.length,
    },
  }
}

async function linkPurdueIdentity(userId, { email }) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !normalizedEmail.endsWith('@purdue.edu')) {
    throw new Error('Please use a valid @purdue.edu account.')
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('purdue_email', normalizedEmail)
    .neq('id', userId)
    .single()

  if (existing) {
    throw new Error('That Purdue account is already linked to another user.')
  }

  const username = normalizedEmail.split('@')[0]
  const timestamp = nowIso()

  const { data, error } = await supabase
    .from('users')
    .update({
      purdue_email: normalizedEmail,
      purdue_username: username,
      purdue_linked_at: timestamp,
      updated_at: timestamp
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function validateCasTicket(ticket, nextPath) {
  const loginUrl = process.env.PURDUE_CAS_LOGIN_URL
  const validateUrl = process.env.PURDUE_CAS_VALIDATE_URL
  if (!loginUrl || !validateUrl) {
    throw new Error('CAS mode requires PURDUE_CAS_LOGIN_URL and PURDUE_CAS_VALIDATE_URL.')
  }

  const serviceUrl = `${publicBaseUrl}/auth/purdue/callback?next=${encodeURIComponent(nextPath)}`
  const response = await fetch(`${validateUrl}?service=${encodeURIComponent(serviceUrl)}&ticket=${encodeURIComponent(ticket)}`)
  const xml = await response.text()
  const userMatch = xml.match(/<cas:user>([^<]+)<\/cas:user>/i)
  if (!userMatch) throw new Error('CAS ticket validation failed.')
  const emailMatch = xml.match(/<cas:(?:mail|email)>([^<]+)<\/cas:(?:mail|email)>/i)
  const username = userMatch[1].trim()
  const email = emailMatch?.[1]?.trim() || `${username}@purdue.edu`
  return { email }
}

function renderMockPurdueLinkPage(nextPath, message = '', currentEmail = '') {
  const defaultEmail = currentEmail || process.env.DEV_PURDUE_EMAIL || 'student@purdue.edu'
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link Purdue Account</title>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;background:#f5f4f1;color:#1a1918;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
    .card{width:min(100%,420px);background:#fff;border:1px solid rgba(26,25,24,.08);border-radius:16px;padding:24px;box-shadow:0 8px 32px rgba(26,25,24,.08)}
    .badge{display:inline-block;background:#CFB991;color:#3E2200;font-size:10px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:.08em;text-transform:uppercase}
    h1{font-size:24px;margin:16px 0 8px}
    p{font-size:14px;line-height:1.6;color:#4A4844}
    label{display:block;font-size:12px;font-weight:600;margin:16px 0 6px}
    input{width:100%;box-sizing:border-box;border:1px solid rgba(26,25,24,.14);border-radius:10px;padding:12px 14px;font:inherit}
    button{margin-top:20px;width:100%;border:0;border-radius:10px;background:#CFB991;color:#3E2200;padding:12px 14px;font:inherit;font-weight:700;cursor:pointer}
    .msg{margin-top:12px;color:#b42318;font-size:13px}
  </style>
</head>
<body>
  <form class="card" method="post" action="/auth/purdue/dev/link">
    <span class="badge">Mock Purdue Link</span>
    <h1>Link your Purdue account</h1>
    <p>This development screen stands in for Purdue CAS account linking until official CAS service registration is available.</p>
    <input type="hidden" name="next" value="${escapeHtml(nextPath)}" />
    <label for="email">Purdue email</label>
    <input id="email" name="email" type="email" value="${escapeHtml(defaultEmail)}" required />
    <button type="submit">Link Purdue account</button>
    ${message ? `<div class="msg">${escapeHtml(message)}</div>` : ''}
  </form>
</body>
</html>`
}

app.get('/api/auth-config', (_req, res) => {
  res.json({
    authProvider: 'local',
    purdueAuthMode,
    supportsPurdueLink: true,
    supportedSources: ['purdue_schedule_ical'],
  })
})

app.get('/api/session', async (req, res) => {
  const user = await getCurrentUser(req)
  const sessionPayload = await buildSessionPayload(user)
  res.json({ authenticated: Boolean(sessionPayload), session: sessionPayload })
})

app.post('/api/auth/register-supabase', async (req, res) => {
  try {
    const emailRaw = req.body.email
    const password = req.body.password
    const displayName = req.body.name ?? req.body.displayName ?? ''
    const normalizedEmail = normalizeEmail(emailRaw)
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return res.status(400).json({ error: { message: 'Please enter a valid email address.', status: 400 } })
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: { message: 'Password must be at least 8 characters.', status: 400 } })
    }

    const existingRow = await getUserByEmail(normalizedEmail)
    if (existingRow) {
      return res.status(400).json({ error: { message: 'An account with that email already exists.', status: 400 } })
    }

    const { data: created, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: String(displayName).trim() || deriveDisplayName(normalizedEmail, ''),
      },
    })

    if (authError) {
      const raw = authError.message || 'Could not create account.'
      if (
        /already\s+registered|already\s+exists|duplicate/i.test(raw) ||
        authError.code === 'email_exists'
      ) {
        return res.status(400).json({ error: { message: 'An account with that email already exists.', status: 400 } })
      }
      return res.status(400).json({ error: { message: raw, status: 400 } })
    }

    const authUser = created.user
    const timestamp = nowIso()
    const { data: row, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: normalizedEmail,
        password_hash: '',
        display_name: deriveDisplayName(normalizedEmail, displayName),
        auth_provider: 'email',
        created_at: timestamp,
        updated_at: timestamp,
      })
      .select()
      .single()

    if (insertError) {
      console.error('register-supabase: public.users insert failed:', insertError)
      return res.status(500).json({
        error: { message: insertError.message || 'Could not create your profile.', status: 500 },
      })
    }

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: { message: 'Could not create a session.', status: 500 } })
      }
      req.session.userId = row.id
      req.session.save(async () => {
        res.status(201).json({ session: await buildSessionPayload(row) })
      })
    })
  } catch (error) {
    res.status(500).json({ error: { message: error.message || 'Could not create account.', status: 500 } })
  }
})

app.post('/api/auth/sign-up', async (req, res) => {
  try {
    const user = await createLocalUser({
      email: req.body.email,
      password: req.body.password,
      displayName: req.body.name,
    })
    req.session.regenerate(async (err) => {
      if (err) {
        return res.status(500).json({ error: { message: 'Could not create a session.', status: 500 } })
      }
      req.session.userId = user.id
      req.session.save(async () => {
        res.status(201).json({ session: await buildSessionPayload(user) })
      })
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message || 'Could not create account.', status: 400 } })
  }
})

app.post('/api/auth/sign-in', async (req, res) => {
  try {
    const user = await authenticateLocalUser({ email: req.body.email, password: req.body.password })
    req.session.regenerate(async (err) => {
      if (err) {
        return res.status(500).json({ error: { message: 'Could not create a session.', status: 500 } })
      }
      req.session.userId = user.id
      req.session.save(async () => {
        res.json({ session: await buildSessionPayload(user) })
      })
    })
  } catch (error) {
    res.status(401).json({ error: { message: error.message || 'Could not sign in.', status: 401 } })
  }
})

app.post('/api/sign-out', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('pih.sid')
    res.json({ ok: true })
  })
})

app.post('/api/auth/supabase-sync', async (req, res) => {
  try {
    const { supabaseUserId, email, name, avatarUrl, provider, accessToken } = req.body
    
    if (!supabaseUserId || !email) {
      return res.status(400).json({ error: { message: 'Missing required fields', status: 400 } })
    }

    const normalizedEmail = normalizeEmail(email)
    
    let user = await getUserByEmail(normalizedEmail)
    
    if (!user) {
      const timestamp = nowIso()
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: supabaseUserId,
          email: normalizedEmail,
          password_hash: '',
          display_name: deriveDisplayName(normalizedEmail, name),
          auth_provider: provider || 'supabase',
          avatar_url: avatarUrl || null,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          user = await getUserByEmail(normalizedEmail)
        } else {
          throw new Error(error.message)
        }
      } else {
        user = data
      }
    } else {
      const { data, error } = await supabase
        .from('users')
        .update({
          display_name: name || user.display_name,
          avatar_url: avatarUrl || user.avatar_url,
          auth_provider: user.auth_provider === 'local' ? user.auth_provider : (provider || user.auth_provider),
          updated_at: nowIso()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Failed to update user:', error)
      } else {
        user = data
      }
    }

    if (!user) {
      return res.status(500).json({ error: { message: 'Could not sync user profile.', status: 500 } })
    }

    req.session.userId = user.id

    const session = await buildSessionPayload(user)
    res.json({ session })
  } catch (error) {
    console.error('Supabase sync error:', error)
    res.status(500).json({ error: { message: error.message || 'Could not sync user.', status: 500 } })
  }
})

app.get('/auth/purdue/connect', requireAuth, (req, res) => {
  const nextPath = sanitizeNext(req.query.next)
  if (purdueAuthMode === 'cas') {
    const loginUrl = process.env.PURDUE_CAS_LOGIN_URL
    const validateUrl = process.env.PURDUE_CAS_VALIDATE_URL
    if (!loginUrl || !validateUrl) {
      return res.redirect(`${clientAppUrl}/settings?error=cas-config`)
    }
    const serviceUrl = `${publicBaseUrl}/auth/purdue/callback?next=${encodeURIComponent(nextPath)}`
    return res.redirect(`${loginUrl}?service=${encodeURIComponent(serviceUrl)}`)
  }

  res.type('html').send(renderMockPurdueLinkPage(nextPath, '', req.currentUser.purdue_email))
})

app.post('/auth/purdue/dev/link', requireAuth, async (req, res) => {
  const nextPath = sanitizeNext(req.body.next)
  if (purdueAuthMode === 'cas') {
    return res.status(404).send('Mock Purdue linking is disabled while CAS mode is active.')
  }
  try {
    await linkPurdueIdentity(req.currentUser.id, {
      email: req.body.email,
    })
    res.redirect(`${clientAppUrl}${nextPath}`)
  } catch (error) {
    res.type('html').send(renderMockPurdueLinkPage(nextPath, error.message || 'Could not link Purdue account.', req.body.email))
  }
})

app.get('/auth/purdue/callback', requireAuth, async (req, res) => {
  const nextPath = sanitizeNext(req.query.next)
  const ticket = req.query.ticket
  if (!ticket) {
    return res.redirect(`${clientAppUrl}/settings?error=missing-ticket`)
  }
  try {
    const identity = await validateCasTicket(String(ticket), nextPath)
    await linkPurdueIdentity(req.currentUser.id, identity)
    res.redirect(`${clientAppUrl}${nextPath}`)
  } catch (error) {
    console.error(error)
    res.redirect(`${clientAppUrl}/settings?error=cas-validation`)
  }
})

app.get('/api/me/profile', requireAuth, async (req, res) => {
  const payload = await buildSessionPayload(req.currentUser)
  res.json({ user: payload.user })
})

app.patch('/api/me/profile', requireAuth, async (req, res) => {
  try {
    const user = await updateLocalUserProfile(req.currentUser.id, {
      email: req.body.email,
      displayName: req.body.name,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    })
    const payload = await buildSessionPayload(user)
    res.json({ user: payload.user })
  } catch (error) {
    res.status(400).json({ error: { message: error.message || 'Could not update profile.', status: 400 } })
  }
})

app.get('/api/me/sources', requireAuth, async (req, res) => {
  res.json({ sources: await listSourcesForUser(req.currentUser.id) })
})

async function removeLinkedSourceRoute(req, res) {
  try {
    const deleted = await deleteSourceForUser(req.params.sourceId, req.currentUser.id)
    if (!deleted) {
      return res.status(404).json({ error: { message: 'Source not found.', status: 404 } })
    }
    res.json({ ok: true })
  } catch (error) {
    res.status(400).json({ error: { message: error.message || 'Could not remove this source.', status: 400 } })
  }
}

app.post('/api/me/sources/:sourceId/remove', requireAuth, removeLinkedSourceRoute)
app.delete('/api/me/sources/:sourceId', requireAuth, removeLinkedSourceRoute)

app.post('/api/purdue/calendar-link/start', requireAuth, requirePurdueLinked, async (req, res) => {
  try {
    const job = await startCalendarCapture(req.currentUser.id)
    res.status(202).json({ job })
  } catch (error) {
    res.status(500).json({ error: { message: error.message || 'Could not start Purdue timetable automation.', status: 500 } })
  }
})

app.get('/api/purdue/calendar-link/status', requireAuth, requirePurdueLinked, async (req, res) => {
  res.json({ job: getCalendarCaptureJob(req.currentUser.id) })
})

app.post('/api/purdue/calendar-link/cancel', requireAuth, requirePurdueLinked, async (req, res) => {
  res.json({ job: await cancelCalendarCapture(req.currentUser.id) })
})

app.post('/api/sources/purdue/schedule', requireAuth, requirePurdueLinked, async (req, res) => {
  try {
    const source = await createScheduleSource(req.currentUser.id, { icsUrl: req.body.icsUrl, label: req.body.label })
    const sync = await syncSource(source)
    res.status(201).json({ source: await getSourceForUser(source.id, req.currentUser.id), sync })
  } catch (error) {
    res.status(400).json({ error: { message: error.message || 'Could not connect the Purdue schedule source.', status: 400 } })
  }
})

app.post('/api/sync/:sourceId', requireAuth, async (req, res) => {
  const source = await getSourceForUser(req.params.sourceId, req.currentUser.id)
  if (!source) {
    return res.status(404).json({ error: { message: 'Source not found.', status: 404 } })
  }
  try {
    const sync = await syncSource(source)
    res.json({ source: await getSourceForUser(source.id, req.currentUser.id), sync })
  } catch (error) {
    res.status(400).json({ error: { message: error.message || 'Could not sync source.', status: 400 } })
  }
})

app.get('/api/me/calendar', requireAuth, async (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : null
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 100
  res.json({ items: await listCalendarItems(req.currentUser.id, { category, limit, order: 'asc' }) })
})

app.get('/api/me/classes', requireAuth, async (req, res) => {
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20
  const term = typeof req.query.term === 'string' ? req.query.term : 'auto'
  const mode = typeof req.query.mode === 'string' ? req.query.mode : 'display'
  const data = await getClassItemsForUser(req.currentUser.id, { limit, term, mode })
  res.json(data)
})

app.get('/api/me/events', requireAuth, async (req, res) => {
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20
  res.json({ items: await listCalendarItems(req.currentUser.id, { category: 'event', limit, order: 'asc' }) })
})

app.get('/', (_req, res) => {
  res.redirect(clientAppUrl)
})

app.listen(port, host, () => {
  console.log(`HackIndy backend listening on ${publicBaseUrl}`)
  console.log(`Purdue link mode: ${purdueAuthMode}`)
  console.log(`Database: Supabase`)
})
