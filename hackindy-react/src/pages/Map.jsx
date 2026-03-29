import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../context/ThemeContext'
import Icon from '../components/Icons'

const CAMPUS_CENTER = [39.774, -86.1743]
const DEFAULT_ZOOM = 16
const FLY_ZOOM = 17

const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

// THE SAFE URL: Filtered to just the Purdue Indy Campus area
const CAMPUS_GEOJSON_URL = "https://gisdata.in.gov/server/rest/services/Hosted/Building_Footprints/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=-86.180,39.770,-86.165,39.780&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&inSR=4326&outSR=4326&f=geojson";

const SECTIONS = [
  { key: 'academic', label: 'Academic', icon: 'graduation' },
  { key: 'dining', label: 'Dining', icon: 'dining' },
  { key: 'campus', label: 'Campus & services', icon: 'grid' },
  { key: 'transit', label: 'Transit', icon: 'bus' },
]

const PLACES = [
  { id: 'ET', section: 'academic', name: 'Engineering & Technology (ET)', addr: '799 W Michigan St', lat: 39.7740, lng: -86.1728, desc: 'Engineering labs.' },
  { id: 'SL', section: 'academic', name: 'Science Building (SL)', addr: '402 N Blackford St', lat: 39.7739, lng: -86.1711, desc: 'Science and Math.' },
  { id: 'LD', section: 'academic', name: 'Life Sciences (LD)', addr: '402 N Blackford St', lat: 39.7733, lng: -86.1711, desc: 'Research labs.' },
  { id: 'IP', section: 'academic', name: 'Innovation Hall (IP)', addr: '625 W Michigan St', lat: 39.7741, lng: -86.1706, desc: 'STEM Innovation.' },
  { id: 'UL', section: 'academic', name: 'University Library (UL)', addr: '755 W Michigan St', lat: 39.7731, lng: -86.1721, desc: 'Main Library.' },
  { id: 'BS', section: 'academic', name: 'Business / SPEA (BS)', addr: '801 W Michigan St', lat: 39.7734, lng: -86.1743, desc: 'Kelley/SPEA.' },
  { id: 'ES', section: 'academic', name: 'Education & Social Work (ES)', addr: '902 W New York St', lat: 39.7725, lng: -86.1748, desc: 'Education labs.' },
  { id: 'PE', section: 'academic', name: 'Physical Education (PE)', addr: '901 W New York St', lat: 39.7716, lng: -86.1751, desc: 'NIFS / PE.' },
  { id: 'IF', section: 'academic', name: 'Informatics (IF)', addr: '535 W Michigan St', lat: 39.7733, lng: -86.1685, desc: 'Informatics.' },
  { id: 'CC', section: 'campus', name: 'Campus Center', addr: '420 University Blvd', lat: 39.7739, lng: -86.1762, desc: 'Dining & Life.' },
  { id: 'TD', section: 'dining', name: 'Tower Dining', addr: '900 W Michigan St', lat: 39.7746, lng: -86.1745, desc: 'Residential Dining.' },
  { id: 'GG', section: 'transit', name: 'Gateway Garage', addr: '525 N Blackford St', lat: 39.7753, lng: -86.1690, desc: 'Main Parking.' },
]

