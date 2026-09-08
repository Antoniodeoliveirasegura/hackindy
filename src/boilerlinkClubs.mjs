// Student organization directory (issue #16, the "club directory" path).
//
// BoilerLink is Purdue's Anthology Engage instance, and its organizations
// search is a public JSON API: no key, no login, about 1,200 active orgs with
// a name, an HTML description, a one-line summary, categories, a logo id and
// the WebsiteKey that forms each org's BoilerLink page URL. Event feeds are
// NOT reachable this way (per-org iCal links are admin-generated and the
// Engage API needs OAuth keys only a campus admin can issue), so this module
// stops at the directory and deep-links to BoilerLink for events, membership
// and contacts.
//
// BoilerLink covers every Purdue campus, and most orgs meet in West Lafayette.
// The ones that identify as Indianapolis groups are flagged so the app can show
// them first (see isIndianapolisOrganization for the exact rule).
//
// Shape of this module, mirroring parkingStatus.mjs: a pure core (raw API rows
// in, a normalized searchable directory out, plus the search itself), a fetch
// shell that pages through the API and never throws, and a small cache that
// serves the last good directory while a refresh runs. server.mjs owns the
// route. See docs/clubs.md for the data contract.

export const SOURCE_URL = 'https://boilerlink.purdue.edu/api/discovery/search/organizations'
export const ORGANIZATION_PAGE_BASE = 'https://boilerlink.purdue.edu/organization/'
export const IMAGE_BASE = 'https://se-images.campuslabs.com/clink/images/'
// "med-sq" is a 170x170 JPEG (about 5 KB); "small-sq" is 75x75. Cards render
// the logo at 56-64 CSS px, so the medium preset stays sharp on phones.
export const IMAGE_PRESET = 'med-sq'

export const DEFAULT_PAGE_SIZE = 24
export const MAX_PAGE_SIZE = 100
export const MAX_QUERY_LENGTH = 100
export const BLURB_MAX_LENGTH = 280
export const SCOPES = ['all', 'indianapolis']

const UPSTREAM_PAGE_SIZE = 300
const UPSTREAM_MAX_PAGES = 20
const FETCH_TIMEOUT_MS = 15_000
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000
export const MIN_TTL_MS = 5 * 60 * 1000
// After a failed refresh, wait this long before asking BoilerLink again so an
// outage costs one upstream attempt per minute, not one per page view.
const RETRY_AFTER_FAILURE_MS = 60 * 1000

// ── Text helpers (pure) ─────────────────────────────────────────────────────

// Named entities BoilerLink's editor emits. Code points rather than literal
// characters so the repo's "no em/en dashes" check stays clean.
const NAMED_ENTITIES = {
  amp: 0x26,
  lt: 0x3c,
  gt: 0x3e,
  quot: 0x22,
  apos: 0x27,
  nbsp: 0x20,
  ndash: 0x2013,
  mdash: 0x2014,
  hellip: 0x2026,
  lsquo: 0x2018,
  rsquo: 0x2019,
  ldquo: 0x201c,
  rdquo: 0x201d,
  bull: 0x2022,
  middot: 0xb7,
  copy: 0xa9,
  reg: 0xae,
  trade: 0x2122,
}

export function decodeEntities(text) {
  return String(text ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
    const lower = body.toLowerCase()
    let code = null
    if (lower.startsWith('#x')) code = Number.parseInt(lower.slice(2), 16)
    else if (lower.startsWith('#')) code = Number.parseInt(lower.slice(1), 10)
    else if (Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, lower)) code = NAMED_ENTITIES[lower]
    if (code == null || !Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match
    try {
      return String.fromCodePoint(code)
    } catch {
      return match
    }
  })
}

