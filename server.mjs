import 'dotenv/config'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import session from 'express-session'
import Database from 'better-sqlite3'
import ical from 'node-ical'

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

const dataDir = process.env.AUTH_DATA_DIR || path.join(os.tmpdir(), 'hackindy-app')
const dbPath = path.join(dataDir, 'app-v2.sqlite')
fs.mkdirSync(dataDir, { recursive: true })
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
initSchema()

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
app.use(express.static(__dirname))

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      auth_provider TEXT NOT NULL DEFAULT 'local',
      purdue_email TEXT UNIQUE,
      purdue_username TEXT,
      purdue_linked_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS linked_sources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      label TEXT NOT NULL,
      source_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      last_synced_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS calendar_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      location TEXT,
      category TEXT NOT NULL,
      external_uid TEXT NOT NULL,
      all_day INTEGER NOT NULL DEFAULT 0,
      raw_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(source_id, external_uid),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(source_id) REFERENCES linked_sources(id)
    );
  `)
}

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

function getUserById(userId) {
  if (!userId) return null
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) || null
}

function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email)) || null
}

function createLocalUser({ email, password, displayName }) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please enter a valid email address.')
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }
  if (getUserByEmail(normalizedEmail)) {
    throw new Error('An account with that email already exists.')
  }

  const timestamp = nowIso()
  const id = makeId()
  db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, auth_provider, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'local', ?, ?)
  `).run(id, normalizedEmail, hashPassword(password), deriveDisplayName(normalizedEmail, displayName), timestamp, timestamp)

  return getUserById(id)
}

function authenticateLocalUser({ email, password }) {
  const user = getUserByEmail(email)
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error('Invalid email or password.')
  }
  return user
}

function updateLocalUserProfile(userId, { email, displayName, currentPassword, newPassword }) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found.')

  const normalizedEmail = normalizeEmail(email || user.email)
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please enter a valid email address.')
  }

  const existingUser = getUserByEmail(normalizedEmail)
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
  db.prepare(`
    UPDATE users
    SET email = ?, display_name = ?, password_hash = ?, updated_at = ?
    WHERE id = ?
  `).run(normalizedEmail, nextDisplayName, passwordHash, timestamp, userId)

  return getUserById(userId)
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
    const term = getAcademicTerm(item.startTime)
    if (!term) continue
    const start = new Date(item.startTime)
    const end = new Date(item.endTime || item.startTime)
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
    .filter((item) => new Date(item.endTime || item.startTime) >= now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  if (upcoming.length) return upcoming

  return [...items].sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
}

function getUserSummary(userId) {
  const user = getUserById(userId)
  const linkedSourceCount = db.prepare('SELECT COUNT(*) AS count FROM linked_sources WHERE user_id = ?').get(userId).count
  const classCount = db.prepare("SELECT COUNT(*) AS count FROM calendar_items WHERE user_id = ? AND category = 'class'").get(userId).count
  const hasPurdueLinked = Boolean(user?.purdue_email)
  return {
    linkedSourceCount,
    classCount,
    hasPurdueLinked,
    needsPurdueConnection: !hasPurdueLinked,
    needsScheduleSource: hasPurdueLinked && linkedSourceCount === 0,
  }
}

function getCurrentUser(req) {
  return getUserById(req.session.userId)
}

function buildSessionPayload(user) {
  if (!user) return null
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
    onboarding: getUserSummary(user.id),
  }
}

