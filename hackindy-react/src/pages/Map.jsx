import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, useMap, GeoJSON, Marker } from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../context/ThemeContext'
import Icon from '../components/Icons'

const CAMPUS_CENTER = [39.7740, -86.1720]
const DEFAULT_ZOOM = 16
const FLY_ZOOM = 18

const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

// Official Purdue Indianapolis Building Shapes - has BUILDING_NAME, PU_ABBR, BuildingLabels
const PURDUE_BUILDINGS_URL = "https://services1.arcgis.com/mLNdQKiKsj5Z5YMN/arcgis/rest/services/Indianapolis_Building_Shapes/FeatureServer/123/query?where=1%3D1&outFields=BUILDING_NAME,PU_ABBR,BuildingLabels,add_full&returnGeometry=true&outSR=4326&f=geojson"

const SECTIONS = [
  { key: 'academic', label: 'Academic', icon: 'graduation' },
  { key: 'services', label: 'Services & Dining', icon: 'grid' },
  { key: 'parking', label: 'Parking', icon: 'bus' },
  { key: 'other', label: 'Other', icon: 'mapPin' },
]

// Categorize buildings by their abbreviation or name
function categorizeBuilding(abbr, name) {
  const abbrUpper = (abbr || '').toUpperCase()
  const nameUpper = (name || '').toUpperCase()
  
  // Parking structures
  if (nameUpper.includes('PARKING') || nameUpper.includes('GARAGE') || abbrUpper.endsWith('G')) {
    return 'parking'
  }
  
  // Services, dining, student life
  if (nameUpper.includes('CAMPUS CENTER') || nameUpper.includes('DINING') || 
      nameUpper.includes('LIBRARY') || nameUpper.includes('STUDENT')) {
    return 'services'
  }
  
  // Academic buildings
  if (nameUpper.includes('HALL') || nameUpper.includes('SCIENCE') || 
      nameUpper.includes('ENGINEERING') || nameUpper.includes('SCHOOL') ||
      nameUpper.includes('EDUCATION') || nameUpper.includes('NURSING') ||
      nameUpper.includes('MEDICINE') || nameUpper.includes('INFORMATICS') ||
      nameUpper.includes('BUSINESS') || nameUpper.includes('LAB')) {
    return 'academic'
  }
  
  return 'other'
}

/** Calculate centroid of a polygon */
function getPolygonCentroid(coordinates) {
  let coords = coordinates
  if (coords[0] && Array.isArray(coords[0][0])) {
    coords = coords[0]
  }
  
  let sumLat = 0, sumLng = 0, count = 0
  for (const coord of coords) {
    if (Array.isArray(coord) && coord.length >= 2) {
      sumLng += coord[0]
      sumLat += coord[1]
      count++
    }
  }
  
  return count > 0 ? [sumLat / count, sumLng / count] : null
}

/** Create a custom div icon for building labels */
function createLabelIcon(label, dark) {
  return L.divIcon({
    className: 'building-label-marker',
    html: `<div class="building-code-label ${dark ? 'dark' : ''}">${label}</div>`,
    iconSize: [50, 20],
    iconAnchor: [25, 10],
  })
}

/** Extract building code from a room string like "ET 215" */
export function extractBuildingCode(roomStr) {
  if (!roomStr) return null
  const match = roomStr.match(/^([A-Z]{2,4})\s*\d*/i)
  return match ? match[1].toUpperCase() : null
}

/** Process GeoJSON to build places list */
function processBuildings(geoData) {
  if (!geoData?.features) return []
  
  const buildings = []
  
  for (const feature of geoData.features) {
    const props = feature.properties || {}
    const name = props.BUILDING_NAME || ''
    const abbr = props.PU_ABBR || props.BuildingLabels || ''
    const address = props.add_full || ''
    
    if (!name && !abbr) continue
    
    const geometry = feature.geometry
    if (!geometry || geometry.type !== 'Polygon') continue
    
    const centroid = getPolygonCentroid(geometry.coordinates)
    if (!centroid) continue
    
    // Use BuildingLabels as the display code (it's what shows on the official map)
    const displayCode = props.BuildingLabels || abbr
    
    const uniqueId = `${abbr || 'bldg'}-${buildings.length}`
    buildings.push({
      id: uniqueId,
      abbr: abbr || '',
      displayCode,
      name,
      fullName: displayCode ? `${name} (${displayCode})` : name,
      address,
      section: categorizeBuilding(abbr, name),
      lat: centroid[0],
      lng: centroid[1],
      feature,
    })
  }
  
  // Sort by name
  return buildings.sort((a, b) => a.name.localeCompare(b.name))
}

