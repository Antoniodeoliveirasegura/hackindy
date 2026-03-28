import { Link } from 'react-router-dom'
import Icon from '../components/Icons'

const quickActions = [
  { path: '/map', label: 'Map', sub: 'Find buildings', icon: 'mapPin', color: 'map' },
  { path: '/dining', label: 'Dining', sub: 'Open now', icon: 'dining', color: 'dining' },
  { path: '/transit', label: 'Bus', sub: 'Next in 8 min', icon: 'bus', color: 'bus' },
  { path: '/events', label: 'Events', sub: '3 today', icon: 'calendar', color: 'events' },
]

const suggestions = [
  { icon: 'coffee', text: 'Grab coffee at the Union' },
  { icon: 'book', text: 'Study at Cavanaugh Hall' },
  { icon: 'dining', text: 'Lunch at Tower Dining' },
]

const events = [
  { title: 'Hackathon Kickoff Workshop', time: '10:00 AM · ET 108', type: 'e', badge: 'Engineering' },
  { title: 'Spring Career Fair', time: '12:00 PM · Campus Center Ballroom', type: 'c', badge: 'Career' },
  { title: 'Student Org Showcase', time: '3:00 PM · IUPUI Commons', type: 's', badge: 'Social' },
]

const busSchedule = [
  { time: '12:38 PM', route: 'Union → ET → Campus Ctr' },
  { time: '1:08 PM', route: 'Union → ET → Campus Ctr' },
  { time: '1:38 PM', route: 'Union → ET → Campus Ctr' },
]

const boardPosts = [
  { title: 'Anyone know if ET 215 has outlets near the windows?', user: 'Anonymous', votes: 14, replies: 5 },
  { title: 'Best place to study during finals week?', user: 'sarah_k', votes: 31, replies: 12 },
  { title: 'Is the Career Fair open to freshmen?', user: 'Anonymous', votes: 8, replies: 3 },
]

const menuItems = {
  entrees: ['Grilled Chicken', 'Pasta Marinara', 'Black Bean Burger', 'Mac & Cheese', 'Beef Stir-Fry'],
  sides: ['Caesar Salad', 'Roasted Veggies', 'Garlic Bread', 'Fresh Fruit'],
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
  e: 'bg-[#2062a4]',
  c: 'bg-[#3d7e18]',
  s: 'bg-[#a33060]',
}

