import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icons'

const STATIC_LOCATIONS = [
  {
    id: 'library-cafe',
    name: 'Library Café',
    source: 'static',
    status: 'open',
    hours: 'Closes 10:00 PM',
    meal: 'Coffee & Snacks',
    rating: 4.7,
    entrees: ['Bagels', 'Muffins', 'Breakfast Sandwiches'],
    sides: ['Yogurt Parfait', 'Fruit Cup'],
    desserts: ['Pastries', 'Cookies'],
  },
  {
    id: 'late-night-grill',
    name: 'Late Night Grill',
    source: 'static',
    status: 'closed',
    hours: 'Opens 9:00 PM',
    meal: 'Late Night',
    rating: 4.0,
    entrees: ['Burgers', 'Wings', 'Loaded Fries', 'Quesadillas'],
    sides: ['Mozzarella Sticks', 'Nachos'],
    desserts: ['Milkshakes', 'Churros'],
  },
]

const GENERIC_HOURS = [
  { meal: 'Breakfast', time: '7:00 – 10:30 AM', icon: 'coffee' },
  { meal: 'Lunch', time: '11:00 AM – 2:00 PM', icon: 'dining' },
  { meal: 'Dinner', time: '4:30 – 8:00 PM', icon: 'moon' },
]

function stringsToRows(arr) {
  return (arr || []).map((name) => (typeof name === 'string' ? { name } : name))
}

function splitFlatMenu(menuItems) {
  if (!menuItems?.length) {
    return { entrees: [], sides: [], desserts: [] }
  }
  const names = menuItems.map((m) => m.name).filter(Boolean)
  const n = names.length
  const third = Math.max(1, Math.ceil(n / 3))
  return {
    entrees: names.slice(0, third),
    sides: names.slice(third, third * 2),
    desserts: names.slice(third * 2),
  }
}

function nutrisliceToLocation(loc) {
  const hasBuckets =
    (loc.entrees?.length || 0) + (loc.sides?.length || 0) + (loc.desserts?.length || 0) > 0
  const flat = splitFlatMenu(loc.menu_items)
  const entrees = hasBuckets ? loc.entrees : flat.entrees
  const sides = hasBuckets ? loc.sides : flat.sides
  const desserts = hasBuckets ? loc.desserts : flat.desserts

  const rowMap = new Map((loc.menu_items || []).map((m) => [m.name, m]))

  function enrich(names) {
    return stringsToRows(names).map((row) => {
      const full = rowMap.get(row.name)
      if (!full) return row
      return {
        name: full.name,
        calories: full.calories,
        icons: full.icons,
      }
    })
  }

  return {
    id: loc.slug,
    slug: loc.slug,
    name: loc.name,
    source: 'nutrislice',
    status: loc.is_open ? 'open' : 'closed',
    hours: loc.hours,
    meal: loc.meal,
    rating: null,
    entrees: enrich(entrees),
    sides: enrich(sides),
    desserts: enrich(desserts),
    warnings: loc.warnings,
  }
}

