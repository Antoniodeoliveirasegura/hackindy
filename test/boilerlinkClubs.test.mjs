// Tests for the club directory module (issue #16). The core is pure: rows
// from BoilerLink's organizations API go in, a sorted searchable directory
// comes out, and the search runs over that. The fetch shell and the cache are
// exercised with an injected fetch and clock, so no network.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  BLURB_MAX_LENGTH,
  DEFAULT_PAGE_SIZE,
  IMAGE_PRESET,
  MAX_PAGE_SIZE,
  MIN_TTL_MS,
  SOURCE_URL,
  buildClubDirectory,
  createClubDirectoryCache,
  decodeEntities,
  degradedClubDirectory,
  fetchClubDirectory,
  foldText,
  htmlToText,
  isIndianapolisOrganization,
  matchScore,
  normalizeOrganization,
  parseClubSearchParams,
  searchClubDirectory,
  truncate,
} from '../src/boilerlinkClubs.mjs'

const FIXTURE = JSON.parse(readFileSync(new URL('./fixtures/boilerlink-organizations.json', import.meta.url), 'utf8'))
const ROWS = FIXTURE.value
const NOW = new Date('2026-09-08T12:00:00.000Z')
const ch = (code) => String.fromCharCode(code)

const bySlug = (directory, slug) => directory.clubs.find((c) => c.slug === slug)
const slugs = (result) => result.clubs.map((c) => c.slug)

// ── Text helpers ────────────────────────────────────────────────────────────

test('decodeEntities handles named, decimal and hex entities and leaves unknown ones alone', () => {
  assert.equal(
    decodeEntities('A &amp; B&nbsp;&#39;x&#39; &quot;q&quot; &#8211; &#x2014; &mdash; &bogus; &#0;'),
    `A & B 'x' "q" ${ch(0x2013)} ${ch(0x2014)} ${ch(0x2014)} &bogus; &#0;`,
  )
})

test('htmlToText strips tags, treats block tags as spaces and collapses whitespace', () => {
  assert.equal(htmlToText('<p><strong>Hi</strong>&nbsp;there<br/>x</p><ul><li>one</li></ul>'), 'Hi there x one')
  assert.equal(htmlToText(null), '')
  const bonsai = htmlToText(ROWS.find((r) => r.WebsiteKey === 'abc').Description)
  assert.ok(bonsai.startsWith('Summary - Learn how to develop and grow your own bonsai.'))
  assert.ok(bonsai.includes('abc@purdue.edu'))
  assert.ok(!/<[a-z]/i.test(bonsai))
})

test('foldText makes decorated unicode and accents searchable as plain ASCII', () => {
  // The bonsai club writes its summary in "mathematical bold" letters.
  const bold = ROWS.find((r) => r.WebsiteKey === 'abc').Summary
  assert.ok(foldText(bold).startsWith('the art of adorable tree'))
  assert.equal(foldText('Pokémon GO'), 'pokemon go')
  assert.equal(foldText('  Ethnic / Cultural,  Hobby '), 'ethnic cultural hobby')
})

test('truncate cuts at a word boundary and adds an ellipsis only when needed', () => {
  assert.equal(truncate('short text', 60), 'short text')
  const long = 'aaaaaaaaaa ' + 'word '.repeat(70)
  const cut = truncate(long, 60)
  assert.ok(cut.length <= 60)
  assert.ok(cut.endsWith('word' + ch(0x2026)))
  assert.equal(truncate('x'.repeat(BLURB_MAX_LENGTH)), 'x'.repeat(BLURB_MAX_LENGTH))
})

// ── Indianapolis rule ───────────────────────────────────────────────────────

