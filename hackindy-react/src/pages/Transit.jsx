import { useState, useEffect } from 'react'
import Icon from '../components/Icons'

const routes = [
  {
    id: 1,
    name: 'Route 1 · Crimson',
    color: '#D64550',
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
    color: '#6B7B8C',
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
    name: 'Route 3 · Gold',
    color: '#D4A84B',
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
    color: '#7B5EA7',
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={`max-w-[1000px] mx-auto px-6 py-8 pb-24 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Campus Transit</h1>
          <p className="text-[14px] text-[var(--color-txt-2)] mt-1">
            JAGLINE shuttle schedules and live tracking
          </p>
        </div>
        <a 
          href="https://iuindianapolis.transloc.com/routes" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[13px] text-[var(--color-accent)] flex items-center gap-1.5 hover:gap-2 transition-all font-medium"
        >
          Live tracker
          <Icon name="external" size={14} />
        </a>
      </div>

      {/* Route Cards */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6 animate-fade-in-up stagger-1">
        {routes.map((route, idx) => {
          const isSelected = selectedRoute.id === route.id
          return (
            <div
              key={route.id}
              onClick={() => setSelectedRoute(route)}
              className={`card card-interactive p-4 transition-all duration-300
                ${isSelected ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-1)]' : ''}`}
              style={{ 
                ringColor: isSelected ? route.color : 'transparent',
                animationDelay: `${idx * 0.05}s`
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-4 h-4 rounded-full ring-4 ring-offset-1 ring-offset-[var(--color-surface)]"
                  style={{ 
                    background: route.color,
                    ringColor: `${route.color}20`
                  }}
                />
                <span className="text-[14px] font-semibold text-[var(--color-txt-0)]">{route.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[12px] text-[var(--color-txt-2)]">
                  {route.stops[0]} → {route.stops[route.stops.length - 1]}
                </div>
                <div className="text-right">
                  <div className="text-[22px] font-semibold text-[var(--color-txt-0)] leading-none">
                    {route.schedule[0].mins}
                    <span className="text-[11px] font-normal text-[var(--color-txt-2)] ml-1">min</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Route Details */}
      <div className="card p-6 animate-fade-in-up stagger-2">
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-5 h-5 rounded-full ring-4 ring-offset-2 ring-offset-[var(--color-surface)]"
            style={{ 
              background: selectedRoute.color,
              ringColor: `${selectedRoute.color}20`
            }}
          />
          <div>
            <h2 className="text-[18px] font-semibold text-[var(--color-txt-0)]">{selectedRoute.name}</h2>
            <p className="text-[13px] text-[var(--color-txt-2)]">{selectedRoute.frequency} · {selectedRoute.hours}</p>
          </div>
        </div>

        {/* Stops */}
        <div className="mb-6">
          <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-3">
            Route Stops
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedRoute.stops.map((stop, idx) => (
              <div key={stop} className="flex items-center gap-2">
                <div className="relative">
                  <span className="text-[12px] bg-[var(--color-stat)] hover:bg-[var(--color-bg-3)] rounded-xl px-4 py-2 text-[var(--color-txt-0)] transition-colors inline-block">
                    {stop}
                  </span>
                  {idx === 0 && (
                    <span 
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-surface)]"
                      style={{ background: selectedRoute.color }}
                    />
                  )}
                </div>
                {idx < selectedRoute.stops.length - 1 && (
                  <div className="flex items-center text-[var(--color-txt-3)]">
                    <div className="w-4 h-px bg-[var(--color-border-2)]" />
                    <Icon name="chevronDown" size={12} className="rotate-[-90deg]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Departures */}
        <div className="mb-6">
          <div className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-3">
            Upcoming Departures
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {selectedRoute.schedule.map((dep, idx) => (
              <div 
                key={idx}
                className={`rounded-xl p-4 text-center transition-all hover:scale-[1.02]
                  ${idx === 0 
                    ? 'bg-gradient-to-br from-[var(--color-bus-bg)] to-[var(--color-bus-bg)]/50 border border-[var(--color-bus-sub)]/10' 
                    : 'bg-[var(--color-stat)]'
                  }`}
              >
                <div className={`text-[28px] font-semibold leading-none ${idx === 0 ? 'text-[var(--color-bus-title)]' : 'text-[var(--color-txt-0)]'}`}>
                  {dep.mins}
                </div>
                <div className={`text-[11px] mt-1 ${idx === 0 ? 'text-[var(--color-bus-sub)]' : 'text-[var(--color-txt-2)]'}`}>
                  min · {dep.time}
                </div>
                {idx === 0 && (
                  <div className="text-[10px] font-medium text-[var(--color-bus-title)] mt-2 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                    Next bus
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-5 border-t border-[var(--color-border)]">
          <button className="btn btn-primary text-[12px] px-4 py-2.5 flex-1">
            <Icon name="mapPin" size={14} />
            View on Map
          </button>
          <button className="btn btn-secondary text-[12px] px-4 py-2.5 flex-1">
            <Icon name="clock" size={14} />
            Set Alert
          </button>
          <a 
            href="https://iuindianapolis.transloc.com/routes" 
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary text-[12px] px-4 py-2.5 flex-1"
          >
            <Icon name="external" size={14} />
            Live Tracker
          </a>
        </div>
      </div>
    </div>
  )
}
