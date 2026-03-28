import { useState, useEffect } from 'react'
import Icon from '../components/Icons'

const BUILDINGS = [
  { id: 'ET', name: 'Engineering Technology Building', short: 'ET', addr: '723 W. Michigan St', cat: 'academic', desc: 'Home to Computer Science, Electrical Engineering, and Engineering Technology. Labs, classrooms, and faculty offices.', floors: 5, rooms: 48, mx: 291, my: 151 },
  { id: 'SL', name: 'Science & Liberal Arts', short: 'SL', addr: '402 N. Blackford St', cat: 'academic', desc: 'Biology, Chemistry, Physics, and Liberal Arts. State-of-the-art labs and lecture halls.', floors: 4, rooms: 36, mx: 381, my: 151 },
  { id: 'CC', name: 'Campus Center', short: 'CC', addr: '420 University Blvd', cat: 'admin', desc: 'Heart of student life — union, bookstore, meeting rooms, and student org offices.', floors: 3, rooms: 22, mx: 298, my: 250 },
  { id: 'TD', name: 'Tower Dining', short: 'TD', addr: '425 N. University Blvd', cat: 'dining', desc: 'Main dining hall with breakfast, lunch, and dinner daily. Multiple stations and vegetarian options.', floors: 2, rooms: 4, mx: 385, my: 250 },
  { id: 'CAV', name: 'Cavanaugh Hall', short: 'CAV', addr: '425 University Blvd', cat: 'academic', desc: 'School of Business and SPEA. Modern classrooms and faculty offices.', floors: 5, rooms: 40, mx: 199, my: 164 },
  { id: 'LIB', name: 'University Library', short: 'LIB', addr: '755 W. Michigan St', cat: 'academic', desc: '400,000+ volumes, private study rooms, computer labs. Open 24/7 during finals.', floors: 4, rooms: 30, mx: 463, my: 159 },
  { id: 'ASC', name: 'Academic Success Center', short: 'ASC', addr: '620 Union Dr', cat: 'admin', desc: 'Free tutoring, writing help, academic coaching, and disability services.', floors: 2, rooms: 12, mx: 291, my: 347 },
  { id: 'BUS', name: 'Transit Hub', short: 'BUS', addr: 'Michigan St & University Blvd', cat: 'transit', desc: 'Main Campus Connect stop. Routes to West Lafayette, downtown Indy, and surrounding areas.', floors: 1, rooms: 2, mx: 340, my: 210 },
]

const COLORS = {
  academic: { main: '#2D5A87', bg: 'rgba(45, 90, 135, 0.1)' },
  dining: { main: '#2E6B35', bg: 'rgba(46, 107, 53, 0.1)' },
  admin: { main: '#9A7832', bg: 'rgba(154, 120, 50, 0.1)' },
  recreation: { main: '#7A3055', bg: 'rgba(122, 48, 85, 0.1)' },
  transit: { main: '#5D4E99', bg: 'rgba(93, 78, 153, 0.1)' },
}

const FILTERS = ['all', 'academic', 'dining', 'admin', 'transit']

