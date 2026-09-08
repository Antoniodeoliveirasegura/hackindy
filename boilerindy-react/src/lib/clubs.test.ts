import { describe, expect, test } from 'vitest'
import { CLUBS_PAGE_SIZE, buildClubsQuery, categoryCount, formatFetched, initialsFor, resultsLabel, scopeFromParam } from './clubs'

// Issue #16 - the clubs page builds its API queries and labels with these
// helpers; keep the URL short and the copy honest about what is filtered.

describe('buildClubsQuery', () => {
  test('omits defaults entirely', () => {
    expect(buildClubsQuery({})).toBe('')
    expect(buildClubsQuery({ q: '   ', category: '', scope: 'all', page: 1, pageSize: CLUBS_PAGE_SIZE })).toBe('')
  })
  test('encodes every non-default parameter', () => {
    expect(buildClubsQuery({ q: ' chess & go ', category: 'Club Sports', scope: 'indianapolis', page: 2.7, pageSize: 10 })).toBe(
      '?q=chess+%26+go&category=Club+Sports&scope=indianapolis&page=2&pageSize=10',
    )
  })
})

describe('scopeFromParam', () => {
  test('defaults to Indianapolis unless the param says all', () => {
    expect(scopeFromParam(null)).toBe('indianapolis')
    expect(scopeFromParam('indianapolis')).toBe('indianapolis')
    expect(scopeFromParam('bogus')).toBe('indianapolis')
    expect(scopeFromParam('all')).toBe('all')
  })
})

describe('initialsFor', () => {
  test('takes the first letter of the first two words, skipping punctuation', () => {
    expect(initialsFor('Chess Club Purdue Indianapolis')).toBe('CC')
    expect(initialsFor('"ABC" - The Art of Bonsai Club')).toBe('AT')
    expect(initialsFor('3D Printed Prosthetics Club')).toBe('3P')
    expect(initialsFor('Pokémon')).toBe('P')
    expect(initialsFor('---')).toBe('?')
  })
})

describe('categoryCount', () => {
  test('follows the scope', () => {
    const row = { name: 'Hobby', count: 293, indianapolisCount: 9 }
    expect(categoryCount(row, 'all')).toBe(293)
    expect(categoryCount(row, 'indianapolis')).toBe(9)
  })
})

describe('resultsLabel', () => {
  test('describes the unfiltered list per scope', () => {
    expect(resultsLabel({ total: 58, q: '', category: '', scope: 'indianapolis' })).toBe('58 organizations in Indianapolis')
    expect(resultsLabel({ total: 1208, q: '', category: '', scope: 'all' })).toBe('1,208 organizations across Purdue')
    expect(resultsLabel({ total: 1, q: '', category: '', scope: 'all' })).toBe('1 organization across Purdue')
  })
  test('names the query and category when filtering', () => {
    expect(resultsLabel({ total: 3, q: 'chess', category: '', scope: 'indianapolis' })).toBe('3 matches for "chess" in Indianapolis')
    expect(resultsLabel({ total: 1, q: 'chess', category: 'Hobby', scope: 'all' })).toBe('1 match for "chess" in Hobby across Purdue')
    expect(resultsLabel({ total: 0, q: '', category: 'Dance', scope: 'indianapolis' })).toBe('0 matches in Dance in Indianapolis')
  })
})

describe('formatFetched', () => {
  test('says today for same-day stamps and dates otherwise', () => {
    const now = new Date('2026-09-08T15:00:00')
    expect(formatFetched('2026-09-08T06:04:00', now)).toMatch(/^today at 6:04/)
    expect(formatFetched('2026-09-07T22:30:00', now)).toMatch(/^Sep 7 at 10:30/)
    expect(formatFetched('garbage', now)).toBeNull()
  })
})