function BuildingLabels({ buildings, dark, selectedId }) {
  return (
    <>
      {buildings.map((bldg) => {
        if (!bldg.displayCode) return null
        const isSelected = bldg.id === selectedId
        return (
          <Marker
            key={bldg.id}
            position={[bldg.lat, bldg.lng]}
            icon={createLabelIcon(bldg.displayCode, dark)}
            opacity={isSelected ? 1 : 0.9}
            interactive={false}
          />
        )
      })}
    </>
  )
}

function MapController({ flyRequest }) {
  const map = useMap()
  
  useEffect(() => {
    if (flyRequest.lat == null) return
    map.flyTo([flyRequest.lat, flyRequest.lng], flyRequest.zoom, { duration: 0.85 })
  }, [flyRequest.seq, flyRequest.lat, flyRequest.lng, flyRequest.zoom, map])
  
  return null
}

export default function Map() {
  const { dark, toggleTheme } = useTheme()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [geoData, setGeoData] = useState(null)
  const [buildings, setBuildings] = useState([])
  const [flyRequest, setFlyRequest] = useState({ lat: null, lng: null, zoom: DEFAULT_ZOOM, seq: 0 })
  const [initialFlyDone, setInitialFlyDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch official Purdue Indianapolis building data
  useEffect(() => {
    setLoading(true)
    fetch(PURDUE_BUILDINGS_URL)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch building data')
        return res.json()
      })
      .then(data => {
        setGeoData(data)
        const processedBuildings = processBuildings(data)
        setBuildings(processedBuildings)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load Purdue building data:", err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Handle URL parameters for deep linking from Schedule page
  useEffect(() => {
    if (initialFlyDone || !buildings.length) return
    
    const buildingParam = searchParams.get('building')
    const roomParam = searchParams.get('room')
    
    let targetCode = buildingParam
    if (!targetCode && roomParam) {
      targetCode = extractBuildingCode(roomParam)
    }
    
    if (targetCode) {
      const upperCode = targetCode.toUpperCase()
      // Match by abbr, BuildingLabels, or displayCode
      const place = buildings.find(b => 
        b.abbr.toUpperCase() === upperCode || 
        b.displayCode?.toUpperCase() === upperCode
      )
      if (place) {
        setSelectedId(place.id)
        setFlyRequest(fr => ({ lat: place.lat, lng: place.lng, zoom: FLY_ZOOM, seq: fr.seq + 1 }))
        setInitialFlyDone(true)
      }
    }
  }, [searchParams, initialFlyDone, buildings])

  const filteredBuildings = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return buildings
    return buildings.filter(b => 
      b.name.toLowerCase().includes(q) || 
      b.abbr.toLowerCase().includes(q) ||
      (b.displayCode && b.displayCode.toLowerCase().includes(q)) ||
      (b.address && b.address.toLowerCase().includes(q))
    )
  }, [search, buildings])

  const grouped = useMemo(() => {
    const bySection = Object.fromEntries(SECTIONS.map(s => [s.key, []]))
    for (const b of filteredBuildings) {
      if (bySection[b.section]) {
        bySection[b.section].push(b)
      } else {
        bySection['other'].push(b)
      }
    }
    return SECTIONS.map(s => ({ ...s, items: bySection[s.key] }))
  }, [filteredBuildings])

  const selectedBuilding = buildings.find(b => b.id === selectedId) ?? null

  const geoJsonStyle = (feature) => {
    const props = feature.properties || {}
    const featureAbbr = props.PU_ABBR || ''
    const isSelected = selectedBuilding && selectedBuilding.abbr === featureAbbr
    
    return {
      color: isSelected ? '#FFD700' : (dark ? '#E8C878' : '#5C4A1F'),
      weight: isSelected ? 3 : (dark ? 1.5 : 1),
      fillOpacity: isSelected ? 0.5 : (dark ? 0.25 : 0.18),
      fillColor: isSelected ? '#FFD700' : (dark ? '#C9A227' : '#D4A84B'),
      opacity: 1,
    }
  }

  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {}
    const name = props.BUILDING_NAME || 'Building'
    const code = props.BuildingLabels || props.PU_ABBR || ''
    const address = props.add_full || ''
    
    const popupContent = `
      <div style="color:#1a1918;min-width:180px;">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${name}</div>
        ${code ? `<div style="font-size:12px;color:#666;margin-bottom:2px;">Code: <strong>${code}</strong></div>` : ''}
        ${address ? `<div style="font-size:11px;color:#888;">${address}</div>` : ''}
      </div>
    `
    layer.bindPopup(popupContent)
    
    layer.on('click', () => {
      const featureAbbr = props.PU_ABBR || ''
      // Find the building with this abbr
      const bldg = buildings.find(b => b.abbr === featureAbbr)
      if (bldg) {
        setSelectedId(bldg.id)
      }
    })
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] h-[calc(100dvh-3.5rem)] overflow-hidden bg-[var(--color-bg-1)]">
      <aside className="flex flex-col z-10 border-r border-[var(--color-border-2)] bg-[var(--color-surface)] shadow-md min-h-0">
        <div className="p-4 border-b border-[var(--color-border)] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Campus Map</h1>
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-xl bg-[var(--color-bg-2)] hover:bg-[var(--color-bg-3)] transition-colors"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Icon name="moon" size={18} /> : <Icon name="sun" size={18} />}
            </button>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buildings..."
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--color-bg-2)] border border-[var(--color-border-2)] outline-none focus:border-[var(--color-gold)] transition-colors"
          />
          {loading && (
            <div className="text-xs text-[var(--color-txt-2)]">Loading buildings...</div>
          )}
          {error && (
            <div className="text-xs text-[var(--color-error)]">Error: {error}</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-6">
          {grouped.map((section) => section.items.length > 0 && (
            <div key={section.key} className="mt-4 first:mt-2">
              <div className="flex items-center gap-2 px-2 pb-2 border-b border-[var(--color-border)] mb-1">
                <span className="text-[var(--color-gold-muted)]"><Icon name={section.icon} size={16} /></span>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-txt-2)] m-0">
                  {section.label} ({section.items.length})
                </h2>
              </div>
              <ul className="list-none m-0 p-0">
                {section.items.map((b) => (
                  <li key={b.id}>
                    <button
                      onClick={() => {
                        setSelectedId(b.id)
                        setFlyRequest(fr => ({ lat: b.lat, lng: b.lng, zoom: FLY_ZOOM, seq: fr.seq + 1 }))
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex gap-3 ${
                        selectedId === b.id
                          ? 'bg-[var(--color-gold)]/15 ring-1 ring-[var(--color-gold)]'
                          : 'hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      <span className="text-[var(--color-txt-3)] mt-0.5 shrink-0">
                        <Icon name="mapPin" size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium leading-tight">
                          {b.name}
                        </span>
                        {b.displayCode && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-gold)]/20 text-[var(--color-gold-dark)] dark:text-[var(--color-gold)]">
                            {b.displayCode}
                          </span>
                        )}
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
            
            {geoData && (
              <GeoJSON
                key={`geojson-${selectedId}-${dark}`}
                data={geoData}
                style={geoJsonStyle}
                onEachFeature={onEachFeature}
              />
            )}
            
            <BuildingLabels buildings={buildings} dark={dark} selectedId={selectedId} />
            <MapController flyRequest={flyRequest} />
          </MapContainer>
        </div>
        
        {/* Selected building info card */}
        {selectedBuilding && (
          <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-80 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-lg p-4 animate-fade-in-up">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[var(--color-txt-0)]">{selectedBuilding.name}</h3>
                {selectedBuilding.displayCode && (
                  <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--color-gold)] text-[var(--color-gold-dark)]">
                    {selectedBuilding.displayCode}
                  </span>
                )}
                {selectedBuilding.address && (
                  <p className="text-[12px] text-[var(--color-txt-2)] mt-2">{selectedBuilding.address}</p>
                )}
              </div>
              <button 
                onClick={() => setSelectedId(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-2)] text-[var(--color-txt-2)]"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
