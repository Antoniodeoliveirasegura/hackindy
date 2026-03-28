import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icons'

const quickActions = [
  { path: '/map', label: 'Campus Map', sub: 'Find any building', icon: 'mapPin', color: 'map' },
  { path: '/dining', label: 'Dining', sub: 'See what\'s open', icon: 'dining', color: 'dining' },
  { path: '/transit', label: 'Transit', sub: 'Live bus times', icon: 'bus', color: 'bus' },
  { path: '/events', label: 'Events', sub: '3 happening today', icon: 'calendar', color: 'events' },
]

const suggestions = [
  { icon: 'coffee', text: 'Grab coffee at the Union', time: '5 min walk' },
  { icon: 'book', text: 'Study at Cavanaugh Hall', time: 'Quiet hours' },
  { icon: 'dining', text: 'Lunch at Tower Dining', time: 'Opens 11 AM' },
]

const events = [
  { title: 'Hackathon Kickoff Workshop', time: '10:00 AM', location: 'ET 108', type: 'e', badge: 'Engineering' },
  { title: 'Spring Career Fair', time: '12:00 PM', location: 'Campus Center', type: 'c', badge: 'Career' },
  { title: 'Student Org Showcase', time: '3:00 PM', location: 'IUPUI Commons', type: 's', badge: 'Social' },
]

const busSchedule = [
  { time: '12:38 PM', route: 'Union → ET → Campus Ctr', mins: 8 },
  { time: '1:08 PM', route: 'Union → ET → Campus Ctr', mins: 38 },
  { time: '1:38 PM', route: 'Union → ET → Campus Ctr', mins: 68 },
]

const boardPosts = [
  { title: 'Anyone know if ET 215 has outlets near the windows?', user: 'Anonymous', votes: 14, replies: 5, hot: true },
  { title: 'Best place to study during finals week?', user: 'sarah_k', votes: 31, replies: 12, hot: true },
  { title: 'Is the Career Fair open to freshmen?', user: 'Anonymous', votes: 8, replies: 3, hot: false },
]

const menuItems = {
  entrees: ['Grilled Chicken', 'Pasta Marinara', 'Black Bean Burger', 'Mac & Cheese'],
  sides: ['Caesar Salad', 'Roasted Veggies', 'Garlic Bread'],
}

const colorMap = {
  map: 'bg-[var(--color-map-bg)] text-[var(--color-map-color)]',
  dining: 'bg-[var(--color-dining-bg)] text-[var(--color-dining-color)]',
  bus: 'bg-[var(--color-bus-bg)] text-[var(--color-bus-title)]',
  events: 'bg-[var(--color-events-bg)] text-[var(--color-events-color)]',
}

const badgeColors = {
  e: 'bg-[var(--color-map-bg)] text-[var(--color-map-color)]',
  c: 'bg-[var(--color-dining-bg)] text-[var(--color-dining-color)]',
  s: 'bg-[var(--color-events-bg)] text-[var(--color-events-color)]',
}