function requireAuth(req, res, next) {
  const user = getCurrentUser(req)
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

function listSourcesForUser(userId) {
  return db.prepare(`
    SELECT id, source_type AS sourceType, label, source_url AS sourceUrl, status,
           last_synced_at AS lastSyncedAt, last_error AS lastError,
           created_at AS createdAt, updated_at AS updatedAt
    FROM linked_sources
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId)
}

function getSourceForUser(sourceId, userId) {
  return db.prepare('SELECT * FROM linked_sources WHERE id = ? AND user_id = ?').get(sourceId, userId) || null
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
  const deleteStmt = db.prepare('DELETE FROM calendar_items WHERE source_id = ?')
  const insertStmt = db.prepare(`
    INSERT INTO calendar_items (
      id, user_id, source_id, source_type, title, description, start_time, end_time,
      location, category, external_uid, all_day, raw_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const tx = db.transaction(() => {
    deleteStmt.run(source.id)
    for (const event of events) {
      const uid = String(event.uid || `${source.id}:${event.summary}:${event.start?.toISOString?.() || syncedAt}`)
      insertStmt.run(
        makeId(),
        source.user_id,
        source.id,
        source.source_type,
        String(event.summary || 'Untitled item'),
        event.description ? String(event.description) : null,
        event.start?.toISOString?.() || syncedAt,
        event.end?.toISOString?.() || null,
        event.location ? String(event.location) : null,
        normalizeCategory(source.source_type, event),
        uid,
        event.datetype === 'date' ? 1 : 0,
        JSON.stringify({ uid, summary: event.summary, description: event.description, location: event.location }),
        syncedAt,
        syncedAt,
      )
    }
    db.prepare(`
      UPDATE linked_sources
      SET status = 'ready', last_synced_at = ?, last_error = NULL, updated_at = ?
      WHERE id = ?
    `).run(syncedAt, syncedAt, source.id)
  })

  try {
    tx()
    return { syncedAt, itemCount: events.length }
  } catch (error) {
    db.prepare(`
      UPDATE linked_sources
      SET status = 'error', last_error = ?, updated_at = ?
      WHERE id = ?
    `).run(error.message, syncedAt, source.id)
    throw error
  }
}

function createScheduleSource(userId, { icsUrl, label }) {
  const sourceUrl = validateSourceUrl(icsUrl)
  const timestamp = nowIso()
  const id = makeId()
  db.prepare(`
    INSERT INTO linked_sources (id, user_id, source_type, label, source_url, status, created_at, updated_at)
    VALUES (?, ?, 'purdue_schedule_ical', ?, ?, 'pending', ?, ?)
  `).run(id, userId, (label || 'Purdue schedule').trim() || 'Purdue schedule', sourceUrl, timestamp, timestamp)
  return getSourceForUser(id, userId)
}

function listCalendarItems(userId, { category, limit = 100, order = 'asc' } = {}) {
  const params = [userId]
  let sql = `
    SELECT id, source_id AS sourceId, title, description, start_time AS startTime,
           end_time AS endTime, location, category, external_uid AS externalUid,
           source_type AS sourceType
    FROM calendar_items
    WHERE user_id = ?
  `
  if (category) {
    sql += ' AND category = ?'
    params.push(category)
  }
  sql += ` ORDER BY start_time ${order === 'desc' ? 'DESC' : 'ASC'} LIMIT ?`
  params.push(Number(limit) || 100)
  return db.prepare(sql).all(...params)
}

function getClassItemsForUser(userId, { limit = 20, term = 'auto', mode = 'display' } = {}) {
  const allItems = listCalendarItems(userId, { category: 'class', limit: 5000, order: 'asc' })
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

  const preferredTerm = term === 'all' ? null : (term && term !== 'auto' ? parseTermKey(term) : getPreferredClassTerm(allItems))
  const termItems = preferredTerm
    ? allItems.filter((item) => getAcademicTerm(item.startTime)?.key === preferredTerm.key)
    : allItems

  const orderedItems = mode === 'display'
    ? orderClassItemsForDisplay(termItems)
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

function linkPurdueIdentity(userId, { email }) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !normalizedEmail.endsWith('@purdue.edu')) {
    throw new Error('Please use a valid @purdue.edu account.')
  }

  const existing = db.prepare('SELECT id FROM users WHERE purdue_email = ? AND id != ?').get(normalizedEmail, userId)
  if (existing) {
    throw new Error('That Purdue account is already linked to another user.')
  }

  const username = normalizedEmail.split('@')[0]
  const timestamp = nowIso()
  db.prepare(`
    UPDATE users
    SET purdue_email = ?, purdue_username = ?, purdue_linked_at = ?, updated_at = ?
    WHERE id = ?
  `).run(normalizedEmail, username, timestamp, timestamp, userId)

  return getUserById(userId)
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

app.get('/api/session', (req, res) => {
  const user = getCurrentUser(req)
  const sessionPayload = buildSessionPayload(user)
  res.json({ authenticated: Boolean(sessionPayload), session: sessionPayload })
})

app.post('/api/auth/sign-up', (req, res) => {
  try {
    const user = createLocalUser({
      email: req.body.email,
      password: req.body.password,
      displayName: req.body.name,
    })
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: { message: 'Could not create a session.', status: 500 } })
      }
      req.session.userId = user.id
      req.session.save(() => {
        res.status(201).json({ session: buildSessionPayload(user) })
      })
    })
  } catch (error) {
    res.status(400).json({ error: { message: error.message || 'Could not create account.', status: 400 } })
  }
})