test('isIndianapolisOrganization trusts the name, and only campus phrasings in free text', () => {
  assert.equal(isIndianapolisOrganization({ name: 'Chess Club Purdue Indianapolis' }), true)
  assert.equal(isIndianapolisOrganization({ name: 'USB Indy' }), true)
  assert.equal(isIndianapolisOrganization({ name: 'Taiwanese Students', shortName: 'TSA Indy' }), true)
  assert.equal(isIndianapolisOrganization({ name: 'Old Club', descriptionText: 'Founded at IUPUI in 2001' }), false)
  assert.equal(
    isIndianapolisOrganization({ name: 'ASHRAE', descriptionText: 'On the West Lafayette campus and, as of 2025, also on the Indianapolis campus.' }),
    true,
  )
  assert.equal(
    isIndianapolisOrganization({ name: 'Sim Racing Club at Purdue', summaryText: 'A student-led organization in Indianapolis competing in iRacing.' }),
    true,
  )
  // Mentions of the city that are not about the campus stay off the list.
  assert.equal(
    isIndianapolisOrganization({ name: 'Dance Marathon', descriptionText: 'Raising money for Riley Hospital for Children in Indianapolis, Indiana.' }),
    false,
  )
  assert.equal(
    isIndianapolisOrganization({ name: 'Sigma Gamma Rho', descriptionText: 'Founded at Butler University in Indianapolis by seven teachers.' }),
    false,
  )
  assert.equal(isIndianapolisOrganization({ name: 'Purdue Sailing Club', descriptionText: 'Eagle Creek near Indianapolis' }), false)
})

// ── Normalization ───────────────────────────────────────────────────────────

test('normalizeOrganization cleans the real rows into the client shape', () => {
  const bonsai = normalizeOrganization(ROWS.find((r) => r.WebsiteKey === 'abc'))
  assert.equal(bonsai.id, '366060')
  assert.equal(bonsai.name, '"ABC" - The Art of Bonsai Club') // leading spaces gone
  assert.equal(bonsai.shortName, null)
  assert.equal(bonsai.slug, 'abc')
  assert.equal(bonsai.url, 'https://boilerlink.purdue.edu/organization/abc')
  assert.equal(
    bonsai.imageUrl,
    `https://se-images.campuslabs.com/clink/images/9070083f-c29a-4a29-8c2b-cfcb7a8181ad54e0e0f7-2979-472c-9603-19dccd86136b.png?preset=${IMAGE_PRESET}`,
  )
  assert.deepEqual(bonsai.categories, ['Ethnic / Cultural', 'Hobby', 'Multicultural'])
  assert.ok(bonsai.blurb.length <= BLURB_MAX_LENGTH + 1)
  assert.equal(bonsai.indianapolis, false)

  const pensa = normalizeOrganization(ROWS.find((r) => r.WebsiteKey === 'home_youthpensausa_org'))
  assert.equal(pensa.shortName, 'PENSA Campus Ministry at Purdue University')

  // Trailing space in the name and in the "International " category.
  const tsa = normalizeOrganization(ROWS.find((r) => r.WebsiteKey === 'tsa_indy'))
  assert.equal(tsa.name, 'Taiwanese Student Association of Purdue Indianapolis')
  assert.equal(tsa.indianapolis, true)
  const vex = normalizeOrganization(ROWS.find((r) => r.WebsiteKey === 'pindy'))
  assert.ok(vex.categories.includes('International'))
  assert.ok(!vex.categories.includes('International '))

  // No logo -> null imageUrl; no description -> blurb from the summary.
  assert.equal(normalizeOrganization(ROWS.find((r) => r.WebsiteKey === 'asec_gso')).imageUrl, null)
  const chess = normalizeOrganization(ROWS.find((r) => r.WebsiteKey === 'indychess'))
  assert.ok(chess.blurb.startsWith('The Purdue Chess Club hosts weekly meetings'))
  assert.equal(chess.shortName, 'Chess Club')
})

