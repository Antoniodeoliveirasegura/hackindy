import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../components/Icons';

const BUILDINGS = [
  { id: 'ET', name: 'Engineering Technology', short: 'ET', addr: '723 W Michigan St', cat: 'academic', desc: 'Home to Computer Science and Engineering Technology Labs.', floors: 5, rooms: 48, lat: 39.7719, lng: -86.1725, color: '#2062a4' },
  { id: 'SL', name: 'Science & Liberal Arts', short: 'SL', addr: '402 N Blackford St', cat: 'academic', desc: 'Biology, Chemistry, Physics, and Liberal Arts departments.', floors: 4, rooms: 36, lat: 39.7715, lng: -86.1750, color: '#2062a4' },
  { id: 'CC', name: 'Campus Center', short: 'CC', addr: '420 University Blvd', cat: 'admin', desc: 'Student life hub, bookstore, and meeting rooms.', floors: 3, rooms: 22, lat: 39.7711, lng: -86.1770, color: '#a06010' },
  { id: 'TD', name: 'Tower Dining', short: 'TD', addr: '425 N University Blvd', cat: 'dining', desc: 'Main campus social dining hub. Open daily.', floors: 2, rooms: 4, lat: 39.7725, lng: -86.1775, color: '#3d7e18' },
  { id: 'CAV', name: 'Cavanaugh Hall', short: 'CAV', addr: '425 University Blvd', cat: 'academic', desc: 'School of Liberal Arts. Sociology department and classes here.', floors: 5, rooms: 40, lat: 39.7718, lng: -86.1764, color: '#2062a4' },
  { id: 'LIB', name: 'University Library', short: 'LIB', addr: '755 W Michigan St', cat: 'academic', desc: '400,000+ volumes and 24/7 study access.', floors: 4, rooms: 30, lat: 39.7710, lng: -86.1710, color: '#2062a4' },
  { id: 'BUS', name: 'Transit Hub', short: 'BUS', addr: 'Michigan St & University Blvd', cat: 'transit', desc: 'Main stop for JagLine shuttles.', floors: 1, rooms: 2, lat: 39.7720, lng: -86.1745, color: '#5040b0' }
];

const CAT_COLORS = { academic: '#2062a4', dining: '#3d7e18', admin: '#a06010', transit: '#5040b0' };
const FILTERS = ['all', 'academic', 'dining', 'admin', 'transit'];

// Helper to pan the map
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function Map() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [mapCenter, setMapCenter] = useState([39.7720, -86.1750]);
  const [zoom, setZoom] = useState(16);

  const filteredBuildings = BUILDINGS.filter(b => 
    (filter === 'all' || b.cat === filter) && 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedBuilding = BUILDINGS.find(b => b.id === selectedId);

  const handleSelect = (b) => {
    setSelectedId(b.id);
    setMapCenter([b.lat, b.lng]);
    setZoom(18);
  };

  return (
    <div className="grid grid-cols-[320px_1fr] h-[calc(100vh-52px)] overflow-hidden bg-white">
      
      {/* Sidebar */}
      <aside className="border-r border-gray-200 flex flex-col z-10 shadow-xl bg-white">
        <div className="p-4 border-b border-gray-100">
          <div className="relative mb-3">
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Icon name="search" size={16} />
            </div>
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search buildings..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm outline-none focus:ring-2 ring-[#CFB991]/50"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all uppercase tracking-wider ${
                  filter === f ? 'bg-[#3E2200] text-[#CFB991] border-[#3E2200]' : 'bg-white text-gray-400 border-gray-200 hover:border-[#CFB991]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredBuildings.map(b => (
            <div 
              key={b.id} 
              onClick={() => handleSelect(b)}
              className={`p-4 cursor-pointer hover:bg-slate-50 transition-all group ${
                selectedId === b.id ? 'bg-[#CFB991]/10 border-l-4 border-[#CFB991]' : 'border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                <div>
                  <div className="text-xs font-bold text-[#3E2200]">{b.name}</div>
                  <div className="text-[10px] text-gray-400 font-medium">{b.addr}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Map Area */}
      <main className="relative flex-1 bg-[#f4f2ee]">
        <MapContainer center={mapCenter} zoom={zoom} zoomControl={false} className="w-full h-full">
          {/* Professional Light Tiles */}
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <ChangeView center={mapCenter} zoom={zoom} />
          
          {filteredBuildings.map(b => (
            <CircleMarker 
              key={b.id}
              center={[b.lat, b.lng]}
              pathOptions={{ 
                fillColor: b.color, 
                color: selectedId === b.id ? '#000' : '#fff',
                weight: selectedId === b.id ? 3 : 2,
                fillOpacity: 0.8 
              }}
              radius={selectedId === b.id ? 14 : 10}
              eventHandlers={{ click: () => handleSelect(b) }}
            />
          ))}
        </MapContainer>

        {/* Floating Legend */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-black/5 rounded-2xl p-4 shadow-xl z-[1000] w-40">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Campus Key</div>
          {Object.entries(CAT_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2.5 text-xs text-[#3E2200] mb-2 last:mb-0 capitalize font-medium">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              {type}
            </div>
          ))}
        </div>

        {/* Detail Panel - Appears on Click */}
        {selectedBuilding && (
          <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-[440px] bg-white rounded-3xl border border-gray-100 p-8 shadow-2xl z-[1001] animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-black text-[#3E2200] leading-tight">{selectedBuilding.name}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedBuilding.addr}</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-full">
                <Icon name="close" size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {selectedBuilding.desc} 
              {selectedBuilding.id === 'CAV' && <span className="block mt-2 font-bold text-[#CFB991]">Class of 2026: Sociology major hub.</span>}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8 text-center">
              <div className="bg-[#f4f2ee] p-3 rounded-2xl border border-black/5">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Type</p>
                <p className="text-xs font-black text-[#3E2200] capitalize">{selectedBuilding.cat}</p>
              </div>
              <div className="bg-[#f4f2ee] p-3 rounded-2xl border border-black/5">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Floors</p>
                <p className="text-xs font-black text-[#3E2200]">{selectedBuilding.floors}</p>
              </div>
              <div className="bg-[#f4f2ee] p-3 rounded-2xl border border-black/5">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Rooms</p>
                <p className="text-xs font-black text-[#3E2200]">{selectedBuilding.rooms}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 bg-[#3E2200] text-[#CFB991] font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Get Directions</button>
              <button className="px-6 py-4 bg-slate-100 text-[#3E2200] font-bold rounded-2xl hover:bg-[#CFB991]/20 transition-colors">
                <Icon name="calendar" size={18} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
