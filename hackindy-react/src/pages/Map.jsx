import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../context/ThemeContext'
import Icon from '../components/Icons'

const PURDUE_ARCGIS_MAP_URL =
  'https://purdueuniversity.maps.arcgis.com/apps/instant/basic/index.html?appid=b4ab9524eaa84cec9fb73c6b8b57afa2'

/** Weighted toward main academic core (OSM building data, Purdue Indianapolis / former IUPUI). */
const CAMPUS_CENTER = [39.774, -86.1743]
const DEFAULT_ZOOM = 16
const FLY_ZOOM = 17

const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

const SECTIONS = [
  { key: 'dining', label: 'Dining', icon: 'dining' },
  { key: 'academic', label: 'Academic', icon: 'graduation' },
  { key: 'campus', label: 'Campus & services', icon: 'grid' },
  { key: 'transit', label: 'Transit', icon: 'bus' },
]

/**
 * Coordinates: OpenStreetMap / Nominatim building centroids on the Purdue Indianapolis campus.
 * Google Maps links use lat,lng so the dropped pin matches the map marker.
 */
const PLACES = [
  {
    id: 'TD',
    section: 'dining',
    name: 'Tower Dining',
    addr: '900 W Michigan St, Indianapolis, IN 46202',
    lat: 39.7746,
    lng: -86.174494,
    desc: 'Main residential dining hub (Tower / Michigan St).',
  },
  {
    id: 'FC',
    section: 'dining',
    name: 'Campus Center Food Court',
    addr: '420 University Blvd, Indianapolis, IN 46202',
    lat: 39.77388,
    lng: -86.17625,
    desc: 'Food court inside the Campus Center.',
  },
  {
    id: 'LCAFE',
    section: 'dining',
    name: 'Library Café',
    addr: '755 W Michigan St, Indianapolis, IN 46202',
    lat: 39.77302,
    lng: -86.17208,
    desc: 'Coffee and snacks near the University Library.',
  },
  {
    id: 'LN',
    section: 'dining',
    name: 'Late Night Grill',
    addr: '900 W Michigan St, Indianapolis, IN 46202',
    lat: 39.77452,
    lng: -86.17438,
    desc: 'Late-night dining (Tower / residential side).',
  },
  {
    id: 'ET',
    section: 'academic',
    name: 'School of Engineering & Technology',
    addr: 'Purdue University in Indianapolis, Indianapolis, IN 46202',
    lat: 39.7740705,
    lng: -86.1725146,
    desc: 'Engineering and technology programs and labs.',
  },
  {
    id: 'SL',
    section: 'academic',
    name: 'Science & Liberal Arts (SL Building)',
    addr: '402 N Blackford St, Indianapolis, IN 46202',
    lat: 39.7739793,
    lng: -86.1709648,
    desc: 'Science and liberal arts (SL Building, OSM).',
  },
  {
    id: 'CAV',
    section: 'academic',
    name: 'Cavanaugh Hall',
    addr: '425 University Blvd, Indianapolis, IN 46202',
    lat: 39.7737085,
    lng: -86.1751051,
    desc: 'Liberal arts classrooms and offices.',
  },
  {
    id: 'LIB',
    section: 'academic',
    name: 'University Library',
    addr: '755 W Michigan St, Indianapolis, IN 46202',
    lat: 39.7730005,
    lng: -86.1721154,
    desc: 'Study space, collections, and research help.',
  },
  {
    id: 'CC',
    section: 'campus',
    name: 'Campus Center',
    addr: '420 University Blvd, Indianapolis, IN 46202',
    lat: 39.7739406,
    lng: -86.1760716,
    desc: 'Student life hub, meeting rooms, and services.',
  },
  {
    id: 'BOOK',
    section: 'campus',
    name: 'Campus Bookstore',
    addr: '420 University Blvd, Indianapolis, IN 46202',
    lat: 39.77395,
    lng: -86.17618,
    desc: 'Textbooks and supplies (Campus Center).',
  },
  {
    id: 'WELL',
    section: 'campus',
    name: 'Campus Health & wellness',
    addr: '719 W Michigan St, Indianapolis, IN 46202',
    lat: 39.7743281,
    lng: -86.1704771,
    desc: 'Student health and wellness resources.',
  },
  {
    id: 'BUS',
    section: 'transit',
    name: 'JagLine / Campus Center stop',
    addr: 'University Blvd at Campus Center, Indianapolis, IN 46202',
    lat: 39.7741305,
    lng: -86.1756918,
    desc: 'Major campus shuttle stop (OSM: Campus Center).',
  },
  {
    id: 'PARK',
    section: 'transit',
    name: 'Gateway Parking Garage',
    addr: 'Gateway Garage, Indianapolis, IN 46202',
    lat: 39.7753067,
    lng: -86.1690294,
    desc: 'Visitor and event parking near campus edge.',
  },
]