test('normalizeOrganization falls back to the description, and rejects unusable rows', () => {
  const base = { Id: '1', Name: 'Sample Org', WebsiteKey: 'sample', Status: 'Active', Visibility: 'Public' }
  const fromDescription = normalizeOrganization({ ...base, Summary: null, Description: '<p>We <b>meet</b> weekly.</p>' })
  assert.equal(fromDescription.blurb, 'We meet weekly.')
  assert.equal(normalizeOrganization({ ...base, ShortName: 'Sample Org' }).shortName, null)
  assert.equal(normalizeOrganization({ ...base, ProfilePicture: '../evil' }).imageUrl, null)
  assert.equal(normalizeOrganization({ ...base, Name: '   ' }), null)
  assert.equal(normalizeOrganization({ ...base, WebsiteKey: '' }), null)
  assert.equal(normalizeOrganization({ ...base, Id: null }), null)
  assert.equal(normalizeOrganization({ ...base, Status: 'Inactive' }), null)
  assert.equal(normalizeOrganization({ ...base, Visibility: 'Private' }), null)
  assert.equal(normalizeOrganization(null), null)
})

test('buildClubDirectory sorts by folded name, dedupes ids and counts categories per scope', () => {
  const directory = buildClubDirectory([...ROWS, ROWS[0]], { now: NOW })
  assert.equal(directory.ok, true)
  assert.equal(directory.source, 'boilerlink-organizations')
  assert.equal(directory.sourceUrl, SOURCE_URL)
  assert.equal(directory.fetchedAt, NOW.toISOString())
  assert.equal(directory.clubs.length, ROWS.length) // the duplicate row collapsed
  assert.deepEqual(slugs(directory), [
    '3dprintedprostheticsclub',
    'abc',
    'asec_gso',
    'ashrae',
    'indychess',
    'dancemarathon',
    'home_youthpensausa_org',
    'pogopurdue',
    'simracingclub',
    'indianapolistaekwondo',
    'tsa_indy',
    'usbindy',
    'pindy',
  ])
  assert.equal(directory.indianapolisTotal, 7)
  assert.deepEqual(
    directory.clubs.filter((c) => c.indianapolis).map((c) => c.slug),
    ['ashrae', 'indychess', 'simracingclub', 'indianapolistaekwondo', 'tsa_indy', 'usbindy', 'pindy'],
  )
  const hobby = directory.categories.find((c) => c.name === 'Hobby')
  assert.deepEqual(hobby, { name: 'Hobby', count: 7, indianapolisCount: 4 })
  assert.deepEqual(directory.categories.map((c) => c.name), [...directory.categories.map((c) => c.name)].sort((a, b) => a.localeCompare(b, 'en')))
  assert.equal(directory.index.length, directory.clubs.length)
  assert.equal(buildClubDirectory('nonsense', { now: NOW }).clubs.length, 0)
})

// ── Search ──────────────────────────────────────────────────────────────────

test('parseClubSearchParams validates loose query input', () => {
  assert.deepEqual(parseClubSearchParams({}), { q: '', category: '', scope: 'all', page: 1, pageSize: DEFAULT_PAGE_SIZE })
  assert.deepEqual(parseClubSearchParams({ q: ['  chess   club ', 'x'], category: ' Hobby ', scope: 'INDIANAPOLIS', page: '3', pageSize: '10' }), {
    q: 'chess club',
    category: 'Hobby',
    scope: 'indianapolis',
    page: 3,
    pageSize: 10,
  })
  const loose = parseClubSearchParams({ q: 'x'.repeat(500), scope: 'mars', page: '0', pageSize: '9999' })
  assert.equal(loose.q.length, 100)
  assert.equal(loose.scope, 'all')
  assert.equal(loose.page, 1)
  assert.equal(loose.pageSize, MAX_PAGE_SIZE)
  assert.equal(parseClubSearchParams({ page: 'abc', pageSize: { nested: true } }).page, 1)
  assert.equal(parseClubSearchParams({ page: 'abc', pageSize: { nested: true } }).pageSize, DEFAULT_PAGE_SIZE)
})