export default function Home() {
  return (
    <div className="max-w-[1160px] mx-auto px-8 py-6 pb-20">
      {/* Greeting */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-medium text-[var(--color-txt-0)] flex items-center gap-2">
            Good morning, Jordan
            <Icon name="wave" size={24} />
          </h1>
          <p className="text-[13px] text-[var(--color-txt-1)] mt-1">
            Here's what's happening on campus today.
          </p>
        </div>
        <div className="text-xs text-[var(--color-txt-1)] bg-[var(--color-bg-0)] border border-[var(--color-border-2)] rounded-lg px-3.5 py-1.5 flex items-center gap-1.5">
          <Icon name="calendar" size={13} className="text-[var(--color-txt-2)]" />
          Friday, March 27, 2026
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {quickActions.map(({ path, label, sub, icon, color }) => (
          <Link
            key={path}
            to={path}
            className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-3.5 flex items-center gap-3 hover:bg-[var(--color-bg-2)] hover:border-[var(--color-border-2)] hover:-translate-y-0.5 transition-all"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
              <Icon name={icon} size={18} />
            </div>
            <div>
              <div className="text-[13px] font-medium text-[var(--color-txt-0)]">{label}</div>
              <div className="text-[11px] text-[var(--color-txt-2)]">{sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Next Class */}
        <div className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-border-2)] transition-colors">
          <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-2.5">
            Next class
          </div>
          <div className="bg-[var(--color-cls-bg)] rounded-lg p-3 mt-1.5">
            <div className="text-[10px] font-semibold text-[var(--color-cls-sub)] tracking-wide">CS 30200</div>
            <div className="text-sm font-medium text-[var(--color-cls-title)] my-1">Software Engineering</div>
            <div className="text-[11px] text-[var(--color-cls-sub)]">ET 215 · 1:30 – 2:45 PM · Prof. Nguyen</div>
          </div>
          <div className="flex gap-1.5 mt-2.5">
            <Link to="/schedule" className="text-[11px] px-3 py-1.5 rounded-md border border-[var(--color-border-2)] text-[var(--color-txt-1)] flex items-center gap-1.5 hover:bg-[var(--color-bg-2)] transition-colors">
              <Icon name="calendar" size={12} />
              View schedule
            </Link>
            <Link to="/map" className="text-[11px] px-3 py-1.5 rounded-md border border-[var(--color-border-2)] text-[var(--color-txt-1)] flex items-center gap-1.5 hover:bg-[var(--color-bg-2)] transition-colors">
              <Icon name="mapPin" size={12} />
              Find building
            </Link>
          </div>
        </div>

        {/* Time Insight */}
        <div className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-border-2)] transition-colors">
          <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-2.5">
            Time insight
          </div>
          <div className="text-[32px] font-medium text-[var(--color-txt-0)] leading-none my-1.5">1h 22m</div>
          <div className="text-[13px] text-[var(--color-txt-1)]">Free before Software Engineering</div>
          <div className="bg-[var(--color-stat)] rounded-lg p-2.5 mt-3">
            <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-1.5">
              Suggestions
            </div>
            {suggestions.map(({ icon, text }, idx) => (
              <div key={idx} className="text-xs text-[var(--color-txt-0)] flex items-center gap-2 mb-1 last:mb-0">
                <Icon name={icon} size={14} className="text-[var(--color-txt-2)]" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dining Card */}
      <div className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-4 mb-3 hover:border-[var(--color-border-2)] transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide">
            Tower Dining
          </div>
          <Link to="/dining" className="text-[11px] text-[var(--color-accent)] flex items-center gap-1 hover:gap-1.5 transition-all">
            Full menu
            <Icon name="arrowUpRight" size={12} />
          </Link>
        </div>
        <div className="text-xs text-[var(--color-txt-1)] flex items-center gap-1.5 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse-dot" />
          Open now · Lunch · Closes 2:00 PM
        </div>
        <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-1.5">
          Entrées
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {menuItems.entrees.map((item) => (
            <span key={item} className="text-[11px] bg-[var(--color-bg-2)] border border-[var(--color-border)] rounded-full px-2.5 py-1 text-[var(--color-txt-1)]">
              {item}
            </span>
          ))}
        </div>
        <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-1.5">
          Sides & salads
        </div>
        <div className="flex flex-wrap gap-1.5">
          {menuItems.sides.map((item) => (
            <span key={item} className="text-[11px] bg-[var(--color-bg-2)] border border-[var(--color-border)] rounded-full px-2.5 py-1 text-[var(--color-txt-1)]">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Events Card */}
      <div className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-4 mb-3 hover:border-[var(--color-border-2)] transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide">
            Events today
          </div>
          <Link to="/events" className="text-[11px] text-[var(--color-accent)] flex items-center gap-1 hover:gap-1.5 transition-all">
            See all
            <Icon name="arrowUpRight" size={12} />
          </Link>
        </div>
        <div className="flex gap-1.5 mb-2">
          {['All', 'Engineering', 'Career', 'Social'].map((pill, idx) => (
            <button
              key={pill}
              className={`text-[11px] px-3 py-1 rounded-full border transition-colors
                ${idx === 0 
                  ? 'bg-gold-dark text-gold border-gold-dark' 
                  : 'bg-[var(--color-bg-2)] text-[var(--color-txt-1)] border-[var(--color-border-2)] hover:bg-[var(--color-stat)]'
                }`}
            >
              {pill}
            </button>
          ))}
        </div>
        <div className="flex flex-col">
          {events.map(({ title, time, type, badge }, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 py-2 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-stat)] -mx-1 px-1 rounded transition-colors"
            >
              <div className={`w-1.5 h-1.5 rounded-sm ${dotColors[type]}`} />
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[var(--color-txt-0)]">{title}</div>
                <div className="text-[11px] text-[var(--color-txt-2)] flex items-center gap-1 mt-0.5">
                  <Icon name="clock" size={10} />
                  {time}
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColors[type]}`}>
                {badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Two Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bus */}
        <div className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-border-2)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide">
              Campus Connect Bus
            </div>
            <Link to="/transit" className="text-[11px] text-[var(--color-accent)] flex items-center gap-1 hover:gap-1.5 transition-all">
              Schedule
              <Icon name="arrowUpRight" size={12} />
            </Link>
          </div>
          <div className="bg-[var(--color-bus-bg)] rounded-lg p-3 mt-2 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-[var(--color-bus-title)] flex items-center gap-1.5">
                <Icon name="bus" size={13} />
                Route 1 · West Lafayette Shuttle
              </div>
              <div className="text-[10px] text-[var(--color-bus-sub)] mt-0.5">
                Union → ET Building → Campus Ctr
              </div>
            </div>
            <div className="text-right">
              <div className="text-[22px] font-semibold text-[var(--color-bus-title)]">
                8<span className="text-[11px] font-normal text-[var(--color-bus-sub)]"> min</span>
              </div>
              <div className="text-[10px] text-[var(--color-bus-sub)]">12:38 PM</div>
            </div>
          </div>
          <div className="mt-2">
            {busSchedule.map(({ time, route }, idx) => (
              <div key={idx} className="flex justify-between text-[11px] py-1 border-b border-[var(--color-border)] last:border-b-0">
                <span className="font-medium text-[var(--color-txt-0)]">{time}</span>
                <span className="text-[var(--color-txt-2)]">{route}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Board */}
        <div className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-border-2)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide">
              Campus board
            </div>
            <Link to="/board" className="text-[11px] text-[var(--color-accent)] flex items-center gap-1 hover:gap-1.5 transition-all">
              View board
              <Icon name="arrowUpRight" size={12} />
            </Link>
          </div>
          {boardPosts.map(({ title, user, votes, replies }, idx) => (
            <div key={idx} className="py-2 border-b border-[var(--color-border)] last:border-b-0">
              <Link to="/board" className="text-xs font-medium text-[var(--color-txt-0)] hover:text-[var(--color-accent)] transition-colors">
                {title}
              </Link>
              <div className="text-[10px] text-[var(--color-txt-2)] mt-1 flex items-center gap-2">
                <span>{user}</span>
                <span className="flex items-center gap-0.5">
                  <Icon name="chevronUp" size={10} />
                  {votes}
                </span>
                <span>{replies} replies</span>
              </div>
            </div>
          ))}
          <Link
            to="/board"
            className="text-[11px] mt-2 px-3 py-1.5 rounded-md border border-[var(--color-border-2)] text-[var(--color-txt-1)] inline-flex items-center gap-1.5 hover:bg-[var(--color-bg-2)] transition-colors"
          >
            <Icon name="plus" size={12} />
            Ask a question
          </Link>
        </div>
      </div>
    </div>
  )
}
