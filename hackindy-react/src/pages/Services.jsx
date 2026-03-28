import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icons'

const services = [
  {
    category: 'Academic',
    icon: 'graduation',
    color: 'map',
    items: [
      { name: 'University Library', desc: '400,000+ volumes, study rooms, 24/7 during finals', icon: 'library', link: '/map' },
      { name: 'Academic Success Center', desc: 'Free tutoring, writing help, academic coaching', icon: 'graduation', link: '/map' },
      { name: 'Career Services', desc: 'Resume reviews, job fairs, career counseling', icon: 'briefcase', link: null },
      { name: 'IT Help Desk', desc: 'Tech support, WiFi help, software access', icon: 'help', link: null },
    ]
  },
  {
    category: 'Campus Life',
    icon: 'heart',
    color: 'events',
    items: [
      { name: 'Campus Board', desc: 'Ask questions and connect with students', icon: 'message', link: '/board' },
      { name: 'Events Calendar', desc: 'Discover what\'s happening on campus', icon: 'calendar', link: '/events' },
      { name: 'Student Organizations', desc: '200+ clubs and organizations', icon: 'users', link: null },
      { name: 'Recreation Center', desc: 'Gym, pool, fitness classes', icon: 'heart', link: null },
    ]
  },
  {
    category: 'Resources',
    icon: 'grid',
    color: 'bus',
    items: [
      { name: 'Campus Map', desc: 'Find buildings, rooms, and directions', icon: 'mapPin', link: '/map' },
      { name: 'Dining Services', desc: 'Menus, hours, and locations', icon: 'dining', link: '/dining' },
      { name: 'Transit & Parking', desc: 'Bus schedules and parking info', icon: 'bus', link: '/transit' },
      { name: 'Printing Services', desc: '25 free pages/day at the library', icon: 'printer', link: null },
    ]
  },
  {
    category: 'Support',
    icon: 'info',
    color: 'dining',
    items: [
      { name: 'Health Services', desc: 'Campus clinic and counseling', icon: 'health', link: null },
      { name: 'Financial Aid', desc: 'Scholarships, grants, and loans', icon: 'briefcase', link: null },
      { name: 'Housing', desc: 'Residence halls and off-campus resources', icon: 'building', link: null },
      { name: 'Campus Safety', desc: '24/7 security and safety resources', icon: 'info', link: null },
    ]
  },
]

const quickLinks = [
  { name: 'WiFi Setup', desc: 'Connect to Purdue-WiFi', icon: 'wifi', color: 'map' },
  { name: 'Class Schedule', desc: 'View your classes', icon: 'schedule', link: '/schedule', color: 'events' },
  { name: 'Campus Map', desc: 'Find any building', icon: 'mapPin', link: '/map', color: 'bus' },
  { name: 'Bus Tracker', desc: 'Live shuttle times', icon: 'bus', link: '/transit', color: 'dining' },
]

const colorConfig = {
  map: { bg: 'bg-[var(--color-map-bg)]', text: 'text-[var(--color-map-color)]' },
  events: { bg: 'bg-[var(--color-events-bg)]', text: 'text-[var(--color-events-color)]' },
  bus: { bg: 'bg-[var(--color-bus-bg)]', text: 'text-[var(--color-bus-title)]' },
  dining: { bg: 'bg-[var(--color-dining-bg)]', text: 'text-[var(--color-dining-color)]' },
}

export default function Services() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={`max-w-[1000px] mx-auto px-6 py-8 pb-24 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Student Services</h1>
        <p className="text-[14px] text-[var(--color-txt-2)] mt-1">
          Everything you need in one place
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 animate-fade-in-up stagger-1">
        {quickLinks.map((link, idx) => {
          const config = colorConfig[link.color]
          return (
            <Link
              key={link.name}
              to={link.link || '#'}
              className="card card-interactive p-5 text-center group"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <Icon name={link.icon} size={22} className={config.text} />
              </div>
              <div className="text-[14px] font-medium text-[var(--color-txt-0)] group-hover:text-[var(--color-accent)] transition-colors">
                {link.name}
              </div>
              <div className="text-[12px] text-[var(--color-txt-2)] mt-0.5">{link.desc}</div>
            </Link>
          )
        })}
      </div>

      {/* Service Categories */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {services.map((category, catIdx) => {
          const config = colorConfig[category.color]
          return (
            <div 
              key={category.category}
              className="card p-5 animate-fade-in-up"
              style={{ animationDelay: `${catIdx * 0.1 + 0.2}s` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <Icon name={category.icon} size={16} className={config.text} />
                </div>
                <span className="text-[12px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">
                  {category.category}
                </span>
              </div>
              
              <div className="space-y-1">
                {category.items.map((item, idx) => {
                  const content = (
                    <div className="flex items-start gap-3 p-3 -mx-2 rounded-xl hover:bg-[var(--color-stat)] transition-all duration-200 cursor-pointer group">
                      <div className="w-9 h-9 rounded-xl bg-[var(--color-stat)] group-hover:bg-[var(--color-bg-3)] flex items-center justify-center shrink-0 transition-colors">
                        <Icon name={item.icon} size={17} className="text-[var(--color-txt-2)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-[var(--color-txt-0)] group-hover:text-[var(--color-accent)] flex items-center gap-1.5 transition-colors">
                          {item.name}
                          {item.link && (
                            <Icon name="arrowUpRight" size={12} className="text-[var(--color-txt-3)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--color-txt-2)] mt-0.5 line-clamp-1">{item.desc}</div>
                      </div>
                    </div>
                  )

                  return item.link ? (
                    <Link key={item.name} to={item.link}>{content}</Link>
                  ) : (
                    <div key={item.name}>{content}</div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Help Section */}
      <div className="card p-6 bg-gradient-to-br from-[var(--color-gold-dark)] to-[#2A1E0A] border-[var(--color-gold)]/20 animate-fade-in-up stagger-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-gold)]/20 flex items-center justify-center shrink-0">
            <Icon name="sparkles" size={28} className="text-[var(--color-gold)]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-[15px] font-semibold text-[var(--color-gold)]">Need help finding something?</div>
            <div className="text-[13px] text-[var(--color-gold)]/70 mt-0.5">Ask the Campus Assistant for quick answers</div>
          </div>
          <button className="btn bg-[var(--color-gold)] text-[var(--color-gold-dark)] border-none text-[13px] px-5 py-2.5 font-medium hover:bg-[var(--color-gold-light)]">
            Open Assistant
          </button>
        </div>
      </div>
    </div>
  )
}
