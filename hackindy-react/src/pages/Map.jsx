import { useState } from 'react'
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
  academic: '#2062a4',
  dining: '#3d7e18',
  admin: '#a06010',
  recreation: '#a33060',
  transit: '#5040b0',
}

const FILTERS = ['all', 'academic', 'dining', 'admin', 'transit']

export default function Map() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filteredBuildings = BUILDINGS.filter(b => {
    const matchFilter = filter === 'all' || b.cat === filter
    const matchSearch = !search || 
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.short.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const selectedBuilding = BUILDINGS.find(b => b.id === selected)

  return (
    <div className="grid grid-cols-[280px_1fr] min-h-[calc(100vh-52px)]">
      {/* Sidebar */}
      <div className="bg-[var(--color-bg-0)] border-r border-[var(--color-border)] flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 bg-[var(--color-bg-2)] border border-[var(--color-border)] rounded-lg px-2.5 py-2">
            <Icon name="search" size={13} className="text-[var(--color-txt-2)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search buildings or rooms..."
              className="flex-1 text-xs bg-transparent outline-none text-[var(--color-txt-0)] placeholder:text-[var(--color-txt-2)]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors capitalize
                  ${filter === f 
                    ? 'bg-gold-dark text-gold border-gold-dark' 
                    : 'bg-[var(--color-bg-2)] text-[var(--color-txt-1)] border-[var(--color-border-2)] hover:bg-[var(--color-stat)]'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Building List */}
        <div className="flex-1 overflow-y-auto">
          {filteredBuildings.map(b => (
            <div
              key={b.id}
              onClick={() => setSelected(b.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer border-b border-[var(--color-border)] transition-colors
                ${selected === b.id ? 'bg-[var(--color-stat)]' : 'hover:bg-[var(--color-bg-2)]'}`}
            >
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: COLORS[b.cat] }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--color-txt-0)] truncate">{b.name}</div>
                <div className="text-[10px] text-[var(--color-txt-2)] mt-0.5">{b.addr}</div>
              </div>
              <span 
                className="text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ 
                  background: `${COLORS[b.cat]}22`,
                  color: COLORS[b.cat]
                }}
              >
                {b.cat}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map Area */}
      <div className="relative bg-[var(--color-bg-2)] flex flex-col">
        {/* SVG Map */}
        <div className="flex-1 relative min-h-[420px]">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 680 420" 
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Background */}
            <rect width="680" height="420" className="fill-[var(--color-bg-2)]" />
            
            {/* Roads */}
            <line x1="0" y1="210" x2="680" y2="210" stroke="var(--color-border-2)" strokeWidth="10" strokeLinecap="round" />
            <line x1="340" y1="0" x2="340" y2="420" stroke="var(--color-border-2)" strokeWidth="8" strokeLinecap="round" />
            <line x1="0" y1="110" x2="680" y2="110" stroke="var(--color-border)" strokeWidth="5" strokeLinecap="round" />
            <line x1="0" y1="310" x2="680" y2="310" stroke="var(--color-border)" strokeWidth="5" strokeLinecap="round" />
            <line x1="170" y1="0" x2="170" y2="420" stroke="var(--color-border)" strokeWidth="4" strokeLinecap="round" />
            <line x1="510" y1="0" x2="510" y2="420" stroke="var(--color-border)" strokeWidth="4" strokeLinecap="round" />
            
            {/* Building Blocks (background) */}
            <rect x="75" y="48" width="65" height="42" rx="3" className="fill-[var(--color-stat)]" />
            <rect x="182" y="48" width="48" height="38" rx="3" className="fill-[var(--color-stat)]" />
            <rect x="545" y="48" width="72" height="48" rx="3" className="fill-[var(--color-stat)]" />
            <rect x="75" y="228" width="58" height="65" rx="3" className="fill-[var(--color-stat)]" />
            <rect x="545" y="228" width="68" height="62" rx="3" className="fill-[var(--color-stat)]" />
            <rect x="362" y="328" width="52" height="52" rx="3" className="fill-[var(--color-stat)]" />
            <rect x="193" y="328" width="68" height="52" rx="3" className="fill-[var(--color-stat)]" />
            
            {/* Main Building Blocks */}
            <rect x="264" y="126" width="58" height="50" rx="3" className="fill-[var(--color-bg-0)]" stroke="var(--color-border)" />
            <rect x="356" y="126" width="54" height="50" rx="3" className="fill-[var(--color-bg-0)]" stroke="var(--color-border)" />
            <rect x="264" y="228" width="76" height="44" rx="3" className="fill-[var(--color-bg-0)]" stroke="var(--color-border)" />
            <rect x="363" y="228" width="50" height="44" rx="3" className="fill-[var(--color-bg-0)]" stroke="var(--color-border)" />
            <rect x="170" y="135" width="64" height="60" rx="3" className="fill-[var(--color-bg-0)]" stroke="var(--color-border)" />
            <rect x="446" y="140" width="44" height="38" rx="3" className="fill-[var(--color-bg-0)]" stroke="var(--color-border)" />
            <rect x="264" y="326" width="62" height="42" rx="3" className="fill-[var(--color-bg-0)]" stroke="var(--color-border)" />

            {/* Building Markers */}
            {BUILDINGS.map(b => {
              const isSelected = selected === b.id
              const color = COLORS[b.cat]
              return (
                <g 
                  key={b.id}
                  onClick={() => setSelected(b.id)}
                  className="cursor-pointer"
                  transform={`translate(${b.mx}, ${b.my})`}
                >
                  <circle r="14" fill={color} opacity="0.14" />
                  <circle r="7" fill={color} />
                  {isSelected && (
                    <circle r="11" fill="none" stroke={color} strokeWidth="2.5" />
                  )}
                  <text 
                    y="23" 
                    textAnchor="middle" 
                    fontSize="8" 
                    fill={color} 
                    fontFamily="sans-serif" 
                    fontWeight="500"
                  >
                    {b.short}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Zoom Controls */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <button className="w-7 h-7 bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-md flex items-center justify-center text-[var(--color-txt-0)] hover:bg-[var(--color-bg-2)]">
              <Icon name="plus" size={16} />
            </button>
            <button className="w-7 h-7 bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-md flex items-center justify-center text-[var(--color-txt-0)] hover:bg-[var(--color-bg-2)]">
              <Icon name="minus" size={16} />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute top-3 right-3 bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-lg p-2.5">
            <div className="text-[9px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-1.5">
              Building types
            </div>
            {Object.entries(COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5 text-[10px] text-[var(--color-txt-1)] mb-1 last:mb-0 capitalize">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                {type}
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedBuilding && (
          <div className="bg-[var(--color-bg-0)] border-t border-[var(--color-border)] p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-[15px] font-medium text-[var(--color-txt-0)]">
                  {selectedBuilding.name}
                </div>
                <div className="text-[11px] text-[var(--color-txt-1)] mt-0.5">
                  {selectedBuilding.addr}
                </div>
              </div>
              <button 
                onClick={() => setSelected(null)}
                className="p-1 text-[var(--color-txt-2)] hover:bg-[var(--color-bg-2)] rounded"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
            <p className="text-xs text-[var(--color-txt-1)] leading-relaxed mb-3">
              {selectedBuilding.desc}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-[var(--color-stat)] rounded-lg p-2.5">
                <div className="text-[9px] text-[var(--color-txt-2)] uppercase tracking-wide mb-0.5">Category</div>
                <div className="text-xs font-medium text-[var(--color-txt-0)] capitalize">{selectedBuilding.cat}</div>
              </div>
              <div className="bg-[var(--color-stat)] rounded-lg p-2.5">
                <div className="text-[9px] text-[var(--color-txt-2)] uppercase tracking-wide mb-0.5">Floors</div>
                <div className="text-xs font-medium text-[var(--color-txt-0)]">{selectedBuilding.floors}</div>
              </div>
              <div className="bg-[var(--color-stat)] rounded-lg p-2.5">
                <div className="text-[9px] text-[var(--color-txt-2)] uppercase tracking-wide mb-0.5">Rooms</div>
                <div className="text-xs font-medium text-[var(--color-txt-0)]">{selectedBuilding.rooms}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-gold-dark text-gold rounded-lg px-4 py-2 text-xs flex items-center gap-1.5">
                <Icon name="navigation" size={12} />
                Get directions
              </button>
              <button className="bg-[var(--color-bg-2)] text-[var(--color-txt-0)] border border-[var(--color-border-2)] rounded-lg px-4 py-2 text-xs hover:bg-[var(--color-stat)]">
                My classes here
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