const dotColors = {
  e: 'bg-[var(--color-map-color)]',
  c: 'bg-[var(--color-dining-color)]',
  s: 'bg-[var(--color-events-color)]',
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getCurrentDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const { getFirstName } = useAuth()
  const firstName = getFirstName()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 pb-24">
      {/* Hero Section */}
      <div 
        className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-txt-0)] flex items-center gap-3">
              {getGreeting()}, {firstName}
              <span className="animate-wave text-2xl">👋</span>
            </h1>
            <p className="text-[14px] text-[var(--color-txt-2)] mt-2">
              Here's what's happening on campus today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[var(--color-txt-2)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 shadow-sm">
            <Icon name="calendar" size={14} className="text-[var(--color-txt-3)]" />
            {getCurrentDate()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div 
        className={`grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {quickActions.map(({ path, label, sub, icon, color }, idx) => (
          <Link
            key={path}
            to={path}
            className="group card card-interactive p-4 flex items-center gap-4"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]} transition-transform duration-300 group-hover:scale-110`}>
              <Icon name={icon} size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-[var(--color-txt-0)] group-hover:text-[var(--color-accent)] transition-colors">
                {label}
              </div>
              <div className="text-[12px] text-[var(--color-txt-2)] mt-0.5 truncate">{sub}</div>
            </div>
            <Icon name="arrowUpRight" size={16} className="text-[var(--color-txt-3)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Next Class Card */}
        <div 
          className={`card p-5 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">
              Next Class
            </span>
            <span className="text-[11px] text-[var(--color-txt-2)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              In 1h 22m
            </span>
          </div>
          
          <div className="bg-gradient-to-br from-[var(--color-cls-bg)] to-[var(--color-cls-bg)]/50 rounded-xl p-4 border border-[var(--color-cls-sub)]/10">
            <div className="text-[11px] font-semibold text-[var(--color-cls-sub)] tracking-wide">CS 30200</div>
            <div className="text-[16px] font-semibold text-[var(--color-cls-title)] mt-1">Software Engineering</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--color-cls-sub)] mt-2">
              <span className="flex items-center gap-1.5">
                <Icon name="mapPin" size={12} />
                ET 215
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="clock" size={12} />
                1:30 – 2:45 PM
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="user" size={12} />
                Prof. Nguyen
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Link to="/schedule" className="btn btn-secondary text-[12px] px-4 py-2 flex-1">
              <Icon name="calendar" size={14} />
              Full Schedule
            </Link>
            <Link to="/map" className="btn btn-secondary text-[12px] px-4 py-2 flex-1">
              <Icon name="navigation" size={14} />
              Get Directions
            </Link>
          </div>
        </div>

        {/* Time Insight Card */}
        <div 
          className={`card p-5 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">
              Free Time
            </span>
            <span className="badge bg-[var(--color-gold)]/10 text-[var(--color-gold-muted)]">
              <Icon name="sparkles" size={10} />
              AI Suggestions
            </span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[42px] font-semibold text-[var(--color-txt-0)] leading-none tracking-tight">1h 22m</span>
          </div>
          <p className="text-[13px] text-[var(--color-txt-2)] mb-4">
            Free before your Software Engineering class
          </p>
          
          <div className="bg-[var(--color-stat)] rounded-xl p-4">
            <div className="text-[10px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-3">
              What you could do
            </div>
            <div className="space-y-2.5">
              {suggestions.map(({ icon, text, time }, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-[var(--color-bg-2)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-2)] group-hover:bg-[var(--color-bg-3)] flex items-center justify-center transition-colors">
                      <Icon name={icon} size={16} className="text-[var(--color-txt-2)]" />
                    </div>
                    <span className="text-[13px] text-[var(--color-txt-0)]">{text}</span>
                  </div>
                  <span className="text-[11px] text-[var(--color-txt-3)]">{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dining Card */}
      <div 
        className={`card p-5 mb-4 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">
              Tower Dining
            </span>
            <div className="flex items-center gap-2 text-[12px] text-[var(--color-txt-2)]">
              <span className="status-dot status-open" />
              Open · Lunch · Closes 2:00 PM
            </div>
          </div>
          <Link to="/dining" className="text-[12px] text-[var(--color-accent)] flex items-center gap-1 hover:gap-2 transition-all font-medium">
            Full menu
            <Icon name="arrowUpRight" size={14} />
          </Link>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Icon name="dining" size={12} />
              Today's Entrées
            </div>
            <div className="flex flex-wrap gap-2">
              {menuItems.entrees.map((item) => (
                <span 
                  key={item} 
                  className="text-[12px] bg-[var(--color-stat)] hover:bg-[var(--color-bg-3)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-[var(--color-txt-1)] transition-colors cursor-default"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-2">
              Sides & Salads
            </div>
            <div className="flex flex-wrap gap-2">
              {menuItems.sides.map((item) => (
                <span 
                  key={item} 
                  className="text-[12px] bg-[var(--color-stat)] hover:bg-[var(--color-bg-3)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-[var(--color-txt-1)] transition-colors cursor-default"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Events Card */}
      <div 
        className={`card p-5 mb-4 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">
            Events Today
          </span>
          <Link to="/events" className="text-[12px] text-[var(--color-accent)] flex items-center gap-1 hover:gap-2 transition-all font-medium">
            See all events
            <Icon name="arrowUpRight" size={14} />
          </Link>
        </div>
        
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {['All', 'Engineering', 'Career', 'Social'].map((pill, idx) => (
            <button
              key={pill}
              className={`pill whitespace-nowrap transition-all ${idx === 0 ? 'pill-active' : ''}`}
            >
              {pill}
            </button>
          ))}
        </div>
        
        <div className="space-y-2">
          {events.map(({ title, time, location, type, badge }, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-stat)] transition-all cursor-pointer group"
            >
              <div className={`w-1.5 h-8 rounded-full ${dotColors[type]}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-[var(--color-txt-0)] group-hover:text-[var(--color-accent)] transition-colors">
                  {title}
                </div>
                <div className="text-[12px] text-[var(--color-txt-2)] flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Icon name="clock" size={11} />
                    {time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="mapPin" size={11} />
                    {location}
                  </span>
                </div>
              </div>
              <span className={`badge ${badgeColors[type]}`}>
                {badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Bus Card */}
        <div 
          className={`card p-5 transition-all duration-700 delay-[600ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">
              Campus Connect Bus
            </span>
            <Link to="/transit" className="text-[12px] text-[var(--color-accent)] flex items-center gap-1 hover:gap-2 transition-all font-medium">
              Full schedule
              <Icon name="arrowUpRight" size={14} />
            </Link>
          </div>
          
          <div className="bg-gradient-to-br from-[var(--color-bus-bg)] to-[var(--color-bus-bg)]/50 rounded-xl p-4 flex items-center justify-between border border-[var(--color-bus-sub)]/10">
            <div>
              <div className="text-[12px] font-semibold text-[var(--color-bus-title)] flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[var(--color-bus-title)]/10 flex items-center justify-center">
                  <Icon name="bus" size={14} />
                </div>
                Route 1 · West Lafayette
              </div>
              <div className="text-[11px] text-[var(--color-bus-sub)] mt-1">
                Union → ET Building → Campus Ctr
              </div>
            </div>
            <div className="text-right">
              <div className="text-[28px] font-semibold text-[var(--color-bus-title)] leading-none">
                8<span className="text-[12px] font-normal text-[var(--color-bus-sub)] ml-1">min</span>
              </div>
              <div className="text-[11px] text-[var(--color-bus-sub)] mt-0.5">12:38 PM</div>
            </div>
          </div>
          
          <div className="mt-4 space-y-1">
            {busSchedule.slice(1).map(({ time, route, mins }, idx) => (
              <div 
                key={idx} 
                className="flex justify-between items-center text-[12px] py-2 px-2 -mx-2 rounded-lg hover:bg-[var(--color-stat)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[var(--color-txt-0)] w-16">{time}</span>
                  <span className="text-[var(--color-txt-2)]">{route}</span>
                </div>
                <span className="text-[var(--color-txt-3)]">{mins} min</span>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Board Card */}
        <div 
          className={`card p-5 transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">
              Campus Board
            </span>
            <Link to="/board" className="text-[12px] text-[var(--color-accent)] flex items-center gap-1 hover:gap-2 transition-all font-medium">
              View all
              <Icon name="arrowUpRight" size={14} />
            </Link>
          </div>
          
          <div className="space-y-1">
            {boardPosts.map(({ title, user, votes, replies, hot }, idx) => (
              <Link
                key={idx}
                to="/board"
                className="block p-3 -mx-1 rounded-xl hover:bg-[var(--color-stat)] transition-all group"
              >
                <div className="flex items-start gap-3">
                  {hot && (
                    <span className="text-[10px] bg-[var(--color-events-bg)] text-[var(--color-events-color)] px-1.5 py-0.5 rounded font-medium mt-0.5">
                      HOT
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[var(--color-txt-0)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                      {title}
                    </div>
                    <div className="text-[11px] text-[var(--color-txt-2)] mt-1 flex items-center gap-3">
                      <span>{user}</span>
                      <span className="flex items-center gap-1">
                        <Icon name="chevronUp" size={12} />
                        {votes}
                      </span>
                      <span>{replies} replies</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <Link
            to="/board"
            className="btn btn-secondary text-[12px] px-4 py-2.5 w-full mt-4"
          >
            <Icon name="plus" size={14} />
            Ask a question
          </Link>
        </div>
      </div>
    </div>
  )
}
