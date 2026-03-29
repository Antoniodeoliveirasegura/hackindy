export const routes = [
  { id: 31, num: '1', name: 'Route 1 – Crimson', shortName: 'Crimson', color: '#990000' },
  { id: 19, num: '2', name: 'Route 2 – Gray', shortName: 'Gray', color: '#83786F' },
  { id: 32, num: '3', name: 'Route 3 – Yellow', shortName: 'Yellow', color: '#F1BE48' },
  { id: 27, num: '4', name: 'Route 4 – Blue', shortName: 'Blue', color: '#006298' },
  { id: 33, num: '5', name: 'Route 5 – Purple', shortName: 'Purple', color: '#66435A' },
  { id: 34, num: '7', name: 'Route 7 – Orange', shortName: 'Orange', color: '#e68217' },
]

/**
 * Offline fallback when /api/transit/routes has not loaded yet (or fails).
 * Merged with live TransLoc route definitions for automatic new-variant support.
 */
export const TRANLOC_ROUTE_ALIASES = {
  18: 31,
  3: 32,
  22: 32,
  25: 32,
  26: 32,
  20: 27,
  23: 27,
  24: 27,
  13: 33,
  21: 33,
  28: 33,
  29: 34,
}

export const UNKNOWN_ROUTE = {
  id: -1,
  num: '?',
  name: 'Shuttle',
  shortName: 'Bus',
  color: '#64748b',
}

/** Map raw TransLoc RouteID -> canonical UI route id (see `routes`). */
export function canonicalFromMap(map, routeId) {
  const n = Number(routeId)
  if (!Number.isFinite(n)) return null
  return map[n] ?? n
}

/** Printed route number in TransLoc description → canonical id (see `routes`). */
const ROUTE_NUM_TO_CANON = {
  1: 31,
  2: 19,
  3: 32,
  4: 27,
  5: 33,
  6: 6,
  7: 34,
}

/**
 * Infer canonical route from TransLoc GetRoutes row (Description + MapLineColor).
 * Skips charter / unmapped shuttles.
 */
export function inferCanonicalFromTransLocRoute(row) {
  const rawDesc = String(row.Description || '')
  const d = rawDesc.toLowerCase()
  if (/\bcharter\b/.test(d)) return null

  const numMatch = rawDesc.match(/\broute\s*(\d+)\b/i)
  if (numMatch) {
    const cid = ROUTE_NUM_TO_CANON[numMatch[1]]
    if (cid != null) return cid
    return null
  }

  const rules = [
    [/orange/, 34],
    [/purple/, 33],
    [/blue/, 27],
    [/yellow/, 32],
    [/gray|grey/, 19],
    [/crimson/, 31],
    [/green/, 6],
  ]
  for (const [re, cid] of rules) {
    if (re.test(d)) return cid
  }

  let hex = String(row.MapLineColor || '').trim().toLowerCase()
  if (hex && !hex.startsWith('#')) hex = `#${hex}`
  if (hex) {
    const found = routes.find((r) => r.color.toLowerCase() === hex)
    if (found) return found.id
  }
  return null
}

export function buildTranslocRouteIdMap(apiRoutes) {
  const inferred = {}
  if (Array.isArray(apiRoutes)) {
    for (const row of apiRoutes) {
      const id = Number(row.RouteID)
      if (!Number.isFinite(id)) continue
      const canon = inferCanonicalFromTransLocRoute(row)
      if (canon != null) inferred[id] = canon
    }
  }
  return { ...inferred, ...TRANLOC_ROUTE_ALIASES }
}

export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getOrderedStopsForRoute(stops, routeId, routeIdMap) {
  const out = []
  const seen = new Set()
  for (const s of stops) {
    if (canonicalFromMap(routeIdMap, s.RouteID) !== routeId) continue
    const id = s.RouteStopID != null ? String(s.RouteStopID) : `${s.Latitude},${s.Longitude}`
    if (seen.has(id)) continue
    seen.add(id)
    out.push({
      id,
      name: s.Description,
      lat: s.Latitude,
      lon: s.Longitude,
    })
  }
  return out
}

/** Closest stop on the same canonical route as the vehicle (for dashboard hints). */
export function nearestStopForVehicle(stops, vehicle, routeIdMap) {
  const canon = canonicalFromMap(routeIdMap, vehicle.RouteID)
  if (canon == null) return null
  let best = null
  let bestD = Infinity
  for (const s of stops || []) {
    if (canonicalFromMap(routeIdMap, s.RouteID) !== canon) continue
    const d = haversineMeters(vehicle.Latitude, vehicle.Longitude, s.Latitude, s.Longitude)
    if (d < bestD) {
      bestD = d
      best = s
    }
  }
  if (!best) return null
  return { description: best.Description, meters: bestD }
}