function MenuColumn({ title, icon, iconWrapClass, iconClass, rows }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-3 flex items-center gap-2">
        <div className={`w-6 h-6 rounded-lg ${iconWrapClass} flex items-center justify-center`}>
          <Icon name={icon} size={12} className={iconClass || 'text-[var(--color-dining-color)]'} />
        </div>
        {title}
      </div>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <div className="text-[12px] text-[var(--color-txt-3)] px-4 py-2.5">No items listed for today.</div>
        ) : (
          rows.map((row, idx) => (
            <div
              key={`${row.name}-${idx}`}
              className="text-[13px] bg-[var(--color-stat)] hover:bg-[var(--color-bg-3)] rounded-xl px-4 py-2.5 text-[var(--color-txt-0)] transition-colors cursor-default"
            >
              <div className="font-medium">{row.name}</div>
              {(row.calories != null || (row.icons && row.icons.length > 0)) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {row.calories != null && (
                    <span className="text-[10px] font-medium text-[var(--color-txt-3)]">{row.calories} cal</span>
                  )}
                  {(row.icons || []).slice(0, 6).map((ic) => (
                    <span
                      key={ic}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--color-bg-2)] text-[var(--color-txt-2)]"
                    >
                      {ic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function Dining() {
  const [live, setLive] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/dining')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data?.ok && Array.isArray(data.locations)) setLive(data)
        else setLoadError('Live menus are temporarily unavailable.')
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not reach the dining server.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const locations = useMemo(() => {
    const api = (live?.locations || []).map(nutrisliceToLocation)
    return [...api, ...STATIC_LOCATIONS]
  }, [live])

  useEffect(() => {
    if (!locations.length) return
    setSelectedId((prev) => {
      if (prev && locations.some((l) => l.id === prev)) return prev
      const tower = locations.find((l) => l.slug === 'tower-dining')
      return tower?.id || locations[0].id
    })
  }, [locations])

  const selected = locations.find((l) => l.id === selectedId) || locations[0]
  const headerBlurb =
    selected?.source === 'nutrislice'
      ? `${selected.meal} · ${selected.hours}`
      : 'Sample location (not on Nutrislice)'

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8 pb-24 transition-opacity duration-500 opacity-100">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Campus Dining</h1>
          <p className="text-[14px] text-[var(--color-txt-2)] mt-1">Tower & Campus Center menus from Nutrislice (cached ~12h)</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-[13px] text-[var(--color-txt-2)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 shadow-sm">
            <Icon name="clock" size={14} className="text-[var(--color-txt-3)]" />
            {selected ? headerBlurb : loading ? 'Loading…' : '—'}
          </div>
          {live?.fetchedAt && (
            <span className="text-[11px] text-[var(--color-txt-3)]">
              Menu date {live.date}
              {live.cached ? ' · served from cache' : ''}
            </span>
          )}
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-stat)] px-4 py-3 text-[13px] text-[var(--color-txt-2)]">
          {loadError} Showing sample venues below.
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1 animate-fade-in-up stagger-1">
        {locations.map((loc) => {
          const isSelected = selected && loc.id === selected.id
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => setSelectedId(loc.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border whitespace-nowrap transition-all duration-300
                ${
                  isSelected
                    ? 'bg-[var(--color-surface)] border-[var(--color-border-2)] shadow-md'
                    : 'bg-transparent border-transparent hover:bg-[var(--color-surface)] hover:border-[var(--color-border)]'
                }`}
            >
              <div className={`status-dot ${loc.status === 'open' ? 'status-open' : 'status-closed'}`} />
              <span
                className={`text-[13px] font-medium ${isSelected ? 'text-[var(--color-txt-0)]' : 'text-[var(--color-txt-1)]'}`}
              >
                {loc.name}
              </span>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="card p-6 mb-6 animate-fade-in-up stagger-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[var(--color-txt-0)]">{selected.name}</h2>
                {selected.rating != null && (
                  <div className="flex items-center gap-1 text-[12px] text-[var(--color-gold-muted)]">
                    <Icon name="star" size={12} className="fill-current" />
                    {selected.rating}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`status-dot ${selected.status === 'open' ? 'status-open' : 'status-closed'}`} />
                <span className="text-[13px] text-[var(--color-txt-2)]">
                  {selected.status === 'open' ? 'Open now' : 'Closed'} · {selected.meal} · {selected.hours}
                </span>
              </div>
              {selected.source === 'static' && (
                <p className="text-[12px] text-[var(--color-txt-3)] mt-2">Demo menu — not from Nutrislice.</p>
              )}
              {selected.warnings && selected.warnings.length > 0 && (
                <p className="text-[12px] text-[var(--color-txt-3)] mt-2">Some menu requests were skipped ({selected.warnings.length}).</p>
              )}
            </div>
            <button type="button" className="btn btn-primary text-[12px] px-4 py-2.5 w-fit">
              <Icon name="mapPin" size={14} />
              Get Directions
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <MenuColumn
              title="Entrées"
              icon="dining"
              iconWrapClass="bg-[var(--color-dining-bg)]"
              rows={selected.entrees}
            />
            <MenuColumn
              title="Sides & Salads"
              icon="grid"
              iconWrapClass="bg-[var(--color-map-bg)]"
              iconClass="text-[var(--color-map-color)]"
              rows={selected.sides}
            />
            <MenuColumn
              title="Desserts"
              icon="star"
              iconWrapClass="bg-[var(--color-events-bg)]"
              iconClass="text-[var(--color-events-color)]"
              rows={selected.desserts}
            />
          </div>
        </div>
      )}

      <div className="card p-6 animate-fade-in-up stagger-3">
        <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-4">
          Typical meal periods (reference)
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {GENERIC_HOURS.map(({ meal, time, icon }) => (
            <div
              key={meal}
              className="bg-[var(--color-stat)] rounded-xl p-4 flex items-center gap-4 hover:bg-[var(--color-bg-3)] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-2)] flex items-center justify-center">
                <Icon name={icon} size={18} className="text-[var(--color-txt-2)]" />
              </div>
              <div>
                <div className="text-[12px] text-[var(--color-txt-2)]">{meal}</div>
                <div className="text-[14px] font-medium text-[var(--color-txt-0)]">{time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