/** Component to overlay the abbreviations (UL, ET, etc.) on the map */
function BuildingLabels() {
  return (
    <>
      {PLACES.map((p) => (
        <CircleMarker key={`label-${p.id}`} center={[p.lat, p.lng]} radius={1} pathOptions={{ fillOpacity: 0, stroke: false }}>
          <Tooltip direction="center" permanent className="building-label">
            {p.id}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  )
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
      radius={14}
      pathOptions={{ fillColor: '#FFD700', color: '#000000', weight: 2, fillOpacity: 0.9 }}
    >
      <Popup>
        <div className="min-w-[150px]">
          <p className="font-bold text-sm m-0">{selectedPlace.name}</p>
          <p className="text-[11px] text-neutral-500 m-0">{selectedPlace.addr}</p>
        </div>
      </Popup>
    </CircleMarker>
  )
}

export default function Map() {
  const { dark, toggleTheme } = useTheme()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [geoData, setGeoData] = useState(null)
  const [flyRequest, setFlyRequest] = useState({ lat: null, lng: null, zoom: DEFAULT_ZOOM, seq: 0 })

  // FETCH THE LIVE GEOJSON ON LOAD
  useEffect(() => {
    fetch(CAMPUS_GEOJSON_URL)
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("API Error:", err));
  }, []);

  const filteredPlaces = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? PLACES.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) : PLACES
  }, [search])

  const grouped = useMemo(() => {
    const bySection = Object.fromEntries(SECTIONS.map((s) => [s.key, []]))
    for (const p of filteredPlaces) {
      if (bySection[p.section]) bySection[p.section].push(p)
    }
    return SECTIONS.map((s) => ({ ...s, items: bySection[s.key] }))
  }, [filteredPlaces])

  const selectedPlace = PLACES.find((p) => p.id === selectedId) ?? null

  return (
    <div className="grid lg:grid-cols-[300px_1fr] h-[calc(100dvh-3.5rem)] overflow-hidden bg-[var(--color-bg-1)]">
      {/* SIDEBAR: Locked scrolling behavior */}
      <aside className="flex flex-col z-10 border-r border-[var(--color-border-2)] bg-[var(--color-surface)] shadow-md min-h-0">
        <div className="p-4 border-b space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Campus map</h1>
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-[var(--color-bg-2)]">
              {dark ? <Icon name="moon" size={18} /> : <Icon name="sun" size={18} />}
            </button>
          </div>
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buildings (ET, SL, IP...)"
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--color-bg-2)] border border-[var(--color-border-2)] outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-6 scroll-smooth">
          {grouped.map((section) => section.items.length > 0 && (
            <div key={section.key} className="mt-4 first:mt-2">
              <div className="flex items-center gap-2 px-2 pb-2 border-b border-[var(--color-border)] mb-1">
                <span className="text-[var(--color-gold-muted)]"><Icon name={section.icon} size={16} /></span>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-txt-2)] m-0">{section.label}</h2>
              </div>
              <ul className="list-none m-0 p-0">
                {section.items.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => { setSelectedId(p.id); setFlyRequest(fr => ({ lat: p.lat, lng: p.lng, zoom: FLY_ZOOM, seq: fr.seq + 1 })); }}
                      className={`w-full text-left px-3 py-3 rounded-xl transition-all flex gap-3 ${selectedId === p.id ? 'bg-[var(--color-gold)]/15 ring-1 ring-[var(--color-gold)]' : 'hover:bg-[var(--color-surface-hover)]'}`}
                    >
                      <span className="text-[var(--color-txt-3)] mt-0.5"><Icon name="mapPin" size={14} /></span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold">{p.name}</span>
                        <span className="block text-[11px] text-[var(--color-txt-2)] truncate">{p.addr}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      <div className="relative p-2 lg:p-3 bg-[var(--color-bg-2)]">
        <div className={`h-full w-full rounded-2xl overflow-hidden border shadow-lg ${dark ? 'dark-purdue-map border-[#2A1E0A]' : 'border-white'}`}>
          <MapContainer center={CAMPUS_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full">
            <TileLayer key={dark ? 'dark' : 'light'} url={dark ? TILE_DARK : TILE_LIGHT} />
            
            {/* RENDER LIVE GEOJSON DATA */}
            {geoData && (
              <GeoJSON 
                data={geoData} 
                style={() => ({
                  color: dark ? '#FFD700' : '#3E2200',
                  weight: 1.5,
                  fillOpacity: 0.15,
                  fillColor: dark ? '#FFD700' : '#D4A84B',
                })}
              />
            )}

            <BuildingLabels />
            <MapFocus flyRequest={flyRequest} selectedPlace={selectedPlace} />
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