/** HTML fragment -> plain text with single spaces. Block tags become spaces. */
export function htmlToText(html) {
  const withBreaks = String(html ?? '')
    .replace(/<\s*(br|p|div|li|ul|ol|h[1-6]|tr|td|th|blockquote)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  return decodeEntities(withBreaks).replace(/\s+/g, ' ').trim()
}

/**
 * Search folding: compatibility-normalize (so the "mathematical bold" letters
 * some orgs decorate their summary with match plain ASCII), lowercase, and drop
 * diacritics (Pokémon -> pokemon).
 */
export function foldText(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** Cut at a word boundary and add an ellipsis when the text is too long. */
export function truncate(text, max = BLURB_MAX_LENGTH) {
  const value = String(text ?? '').trim()
  if (value.length <= max) return value
  const cut = value.lastIndexOf(' ', max - 1)
  return value.slice(0, cut > max * 0.6 ? cut : max - 1).replace(/[\s,;:.-]+$/, '') + String.fromCharCode(0x2026)
}

// ── Indianapolis detection ──────────────────────────────────────────────────

// Name or short name says Indianapolis (or Indy, or the campus's former IUPUI
// name): 56 of about 1,200 orgs, all genuine on review (2026-09-08).
const NAME_RE = /indianapolis|\bindy\b|\biupui\b/i
// Free text is noisier ("Riley Hospital in Indianapolis", "founded at Butler
// University in Indianapolis"), so only campus-specific phrasings count there.
const TEXT_RE = /\b(?:purdue(?:\s+university)?(?:\s+in)?\s+indianapolis|indianapolis\s+campus|campus\s+in\s+indianapolis|(?:based|located|organization|club|chapter|team|students?)\s+in\s+indianapolis)\b/i

export function isIndianapolisOrganization({ name, shortName, summaryText, descriptionText }) {
  if (NAME_RE.test(`${name ?? ''} ${shortName ?? ''}`)) return true
  return TEXT_RE.test(`${summaryText ?? ''} ${descriptionText ?? ''}`)
}

// ── Normalization (pure) ────────────────────────────────────────────────────

function cleanName(value) {
  return decodeEntities(String(value ?? ''))
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanCategories(names) {
  if (!Array.isArray(names)) return []
  const seen = new Set()
  const out = []
  for (const raw of names) {
    const name = cleanName(raw)
    if (!name || seen.has(name)) continue
    seen.add(name)
    out.push(name)
  }
  return out
}

export function organizationUrl(slug) {
  return ORGANIZATION_PAGE_BASE + encodeURIComponent(slug)
}

export function imageUrl(profilePicture) {
  const id = String(profilePicture ?? '').trim()
  if (!id || !/^[A-Za-z0-9._-]+$/.test(id)) return null
  return `${IMAGE_BASE}${id}?preset=${IMAGE_PRESET}`
}

/**
 * One raw API row -> one club, or null when the row cannot be linked to a
 * BoilerLink page (no id, no name or no WebsiteKey). Only "Active" + "Public"
 * rows pass; today the API returns nothing else, but the filter costs nothing.
 */
export function normalizeOrganization(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = String(raw.Id ?? '').trim()
  const name = cleanName(raw.Name)
  const slug = String(raw.WebsiteKey ?? '').trim()
  if (!id || !name || !slug) return null
  if (raw.Status && String(raw.Status).toLowerCase() !== 'active') return null
  if (raw.Visibility && String(raw.Visibility).toLowerCase() !== 'public') return null

  const shortName = cleanName(raw.ShortName) || null
  const summaryText = htmlToText(raw.Summary)
  const descriptionText = htmlToText(raw.Description)
  const blurb = truncate(summaryText || descriptionText)
  const categories = cleanCategories(raw.CategoryNames)

  return {
    id,
    name,
    shortName: shortName && shortName !== name ? shortName : null,
    slug,
    url: organizationUrl(slug),
    imageUrl: imageUrl(raw.ProfilePicture),
    blurb,
    categories,
    indianapolis: isIndianapolisOrganization({ name, shortName, summaryText, descriptionText }),
  }
}

function compareClubs(a, b) {
  const byName = a.sortKey.localeCompare(b.sortKey, 'en')
  return byName !== 0 ? byName : a.club.id.localeCompare(b.club.id)
}

function indexFor(club) {
  const head = foldText([club.name, club.shortName, club.slug.replace(/[_-]+/g, ' ')].filter(Boolean).join(' '))
  const body = foldText([club.categories.join(' '), club.blurb].join(' '))
  return { head, text: `${head} ${body}`.trim() }
}

function categoryTable(clubs) {
  const counts = new Map()
  for (const club of clubs) {
    for (const name of club.categories) {
      const row = counts.get(name) || { name, count: 0, indianapolisCount: 0 }
      row.count += 1
      if (club.indianapolis) row.indianapolisCount += 1
      counts.set(name, row)
    }
  }
  return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'))
}

/** Raw rows in, sorted searchable directory out. Never throws. */
export function buildClubDirectory(rawOrganizations, { now = new Date() } = {}) {
  const rows = Array.isArray(rawOrganizations) ? rawOrganizations : []
  const seen = new Set()
  const entries = []
  for (const raw of rows) {
    const club = normalizeOrganization(raw)
    if (!club || seen.has(club.id)) continue
    seen.add(club.id)
    entries.push({ club, sortKey: foldText(club.name) || club.name.toLowerCase() })
  }
  entries.sort(compareClubs)
  const clubs = entries.map((e) => e.club)
  return {
    ok: true,
    source: 'boilerlink-organizations',
    sourceUrl: SOURCE_URL,
    fetchedAt: now.toISOString(),
    clubs,
    index: clubs.map(indexFor),
    categories: categoryTable(clubs),
    indianapolisTotal: clubs.filter((c) => c.indianapolis).length,
  }
}

/** What the cache holds when BoilerLink has never answered. */
export function degradedClubDirectory(error, now = new Date()) {
  return {
    ok: false,
    error: String(error),
    source: 'boilerlink-organizations',
    sourceUrl: SOURCE_URL,
    fetchedAt: now.toISOString(),
    clubs: [],
    index: [],
    categories: [],
    indianapolisTotal: 0,
  }
}

// ── Search (pure) ───────────────────────────────────────────────────────────

function firstString(value) {
  if (Array.isArray(value)) return firstString(value[0])
  return typeof value === 'string' ? value : ''
}

function clampInt(value, { min, max, fallback }) {
  const n = Number.parseInt(firstString(value) || String(value ?? ''), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/** Express `req.query` (or any loose object) -> validated search params. */
export function parseClubSearchParams(query = {}) {
  const q = firstString(query.q).replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH)
  const category = firstString(query.category).replace(/\s+/g, ' ').trim().slice(0, 80)
  const scopeRaw = firstString(query.scope).trim().toLowerCase()
  const scope = SCOPES.includes(scopeRaw) ? scopeRaw : 'all'
  return {
    q,
    category,
    scope,
    page: clampInt(query.page, { min: 1, max: 10_000, fallback: 1 }),
    pageSize: clampInt(query.pageSize, { min: 1, max: MAX_PAGE_SIZE, fallback: DEFAULT_PAGE_SIZE }),
  }
}

/**
 * Score a club against folded query tokens: 3 when the name contains the whole
 * phrase, 2 when every token is in the name / short name / slug, 1 when every
 * token is somewhere in the categories or blurb, 0 for no match.
 */
export function matchScore(index, folded, tokens) {
  if (tokens.length === 0) return 1
  if (index.head.includes(folded)) return 3
  if (tokens.every((t) => index.head.includes(t))) return 2
  if (tokens.every((t) => index.text.includes(t))) return 1
  return 0
}

/** Pure search over a built directory. `stale` is passed through for the client. */
export function searchClubDirectory(directory, params = {}, { stale = false } = {}) {
  const { q, category, scope, page, pageSize } = { ...parseClubSearchParams({}), ...params }
  const folded = foldText(q)
  const tokens = folded ? folded.split(' ') : []
  const categoryKey = foldText(category)

  const matches = []
  directory.clubs.forEach((club, i) => {
    if (scope === 'indianapolis' && !club.indianapolis) return
    if (categoryKey && !club.categories.some((c) => foldText(c) === categoryKey)) return
    const score = matchScore(directory.index[i], folded, tokens)
    if (score === 0) return
    matches.push({ club, score, order: i })
  })
  matches.sort((a, b) => b.score - a.score || a.order - b.order)

  const total = matches.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize

  return {
    ok: directory.ok,
    ...(directory.ok ? {} : { error: directory.error }),
    source: directory.source,
    sourceUrl: directory.sourceUrl,
    fetchedAt: directory.fetchedAt,
    stale,
    directoryTotal: directory.clubs.length,
    indianapolisTotal: directory.indianapolisTotal,
    q,
    category,
    scope,
    page: current,
    pageSize,
    pages,
    total,
    clubs: matches.slice(start, start + pageSize).map((m) => m.club),
    categories: directory.categories,
  }
}

// ── Fetch shell ─────────────────────────────────────────────────────────────

function pageUrl(base, { top, skip }) {
  const url = new URL(base)
  url.searchParams.set('top', String(top))
  url.searchParams.set('skip', String(skip))
  url.searchParams.set('orderBy[0]', 'UpperName asc')
  return url.toString()
}

async function fetchPage(fetchImpl, url, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'BoilerIndy/1.0 (+https://www.boilerindy.app)', accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`http-${res.status}`)
    const body = await res.json()
    if (!body || !Array.isArray(body.value)) throw new Error('bad-payload')
    const count = Number(body['@odata.count'])
    return { value: body.value, count: Number.isFinite(count) ? count : null }
  } catch (error) {
    throw new Error(error?.name === 'AbortError' ? 'timeout' : String(error?.message || error))
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Pages through the organizations API (first page sequentially for the total,
 * the rest in parallel) and builds the directory. Never throws: any failure
 * yields a degraded directory, because a partial list would silently hide orgs.
 */
export async function fetchClubDirectory({
  fetchImpl = globalThis.fetch,
  url = process.env.BOILERLINK_CLUBS_URL || SOURCE_URL,
  now = new Date(),
  timeoutMs = FETCH_TIMEOUT_MS,
  pageSize = UPSTREAM_PAGE_SIZE,
} = {}) {
  try {
    const first = await fetchPage(fetchImpl, pageUrl(url, { top: pageSize, skip: 0 }), timeoutMs)
    const total = first.count ?? first.value.length
    const pageCount = Math.min(UPSTREAM_MAX_PAGES, Math.max(1, Math.ceil(total / pageSize)))
    const rest = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, i) =>
        fetchPage(fetchImpl, pageUrl(url, { top: pageSize, skip: (i + 1) * pageSize }), timeoutMs),
      ),
    )
    const rows = [first, ...rest].flatMap((p) => p.value)
    if (rows.length === 0) return degradedClubDirectory('no-organizations', now)
    return buildClubDirectory(rows, { now })
  } catch (error) {
    return degradedClubDirectory(error?.message || error, now)
  }
}

// ── Cache ───────────────────────────────────────────────────────────────────

/**
 * Serves the last good directory instantly and refreshes it in the background
 * once the TTL passes (stale-while-revalidate). Concurrent callers share one
 * upstream fetch. A failed refresh keeps the last good copy and retries after
 * a minute; with no good copy yet, the degraded directory is served for that
 * minute instead of hammering BoilerLink.
 */
export function createClubDirectoryCache({
  ttlMs = DEFAULT_TTL_MS,
  now = () => new Date(),
  fetchDirectory = fetchClubDirectory,
  fetchOptions = {},
} = {}) {
  const ttl = Math.max(MIN_TTL_MS, Number(ttlMs) || DEFAULT_TTL_MS)
  let current = null
  let expiresAt = 0
  let inflight = null

  async function refresh() {
    if (inflight) return inflight
    inflight = (async () => {
      const at = now()
      const next = await fetchDirectory({ ...fetchOptions, now: at })
      const finishedAt = now().getTime()
      if (next.ok) {
        current = next
        expiresAt = finishedAt + ttl
      } else {
        if (!current) current = next
        expiresAt = finishedAt + RETRY_AFTER_FAILURE_MS
      }
      return current
    })().finally(() => {
      inflight = null
    })
    return inflight
  }

  async function get() {
    const t = now().getTime()
    if (current && t < expiresAt) return { directory: current, stale: false }
    if (current && current.ok) {
      void refresh().catch(() => {})
      return { directory: current, stale: true }
    }
    const directory = await refresh()
    return { directory, stale: false }
  }

  return {
    get,
    refresh,
    peek: () => current,
    ttlMs: ttl,
  }
}