test('matchScore ranks whole-phrase name hits over token hits over body hits', () => {
  const index = { head: 'chess club purdue indianapolis chess club indychess', text: 'chess club purdue indianapolis chess club indychess hobby weekly meetings for players' }
  assert.equal(matchScore(index, '', []), 1)
  assert.equal(matchScore(index, 'chess club', ['chess', 'club']), 3)
  assert.equal(matchScore(index, 'club chess', ['club', 'chess']), 2)
  assert.equal(matchScore(index, 'weekly players', ['weekly', 'players']), 1)
  assert.equal(matchScore(index, 'weekly tennis', ['weekly', 'tennis']), 0)
})

test('searchClubDirectory filters by scope and category and matches folded text', () => {
  const directory = buildClubDirectory(ROWS, { now: NOW })
  const all = searchClubDirectory(directory)
  assert.equal(all.total, 13)
  assert.equal(all.pages, 1)
  assert.equal(all.directoryTotal, 13)
  assert.equal(all.indianapolisTotal, 7)
  assert.equal(all.scope, 'all')
  assert.equal(all.stale, false)
  assert.equal(all.categories.length, directory.categories.length)
  assert.equal('index' in all, false)

  assert.equal(searchClubDirectory(directory, { scope: 'indianapolis' }).total, 7)
  assert.equal(searchClubDirectory(directory, { category: 'hobby' }).total, 7)
  assert.equal(searchClubDirectory(directory, { category: 'International' }).total, 2)
  assert.equal(searchClubDirectory(directory, { category: 'Hobby', scope: 'indianapolis' }).total, 4)

  assert.deepEqual(slugs(searchClubDirectory(directory, { q: 'chess' })), ['indychess'])
  assert.deepEqual(slugs(searchClubDirectory(directory, { q: 'TSA' })), ['tsa_indy'])
  // Bold-unicode summary and an accented name both match plain typing.
  assert.deepEqual(slugs(searchClubDirectory(directory, { q: 'adorable' })), ['abc'])
  assert.deepEqual(slugs(searchClubDirectory(directory, { q: 'pokemon' })), ['pogopurdue'])
  assert.deepEqual(slugs(searchClubDirectory(directory, { q: 'zzzz' })), [])
  // Every token has to match somewhere.
  assert.equal(searchClubDirectory(directory, { q: 'chess sailing' }).total, 0)
})

test('searchClubDirectory puts name matches before blurb matches', () => {
  const directory = buildClubDirectory(ROWS, { now: NOW })
  const result = searchClubDirectory(directory, { q: 'club' })
  const names = result.clubs.map((c) => c.name.toLowerCase())
  const firstBodyOnly = names.findIndex((n) => !n.includes('club'))
  const lastNameHit = names.map((n) => n.includes('club')).lastIndexOf(true)
  assert.ok(result.total >= 7)
  assert.ok(firstBodyOnly === -1 || lastNameHit < firstBodyOnly)
})

test('searchClubDirectory pages and clamps out-of-range pages', () => {
  const directory = buildClubDirectory(ROWS, { now: NOW })
  const second = searchClubDirectory(directory, { pageSize: 5, page: 2 })
  assert.equal(second.pages, 3)
  assert.equal(second.page, 2)
  assert.deepEqual(slugs(second), slugs(searchClubDirectory(directory)).slice(5, 10))
  const beyond = searchClubDirectory(directory, { pageSize: 5, page: 9 })
  assert.equal(beyond.page, 3)
  assert.equal(beyond.clubs.length, 3)
  assert.equal(searchClubDirectory(directory, { q: 'zzzz', pageSize: 5, page: 4 }).page, 1)
})

test('searchClubDirectory passes stale through and reports a degraded directory honestly', () => {
  const directory = buildClubDirectory(ROWS, { now: NOW })
  assert.equal(searchClubDirectory(directory, {}, { stale: true }).stale, true)
  const degraded = searchClubDirectory(degradedClubDirectory('timeout', NOW), { q: 'chess' })
  assert.equal(degraded.ok, false)
  assert.equal(degraded.error, 'timeout')
  assert.deepEqual(degraded.clubs, [])
  assert.deepEqual(degraded.categories, [])
  assert.equal(degraded.total, 0)
  assert.equal(degraded.directoryTotal, 0)
  assert.equal(degraded.fetchedAt, NOW.toISOString())
})

