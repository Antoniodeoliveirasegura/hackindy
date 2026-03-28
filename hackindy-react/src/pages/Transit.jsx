import { useState } from 'react'
import Icon from '../components/Icons'

const routes = [
  {
    id: 1,
    name: 'Route 1 · Crimson',
    color: '#c41e3a',
    stops: ['Union', 'ET Building', 'Campus Center', 'Library', 'Parking Garage'],
    schedule: [
      { time: '12:38 PM', mins: 8 },
      { time: '1:08 PM', mins: 38 },
      { time: '1:38 PM', mins: 68 },
      { time: '2:08 PM', mins: 98 },
    ],
    hours: '6:30 AM – 10:00 PM',
    frequency: 'Every 30 min',
  },
  {
    id: 2,
    name: 'Route 2 · Gray',
    color: '#6b7280',
    stops: ['North Campus', 'Medical Center', 'Union', 'South Parking'],
    schedule: [
      { time: '12:45 PM', mins: 15 },
      { time: '1:15 PM', mins: 45 },
      { time: '1:45 PM', mins: 75 },
    ],
    hours: '6:30 AM – 10:00 PM',
    frequency: 'Every 30 min',
  },
  {
    id: 3,
    name: 'Route 3 · Yellow',
    color: '#f59e0b',
    stops: ['Campus Center', 'Apartments North', 'Recreation Center'],
    schedule: [
      { time: '12:50 PM', mins: 20 },
      { time: '1:20 PM', mins: 50 },
      { time: '1:50 PM', mins: 80 },
    ],
    hours: '5:30 AM – 12:15 AM',
    frequency: 'Every 30 min',
  },
  {
    id: 4,
    name: 'Route 5 · Purple',
    color: '#8b5cf6',
    stops: ['Union', 'IndyGo Red Line', 'IndyGo Purple Line', 'Downtown'],
    schedule: [
      { time: '1:00 PM', mins: 30 },
      { time: '1:30 PM', mins: 60 },
      { time: '2:00 PM', mins: 90 },
    ],
    hours: '7:00 AM – 10:00 PM',
    frequency: 'Every 30 min',
  },
]

export default function Transit() {
  const [selectedRoute, setSelectedRoute] = useState(routes[0])

  return (
    <div className="max-w-[900px] mx-auto px-8 py-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-medium text-[var(--color-txt-0)]">Campus Transit</h1>
          <p className="text-[13px] text-[var(--color-txt-1)] mt-1">
            JAGLINE shuttle schedules and live tracking
          </p>
        </div>
        <a 
          href="https://iuindianapolis.transloc.com/routes" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-[var(--color-accent)] flex items-center gap-1 hover:underline"
        >
          Live tracker
          <Icon name="external" size={12} />
        </a>
      </div>

      {/* Route Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {routes.map(route => (
          <div
            key={route.id}
            onClick={() => setSelectedRoute(route)}
            className={`bg-[var(--color-bg-0)] border rounded-xl p-4 cursor-pointer transition-all
              ${selectedRoute.id === route.id 
                ? 'border-[var(--color-accent)]' 
                : 'border-[var(--color-border)] hover:border-[var(--color-border-2)]'
              }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ background: route.color }}
              />
              <span className="text-sm font-medium text-[var(--color-txt-0)]">{route.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-txt-2)]">
                {route.stops[0]} → {route.stops[route.stops.length - 1]}
              </span>
              <div className="text-right">
                <div className="text-lg font-semibold text-[var(--color-txt-0)]">
                  {route.schedule[0].mins}<span className="text-[11px] font-normal text-[var(--color-txt-2)]"> min</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Route Details */}
      <div className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ background: selectedRoute.color }}
          />
          <div>
            <h2 className="text-lg font-medium text-[var(--color-txt-0)]">{selectedRoute.name}</h2>
            <p className="text-xs text-[var(--color-txt-2)]">{selectedRoute.frequency} · {selectedRoute.hours}</p>
          </div>
        </div>

        {/* Stops */}
        <div className="mb-5">
          <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-2">
            Stops
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedRoute.stops.map((stop, idx) => (
              <div key={stop} className="flex items-center gap-2">
                <span className="text-xs bg-[var(--color-stat)] rounded-lg px-3 py-1.5 text-[var(--color-txt-0)]">
                  {stop}
                </span>
                {idx < selectedRoute.stops.length - 1 && (
                  <Icon name="arrowUpRight" size={12} className="text-[var(--color-txt-2)] rotate-45" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Departures */}
        <div>
          <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-2">
            Upcoming Departures
          </div>
          <div className="grid grid-cols-4 gap-2">
            {selectedRoute.schedule.map((dep, idx) => (
              <div 
                key={idx}
                className={`rounded-xl p-3 text-center
                  ${idx === 0 
                    ? 'bg-[var(--color-bus-bg)]' 
                    : 'bg-[var(--color-stat)]'
                  }`}
              >
                <div className={`text-xl font-semibold ${idx === 0 ? 'text-[var(--color-bus-title)]' : 'text-[var(--color-txt-0)]'}`}>
                  {dep.mins}
                </div>
                <div className={`text-[10px] ${idx === 0 ? 'text-[var(--color-bus-sub)]' : 'text-[var(--color-txt-2)]'}`}>
                  min · {dep.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-5 pt-4 border-t border-[var(--color-border)]">
          <button className="flex-1 bg-gold-dark text-gold rounded-lg px-3 py-2.5 text-xs flex items-center justify-center gap-1.5">
            <Icon name="mapPin" size={12} />
            View on map
          </button>
          <button className="flex-1 bg-[var(--color-bg-2)] text-[var(--color-txt-0)] border border-[var(--color-border-2)] rounded-lg px-3 py-2.5 text-xs hover:bg-[var(--color-stat)]">
            Set alert
          </button>
          <a 
            href="https://iuindianapolis.transloc.com/routes" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[var(--color-bg-2)] text-[var(--color-txt-0)] border border-[var(--color-border-2)] rounded-lg px-3 py-2.5 text-xs hover:bg-[var(--color-stat)] flex items-center justify-center gap-1.5"
          >
            Live tracker
            <Icon name="external" size={12} />
          </a>
        </div>
      </div>
    </div>
  )
}