app.post('/api/auth/sign-in', (req, res) => {
  try {
    const user = authenticateLocalUser({ email: req.body.email, password: req.body.password })
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: { message: 'Could not create a session.', status: 500 } })
      }
      req.session.userId = user.id
      req.session.save(() => {
        res.json({ session: buildSessionPayload(user) })
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

app.post('/auth/purdue/dev/link', requireAuth, (req, res) => {
  const nextPath = sanitizeNext(req.body.next)
  if (purdueAuthMode === 'cas') {
    return res.status(404).send('Mock Purdue linking is disabled while CAS mode is active.')
  }
  try {
    linkPurdueIdentity(req.currentUser.id, {
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
    linkPurdueIdentity(req.currentUser.id, identity)
    res.redirect(`${clientAppUrl}${nextPath}`)
  } catch (error) {
    console.error(error)
    res.redirect(`${clientAppUrl}/settings?error=cas-validation`)
  }
})

app.get('/api/me/profile', requireAuth, (req, res) => {
  res.json({ user: buildSessionPayload(req.currentUser).user })
})

app.patch('/api/me/profile', requireAuth, (req, res) => {
  try {
    const user = updateLocalUserProfile(req.currentUser.id, {
      email: req.body.email,
      displayName: req.body.name,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    })
    res.json({ user: buildSessionPayload(user).user })
  } catch (error) {
    res.status(400).json({ error: { message: error.message || 'Could not update profile.', status: 400 } })
  }
})

app.get('/api/me/sources', requireAuth, (req, res) => {
  res.json({ sources: listSourcesForUser(req.currentUser.id) })
})

app.post('/api/sources/purdue/schedule', requireAuth, requirePurdueLinked, async (req, res) => {
  try {
    const source = createScheduleSource(req.currentUser.id, { icsUrl: req.body.icsUrl, label: req.body.label })
    const sync = await syncSource(source)
    res.status(201).json({ source: getSourceForUser(source.id, req.currentUser.id), sync })
  } catch (error) {
    res.status(400).json({ error: { message: error.message || 'Could not connect the Purdue schedule source.', status: 400 } })
  }
})

app.post('/api/sync/:sourceId', requireAuth, async (req, res) => {
  const source = getSourceForUser(req.params.sourceId, req.currentUser.id)
  if (!source) {
    return res.status(404).json({ error: { message: 'Source not found.', status: 404 } })
  }
  try {
    const sync = await syncSource(source)
    res.json({ source: getSourceForUser(source.id, req.currentUser.id), sync })
  } catch (error) {
    res.status(400).json({ error: { message: error.message || 'Could not sync source.', status: 400 } })
  }
})

app.get('/api/me/calendar', requireAuth, (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : null
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 100
  res.json({ items: listCalendarItems(req.currentUser.id, { category, limit, order: 'asc' }) })
})

app.get('/api/me/classes', requireAuth, (req, res) => {
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20
  const term = typeof req.query.term === 'string' ? req.query.term : 'auto'
  const mode = typeof req.query.mode === 'string' ? req.query.mode : 'display'
  const data = getClassItemsForUser(req.currentUser.id, { limit, term, mode })
  res.json(data)
})

app.get('/api/me/events', requireAuth, (req, res) => {
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20
  res.json({ items: listCalendarItems(req.currentUser.id, { category: 'event', limit, order: 'asc' }) })
})

app.get('/', (_req, res) => {
  res.redirect(clientAppUrl)
})

app.listen(port, host, () => {
  console.log(`HackIndy backend listening on ${publicBaseUrl}`)
  console.log(`Purdue link mode: ${purdueAuthMode}`)
})