// ── Fetch shell ─────────────────────────────────────────────────────────────

function pagedFetch(rows, { pageSize, failOn = null, count = rows.length } = {}) {
  const calls = []
  const fetchImpl = async (url) => {
    calls.push(url)
    const u = new URL(url)
    const skip = Number(u.searchParams.get('skip'))
    if (failOn === skip) return { ok: false, status: 500 }
    return {
      ok: true,
      status: 200,
      json: async () => ({ '@odata.count': count, value: rows.slice(skip, skip + pageSize) }),
    }
  }
  return { fetchImpl, calls }
}

test('fetchClubDirectory pages through the API, first page for the count, then the rest', async () => {
  const { fetchImpl, calls } = pagedFetch(ROWS, { pageSize: 5 })
  const directory = await fetchClubDirectory({ fetchImpl, now: NOW, pageSize: 5 })
  assert.equal(directory.ok, true)
  assert.equal(directory.clubs.length, 13)
  assert.equal(calls.length, 3)
  const params = calls.map((c) => new URL(c).searchParams)
  assert.deepEqual(params.map((p) => p.get('skip')), ['0', '5', '10'])
  assert.ok(params.every((p) => p.get('top') === '5' && p.get('orderBy[0]') === 'UpperName asc'))
  assert.ok(calls.every((c) => c.startsWith(SOURCE_URL)))
})

test('fetchClubDirectory degrades instead of serving a partial list', async () => {
  const firstFails = await fetchClubDirectory({ ...pagedFetch(ROWS, { pageSize: 5, failOn: 0 }), now: NOW, pageSize: 5 })
  assert.equal(firstFails.ok, false)
  assert.equal(firstFails.error, 'http-500')
  const laterFails = await fetchClubDirectory({ ...pagedFetch(ROWS, { pageSize: 5, failOn: 10 }), now: NOW, pageSize: 5 })
  assert.equal(laterFails.ok, false)
  assert.equal(laterFails.error, 'http-500')
  assert.deepEqual(laterFails.clubs, [])

  const badJson = await fetchClubDirectory({ fetchImpl: async () => ({ ok: true, json: async () => ({ nope: true }) }), now: NOW })
  assert.equal(badJson.error, 'bad-payload')
  const empty = await fetchClubDirectory({ fetchImpl: async () => ({ ok: true, json: async () => ({ '@odata.count': 0, value: [] }) }), now: NOW })
  assert.equal(empty.error, 'no-organizations')
  const thrown = await fetchClubDirectory({ fetchImpl: async () => { throw new Error('ECONNRESET') }, now: NOW })
  assert.equal(thrown.error, 'ECONNRESET')
})

test('fetchClubDirectory times out through the abort signal', async () => {
  const fetchImpl = (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
    })
  const directory = await fetchClubDirectory({ fetchImpl, now: NOW, timeoutMs: 5 })
  assert.equal(directory.ok, false)
  assert.equal(directory.error, 'timeout')
})

test('fetchClubDirectory honors a custom source url and caps runaway page counts', async () => {
  const { fetchImpl, calls } = pagedFetch(ROWS, { pageSize: 5, count: 1_000_000 })
  const directory = await fetchClubDirectory({ fetchImpl, url: 'https://example.test/orgs', now: NOW, pageSize: 5 })
  assert.equal(directory.ok, true)
  assert.equal(calls.length, 20)
  assert.ok(calls.every((c) => c.startsWith('https://example.test/orgs?')))
})

// ── Cache ───────────────────────────────────────────────────────────────────

function fakeClock(start = NOW) {
  let t = start.getTime()
  return { now: () => new Date(t), advance: (ms) => { t += ms } }
}