export default function Map() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredBuildings = BUILDINGS.filter(b => {
    const matchFilter = filter === 'all' || b.cat === filter
    const matchSearch = !search || 
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.short.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const selectedBuilding = BUILDINGS.find(b => b.id === selected)

  return (
    <div className={`grid lg:grid-cols-[320px_1fr] min-h-[calc(100vh-64px)] transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Sidebar */}
      <div className="bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col order-2 lg:order-1">
        {/* Search */}
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-txt-3)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search buildings or rooms..."
              className="input w-full pl-10 pr-4 py-2.5 text-[13px]"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`pill text-[11px] capitalize ${filter === f ? 'pill-active' : ''}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Building List */}
        <div className="flex-1 overflow-y-auto">
          {filteredBuildings.map((b, idx) => (
            <div
              key={b.id}
              onClick={() => setSelected(b.id)}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-[var(--color-border)] transition-all duration-200
                ${selected === b.id 
                  ? 'bg-[var(--color-stat)] border-l-2 border-l-[var(--color-gold)]' 
                  : 'hover:bg-[var(--color-surface-hover)] border-l-2 border-l-transparent'
                }`}
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              <div 
                className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-[var(--color-surface)]"
                style={{ 
                  background: COLORS[b.cat].main,
                  ringColor: selected === b.id ? COLORS[b.cat].main : 'transparent'
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[var(--color-txt-0)] truncate">{b.name}</div>
                <div className="text-[11px] text-[var(--color-txt-2)] mt-0.5">{b.addr}</div>
              </div>
              <span 
                className="text-[10px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap capitalize"
                style={{ 
                  background: COLORS[b.cat].bg,
                  color: COLORS[b.cat].main
                }}
              >
                {b.cat}
              </span>
            </div>
          ))}
          
          {filteredBuildings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-stat)] flex items-center justify-center mb-3">
                <Icon name="search" size={20} className="text-[var(--color-txt-3)]" />
              </div>
              <p className="text-[13px] text-[var(--color-txt-2)]">No buildings found</p>
              <p className="text-[11px] text-[var(--color-txt-3)] mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="relative bg-[var(--color-bg-2)] flex flex-col order-1 lg:order-2 min-h-[50vh] lg:min-h-0">
        {/* SVG Map */}
        <div className="flex-1 relative">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 680 420" 
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Background */}
            <rect width="680" height="420" className="fill-[var(--color-bg-2)]" />
            
            {/* Grid pattern */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-border)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="680" height="420" fill="url(#grid)" opacity="0.5" />
            
            {/* Roads */}
            <line x1="0" y1="210" x2="680" y2="210" stroke="var(--color-border-3)" strokeWidth="12" strokeLinecap="round" />
            <line x1="340" y1="0" x2="340" y2="420" stroke="var(--color-border-3)" strokeWidth="10" strokeLinecap="round" />
            <line x1="0" y1="110" x2="680" y2="110" stroke="var(--color-border-2)" strokeWidth="6" strokeLinecap="round" />
            <line x1="0" y1="310" x2="680" y2="310" stroke="var(--color-border-2)" strokeWidth="6" strokeLinecap="round" />
            <line x1="170" y1="0" x2="170" y2="420" stroke="var(--color-border-2)" strokeWidth="5" strokeLinecap="round" />
            <line x1="510" y1="0" x2="510" y2="420" stroke="var(--color-border-2)" strokeWidth="5" strokeLinecap="round" />
            
            {/* Building Blocks (background) */}
            <rect x="75" y="48" width="65" height="42" rx="6" className="fill-[var(--color-stat)]" />
            <rect x="182" y="48" width="48" height="38" rx="6" className="fill-[var(--color-stat)]" />
            <rect x="545" y="48" width="72" height="48" rx="6" className="fill-[var(--color-stat)]" />
            <rect x="75" y="228" width="58" height="65" rx="6" className="fill-[var(--color-stat)]" />
            <rect x="545" y="228" width="68" height="62" rx="6" className="fill-[var(--color-stat)]" />
            <rect x="362" y="328" width="52" height="52" rx="6" className="fill-[var(--color-stat)]" />
            <rect x="193" y="328" width="68" height="52" rx="6" className="fill-[var(--color-stat)]" />
            
            {/* Main Building Blocks */}
            <rect x="264" y="126" width="58" height="50" rx="6" className="fill-[var(--color-surface)]" stroke="var(--color-border)" strokeWidth="1.5" />
            <rect x="356" y="126" width="54" height="50" rx="6" className="fill-[var(--color-surface)]" stroke="var(--color-border)" strokeWidth="1.5" />
            <rect x="264" y="228" width="76" height="44" rx="6" className="fill-[var(--color-surface)]" stroke="var(--color-border)" strokeWidth="1.5" />
            <rect x="363" y="228" width="50" height="44" rx="6" className="fill-[var(--color-surface)]" stroke="var(--color-border)" strokeWidth="1.5" />
            <rect x="170" y="135" width="64" height="60" rx="6" className="fill-[var(--color-surface)]" stroke="var(--color-border)" strokeWidth="1.5" />
            <rect x="446" y="140" width="44" height="38" rx="6" className="fill-[var(--color-surface)]" stroke="var(--color-border)" strokeWidth="1.5" />
            <rect x="264" y="326" width="62" height="42" rx="6" className="fill-[var(--color-surface)]" stroke="var(--color-border)" strokeWidth="1.5" />

            {/* Building Markers */}
            {BUILDINGS.map(b => {
              const isSelected = selected === b.id
              const color = COLORS[b.cat].main
              return (
                <g 
                  key={b.id}
                  onClick={() => setSelected(b.id)}
                  className="cursor-pointer"
                  transform={`translate(${b.mx}, ${b.my})`}
                >
                  {/* Pulse ring on selection */}
                  {isSelected && (
                    <circle 
                      r="20" 
                      fill="none" 
                      stroke={color} 
                      strokeWidth="2"
                      opacity="0.3"
                      className="animate-pulse-ring"
                    />
                  )}
                  
                  {/* Outer glow */}
                  <circle r="16" fill={color} opacity="0.12" />
                  
                  {/* Main marker */}
                  <circle 
                    r="8" 
                    fill={color}
                    className={`transition-transform duration-300 ${isSelected ? 'scale-125' : 'hover:scale-110'}`}
                    style={{ transformOrigin: 'center' }}
                  />
                  
                  {/* Selection ring */}
                  {isSelected && (
                    <circle r="12" fill="none" stroke={color} strokeWidth="2.5" />
                  )}
                  
                  {/* Label */}
                  <text 
                    y="26" 
                    textAnchor="middle" 
                    fontSize="9" 
                    fill={color} 
                    fontFamily="system-ui, sans-serif" 
                    fontWeight="600"
                    letterSpacing="0.02em"
                  >
                    {b.short}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Zoom Controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            <button className="btn btn-secondary w-9 h-9 p-0">
              <Icon name="plus" size={18} />
            </button>
            <button className="btn btn-secondary w-9 h-9 p-0">
              <Icon name="minus" size={18} />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute top-4 right-4 card p-3">
            <div className="text-[10px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-2">
              Building Types
            </div>
            {Object.entries(COLORS).map(([type, { main }]) => (
              <div key={type} className="flex items-center gap-2 text-[11px] text-[var(--color-txt-1)] mb-1.5 last:mb-0 capitalize">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: main }} />
                {type}
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div 
          className={`bg-[var(--color-surface)] border-t border-[var(--color-border)] transition-all duration-500 ease-out overflow-hidden ${selectedBuilding ? 'max-h-[400px] p-5' : 'max-h-0 p-0'}`}
        >
          {selectedBuilding && (
            <div className="animate-fade-in-up">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{ 
                        background: COLORS[selectedBuilding.cat].bg,
                        color: COLORS[selectedBuilding.cat].main
                      }}
                    >
                      {selectedBuilding.cat}
                    </span>
                  </div>
                  <div className="text-[17px] font-semibold text-[var(--color-txt-0)]">
                    {selectedBuilding.name}
                  </div>
                  <div className="text-[12px] text-[var(--color-txt-2)] mt-0.5 flex items-center gap-1">
                    <Icon name="mapPin" size={12} />
                    {selectedBuilding.addr}
                  </div>
                </div>
                <button 
                  onClick={() => setSelected(null)}
                  className="btn btn-ghost w-8 h-8 p-0"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
              
              <p className="text-[13px] text-[var(--color-txt-1)] leading-relaxed mb-4">
                {selectedBuilding.desc}
              </p>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[var(--color-stat)] rounded-xl p-3">
                  <div className="text-[10px] text-[var(--color-txt-3)] uppercase tracking-wider mb-0.5">Category</div>
                  <div className="text-[13px] font-medium text-[var(--color-txt-0)] capitalize">{selectedBuilding.cat}</div>
                </div>
                <div className="bg-[var(--color-stat)] rounded-xl p-3">
                  <div className="text-[10px] text-[var(--color-txt-3)] uppercase tracking-wider mb-0.5">Floors</div>
                  <div className="text-[13px] font-medium text-[var(--color-txt-0)]">{selectedBuilding.floors}</div>
                </div>
                <div className="bg-[var(--color-stat)] rounded-xl p-3">
                  <div className="text-[10px] text-[var(--color-txt-3)] uppercase tracking-wider mb-0.5">Rooms</div>
                  <div className="text-[13px] font-medium text-[var(--color-txt-0)]">{selectedBuilding.rooms}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="btn btn-primary text-[12px] px-4 py-2.5 flex-1">
                  <Icon name="navigation" size={14} />
                  Get Directions
                </button>
                <button className="btn btn-secondary text-[12px] px-4 py-2.5 flex-1">
                  <Icon name="calendar" size={14} />
                  My Classes Here
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
