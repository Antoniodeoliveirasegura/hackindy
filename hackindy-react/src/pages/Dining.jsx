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
    stations: [
      { name: 'Entrées', items: [{ name: 'Bagels' }, { name: 'Muffins' }, { name: 'Breakfast Sandwiches' }] },
      { name: 'Sides', items: [{ name: 'Yogurt Parfait' }, { name: 'Fruit Cup' }] },
      { name: 'Desserts', items: [{ name: 'Pastries' }, { name: 'Cookies' }] },
    ],
  },
  {
    id: 'late-night-grill',
    name: 'Late Night Grill',
    source: 'static',
    status: 'closed',
    hours: 'Opens 9:00 PM',
    meal: 'Late Night',
    rating: 4.0,
    stations: [
      { name: 'Grill', items: [{ name: 'Burgers' }, { name: 'Wings' }, { name: 'Loaded Fries' }, { name: 'Quesadillas' }] },
      { name: 'Sides', items: [{ name: 'Mozzarella Sticks' }, { name: 'Nachos' }] },
      { name: 'Desserts', items: [{ name: 'Milkshakes' }, { name: 'Churros' }] },
    ],
  },
]

const GENERIC_HOURS = [
  { meal: 'Breakfast', time: '7:00 – 10:30 AM', icon: 'coffee' },
  { meal: 'Lunch', time: '11:00 AM – 2:00 PM', icon: 'dining' },
  { meal: 'Dinner', time: '4:30 – 8:00 PM', icon: 'moon' },
]

function nutrisliceToLocation(loc) {
  return {
    id: loc.slug,
    slug: loc.slug,
    name: loc.name,
    source: 'nutrislice',
    status: loc.is_open ? 'open' : 'closed',
    hours: loc.hours,
    meal: loc.meal,
    rating: null,
    stations: loc.stations || [],
    warnings: loc.warnings,
  }
}

const STATION_ICONS = ['dining', 'grid', 'star', 'coffee', 'moon', 'book', 'building', 'users', 'navigation', 'bus']
const STATION_CAP = 10

function StationCard({ station, index }) {
  const [expanded, setExpanded] = useState(false)
  const overflow = station.items.length > STATION_CAP
  const visible = expanded ? station.items : station.items.slice(0, STATION_CAP)

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-6 h-6 rounded-lg bg-[var(--color-dining-bg)] flex items-center justify-center flex-shrink-0">
          <Icon
            name={STATION_ICONS[index % STATION_ICONS.length]}
            size={12}
            className="text-[var(--color-dining-color)]"
          />
        </div>
        <span className="text-[11px] font-semibold text-[var(--color-txt-0)] uppercase tracking-wide leading-tight">
          {station.name}
        </span>
      </div>
      <div className="space-y-1.5">
        {visible.map((item, idx) => (
          <div
            key={`${item.name}-${idx}`}
            className="text-[13px] bg-[var(--color-stat)] hover:bg-[var(--color-bg-3)] rounded-xl px-3 py-2 transition-colors cursor-default"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--color-txt-0)] leading-snug">{item.name}</span>
              {item.calories != null && (
                <span className="text-[11px] text-[var(--color-txt-3)] whitespace-nowrap flex-shrink-0">
                  {item.calories} cal
                </span>
              )}
            </div>
            {item.icons && item.icons.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.icons.slice(0, 4).map((ic) => (
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
        ))}
      </div>
      {overflow && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 text-[12px] text-[var(--color-txt-3)] hover:text-[var(--color-txt-1)] transition-colors text-left"
        >
          {expanded ? '↑ Show less' : `+ ${station.items.length - STATION_CAP} more`}
        </button>
      )}
    </div>
  )
}

export default function Dining() {
  const [live, setLive] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  function loadMenu(force = false) {
    if (force) setRefreshing(true)
    else setLoading(true)
    setLoadError('')
    fetch(`/api/dining${force ? '?refresh=1' : ''}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.locations)) setLive(data)
        else setLoadError('Live menus are temporarily unavailable.')
      })
      .catch(() => setLoadError('Could not reach the dining server.'))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    loadMenu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const locations = useMemo(() => {
    if (loading) return []
    const api = (live?.locations || []).map(nutrisliceToLocation)
    return [...api, ...STATIC_LOCATIONS]
  }, [live, loading])

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
          <p className="text-[14px] text-[var(--color-txt-2)] mt-1">
            {live?.date ? `Menu for ${live.date}` : "Today's menu"}
            {live?.cached ? ' · cached' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected && !loading && (
            <div className="flex items-center gap-2 text-[13px] text-[var(--color-txt-2)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 shadow-sm">
              <Icon name="clock" size={14} className="text-[var(--color-txt-3)]" />
              {headerBlurb}
            </div>
          )}
          <button
            type="button"
            onClick={() => loadMenu(true)}
            disabled={refreshing || loading}
            title="Force-refresh menu"
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm hover:bg-[var(--color-bg-3)] transition-colors disabled:opacity-40"
          >
            <Icon
              name="refresh"
              size={14}
              className={`text-[var(--color-txt-2)] ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-stat)] px-4 py-3 text-[13px] text-[var(--color-txt-2)]">
          {loadError} Showing sample venues below.
        </div>
      )}

      {loading ? (
        /* ── Skeleton ── */
        <div className="animate-pulse">
          <div className="flex gap-2 mb-6">
            <div className="h-11 w-36 rounded-xl bg-[var(--color-stat)]" />
            <div className="h-11 w-32 rounded-xl bg-[var(--color-stat)]" />
          </div>
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <div className="h-5 w-40 rounded-lg bg-[var(--color-stat)]" />
                <div className="h-3.5 w-52 rounded-lg bg-[var(--color-stat)]" />
              </div>
              <div className="h-9 w-28 rounded-xl bg-[var(--color-stat)]" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[0, 1, 2].map((col) => (
                <div key={col} className="space-y-2">
                  <div className="h-3 w-20 rounded bg-[var(--color-stat)] mb-3" />
                  {[0, 1, 2, 3].map((row) => (
                    <div key={row} className="h-9 rounded-xl bg-[var(--color-stat)]" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
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
        <div className="mb-6 animate-fade-in-up stagger-2">
          {/* Location header */}
          <div className="card p-5 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    {selected.status === 'open' ? 'Open now' : 'Closed'} · {selected.hours}
                  </span>
                </div>
                {selected.source === 'static' && (
                  <p className="text-[12px] text-[var(--color-txt-3)] mt-1.5">Demo menu — not live data.</p>
                )}
              </div>
              <button type="button" className="btn btn-primary text-[12px] px-4 py-2.5 w-fit">
                <Icon name="mapPin" size={14} />
                Get Directions
              </button>
            </div>
          </div>

          {/* Station grid */}
          {selected.stations.length === 0 ? (
            <div className="card p-10 flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-stat)] flex items-center justify-center">
                <Icon name="dining" size={18} className="text-[var(--color-txt-3)]" />
              </div>
              <p className="text-[14px] font-medium text-[var(--color-txt-0)]">No menu posted yet</p>
              <p className="text-[13px] text-[var(--color-txt-2)]">Check back closer to meal time.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selected.stations.map((station, i) => (
                <StationCard key={station.name} station={station} index={i} />
              ))}
            </div>
          )}
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
        </>
      )}
    </div>
  )
}