function googleMapsSearchUrl(place) {
  const q = encodeURIComponent(`${place.name}, ${place.addr}`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

function MapFocus({ flyRequest, selectedPlace }) {
  const map = useMap()

  useEffect(() => {
    if (flyRequest.lat == null) return
    map.flyTo([flyRequest.lat, flyRequest.lng], flyRequest.zoom, { duration: 0.85 })
  }, [flyRequest.seq, flyRequest.lat, flyRequest.lng, flyRequest.zoom, map])

  if (!selectedPlace) return null

  return (
    <CircleMarker
      center={[selectedPlace.lat, selectedPlace.lng]}
      radius={13}
      pathOptions={{
        fillColor: '#D4A84B',
        color: '#3E2200',
        weight: 3,
        fillOpacity: 0.92,
      }}
    >
      <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent>
        {selectedPlace.name}
      </Tooltip>
      <Popup>
        <div className="min-w-[200px]">
          <p className="font-bold text-[#3E2200] m-0 mb-1 text-sm">{selectedPlace.name}</p>
          <p className="text-xs text-neutral-600 m-0 mb-2">{selectedPlace.desc}</p>
          <p className="text-[11px] text-neutral-500 m-0 mb-2">{selectedPlace.addr}</p>
          <a
            href={googleMapsSearchUrl(selectedPlace)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#2D5A87] underline"
          >
            Open in Google Maps
          </a>
        </div>
      </Popup>
    </CircleMarker>
  )
}

export default function Map() {
  const { dark, toggleTheme } = useTheme()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [flyRequest, setFlyRequest] = useState({
    lat: null,
    lng: null,
    zoom: DEFAULT_ZOOM,
    seq: 0,
  })

  const filteredPlaces = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return PLACES
    return PLACES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.addr.toLowerCase().includes(q),
    )
  }, [search])

  const grouped = useMemo(() => {
    const bySection = Object.fromEntries(SECTIONS.map((s) => [s.key, []]))
    for (const p of filteredPlaces) {
      if (bySection[p.section]) bySection[p.section].push(p)
    }
    return SECTIONS.map((s) => ({ ...s, items: bySection[s.key] }))
  }, [filteredPlaces])

  const selectedPlace = PLACES.find((p) => p.id === selectedId) ?? null

  function goToPlace(p) {
    setSelectedId(p.id)
    setFlyRequest((fr) => ({
      lat: p.lat,
      lng: p.lng,
      zoom: FLY_ZOOM,
      seq: fr.seq + 1,
    }))
  }

  return (
    <div className="grid max-lg:grid-rows-[minmax(220px,42vh)_1fr] lg:grid-cols-[minmax(280px,300px)_1fr] h-[calc(100dvh-3.5rem)] max-lg:min-h-[calc(100dvh-3.5rem)] overflow-hidden bg-[var(--color-bg-1)] text-[var(--color-txt-0)]">
      <aside className="flex flex-col z-10 border-b lg:border-b-0 lg:border-r border-[var(--color-border-2)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] min-h-0">
        <div className="p-4 border-b border-[var(--color-border)] space-y-3 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-semibold text-[var(--color-txt-0)] tracking-tight">Campus map</h1>
              <p className="text-[11px] text-[var(--color-txt-2)] mt-1 leading-snug">
                Tap a place to fly the map there. Purdue’s official explorer:{' '}
                <a
                  href={PURDUE_ARCGIS_MAP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] font-medium underline-offset-2 hover:underline"
                >
                  ArcGIS map
                </a>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="shrink-0 w-9 h-9 rounded-xl border border-[var(--color-border-2)] bg-[var(--color-bg-2)] flex items-center justify-center text-[var(--color-txt-1)] hover:bg-[var(--color-surface-hover)] transition-colors"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Icon name="moon" size={18} /> : <Icon name="sun" size={18} />}
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-2.5 text-[var(--color-txt-3)] pointer-events-none">
              <Icon name="search" size={16} />
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dining, buildings…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[var(--color-bg-2)] border border-[var(--color-border-2)] text-[var(--color-txt-0)] outline-none focus:border-[var(--color-gold)] focus:shadow-[var(--shadow-glow)] placeholder:text-[var(--color-txt-3)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-4">
          {grouped.map((section) =>
            section.items.length ? (
              <div key={section.key} className="mt-4 first:mt-2">
                <div className="flex items-center gap-2 px-2 pb-2 border-b border-[var(--color-border)] mb-1">
                  <span className="text-[var(--color-gold-muted)]">
                    <Icon name={section.icon} size={16} />
                  </span>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-txt-2)] m-0">
                    {section.label}
                  </h2>
                </div>
                <ul className="list-none m-0 p-0">
                  {section.items.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => goToPlace(p)}
                        className={`w-full text-left px-3 py-3 rounded-xl border-0 cursor-pointer transition-colors flex gap-3 items-start ${
                          selectedId === p.id
                            ? 'bg-[var(--color-gold)]/12 ring-1 ring-[var(--color-gold)]/35'
                            : 'bg-transparent hover:bg-[var(--color-surface-hover)]'
                        }`}
                      >
                        <span className="text-[var(--color-txt-3)] mt-0.5 shrink-0">
                          <Icon name="mapPin" size={14} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-[var(--color-txt-0)]">{p.name}</span>
                          <span className="block text-[11px] text-[var(--color-txt-2)] mt-0.5 leading-snug">{p.addr}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          {filteredPlaces.length === 0 && (
            <p className="text-[13px] text-[var(--color-txt-2)] px-3 py-6 text-center">No places match your search.</p>
          )}
        </div>
      </aside>

      <div className="relative flex flex-col min-h-0 min-w-0 p-2 lg:p-3 bg-[var(--color-bg-2)]">
        <div
          className={`relative flex-1 min-h-[260px] rounded-2xl overflow-hidden border shadow-[var(--shadow-lg)] ${
            dark ? 'border-[var(--color-border-3)] shadow-black/20' : 'border-[var(--color-border-2)]'
          }`}
        >
          <MapContainer
            center={CAMPUS_CENTER}
            zoom={DEFAULT_ZOOM}
            minZoom={14}
            maxZoom={19}
            className="h-full w-full z-0 [&_.leaflet-control-attribution]:text-[10px] [&_.leaflet-control-attribution]:bg-[var(--color-surface)]/90"
            zoomControl
            scrollWheelZoom
          >
            <TileLayer
              key={dark ? 'dark' : 'light'}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={dark ? TILE_DARK : TILE_LIGHT}
            />
            <MapFocus flyRequest={flyRequest} selectedPlace={selectedPlace} />
          </MapContainer>
        </div>
        <p className="mt-2 text-[11px] text-[var(--color-txt-3)] px-1">
          Base map for navigation. Use the ArcGIS link above for official Purdue layers and room lookup.
        </p>
      </div>
    </div>
  )
}