function scriptedFetcher(script) {
  let n = 0
  const calls = []
  const fetchDirectory = async ({ now }) => {
    const step = script[Math.min(n, script.length - 1)]
    n += 1
    calls.push(now.toISOString())
    return step === 'fail' ? degradedClubDirectory('http-503', now) : buildClubDirectory(step, { now })
  }
  return { fetchDirectory, calls }
}

test('cache fetches once, serves fresh copies without refetching, and floors the TTL', async () => {
  const clock = fakeClock()
  const { fetchDirectory, calls } = scriptedFetcher([ROWS])
  const cache = createClubDirectoryCache({ ttlMs: 1000, now: clock.now, fetchDirectory })
  assert.equal(cache.ttlMs, MIN_TTL_MS)

  const [a, b] = await Promise.all([cache.get(), cache.get()])
  assert.equal(calls.length, 1) // concurrent callers share the fetch
  assert.equal(a.directory, b.directory)
  assert.equal(a.stale, false)
  assert.equal(a.directory.clubs.length, 13)

  clock.advance(MIN_TTL_MS - 1)
  const c = await cache.get()
  assert.equal(calls.length, 1)
  assert.equal(c.stale, false)
})

test('cache serves the stale copy immediately and refreshes in the background', async () => {
  const clock = fakeClock()
  const { fetchDirectory, calls } = scriptedFetcher([ROWS.slice(0, 5), ROWS])
  const cache = createClubDirectoryCache({ ttlMs: MIN_TTL_MS, now: clock.now, fetchDirectory })
  const first = await cache.get()
  assert.equal(first.directory.clubs.length, 5)

  clock.advance(MIN_TTL_MS + 1)
  const stale = await cache.get()
  assert.equal(stale.stale, true)
  assert.equal(stale.directory, first.directory) // old copy, no waiting
  await cache.refresh() // joins the in-flight background refresh
  assert.equal(calls.length, 2)
  assert.equal(cache.peek().clubs.length, 13)
  assert.equal((await cache.get()).stale, false)
})

test('cache keeps the last good copy through a failed refresh and retries after a minute', async () => {
  const clock = fakeClock()
  const { fetchDirectory, calls } = scriptedFetcher([ROWS, 'fail', 'fail', ROWS.slice(0, 3)])
  const cache = createClubDirectoryCache({ ttlMs: MIN_TTL_MS, now: clock.now, fetchDirectory })
  const good = (await cache.get()).directory

  clock.advance(MIN_TTL_MS + 1)
  await cache.get() // kicks off the failing refresh
  await cache.refresh()
  assert.equal(calls.length, 2)
  assert.equal(cache.peek(), good) // failure did not replace the good copy

  clock.advance(30_000)
  const within = await cache.get()
  assert.equal(within.directory, good)
  assert.equal(within.stale, false) // inside the retry hold-off, no upstream call
  assert.equal(calls.length, 2)

  clock.advance(31_000)
  const after = await cache.get()
  assert.equal(after.stale, true)
  await cache.refresh()
  assert.equal(calls.length, 3)
  assert.equal(cache.peek(), good)

  clock.advance(61_000)
  await cache.get()
  await cache.refresh()
  assert.equal(calls.length, 4)
  assert.equal(cache.peek().clubs.length, 3)
})

test('cache serves the degraded directory for a minute when nothing good was ever fetched', async () => {
  const clock = fakeClock()
  const { fetchDirectory, calls } = scriptedFetcher(['fail', ROWS])
  const cache = createClubDirectoryCache({ now: clock.now, fetchDirectory })
  const first = await cache.get()
  assert.equal(first.directory.ok, false)
  assert.equal(first.directory.error, 'http-503')

  clock.advance(10_000)
  const second = await cache.get()
  assert.equal(second.directory.ok, false)
  assert.equal(calls.length, 1)

  clock.advance(60_000)
  const third = await cache.get()
  assert.equal(third.directory.ok, true)
  assert.equal(third.stale, false)
  assert.equal(calls.length, 2)
})
