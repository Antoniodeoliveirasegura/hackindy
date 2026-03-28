import { Link } from 'react-router-dom'
import Icon from '../components/Icons'

const services = [
  {
    category: 'Academic',
    items: [
      { name: 'University Library', desc: '400,000+ volumes, study rooms, 24/7 during finals', icon: 'library', link: '/map' },
      { name: 'Academic Success Center', desc: 'Free tutoring, writing help, academic coaching', icon: 'graduation', link: '/map' },
      { name: 'Career Services', desc: 'Resume reviews, job fairs, career counseling', icon: 'briefcase', link: null },
      { name: 'IT Help Desk', desc: 'Tech support, WiFi help, software access', icon: 'help', link: null },
    ]
  },
  {
    category: 'Campus Life',
    items: [
      { name: 'Campus Board', desc: 'Ask questions and connect with students', icon: 'message', link: '/board' },
      { name: 'Events Calendar', desc: 'Discover what\'s happening on campus', icon: 'calendar', link: '/events' },
      { name: 'Student Organizations', desc: '200+ clubs and organizations', icon: 'users', link: null },
      { name: 'Recreation Center', desc: 'Gym, pool, fitness classes', icon: 'heart', link: null },
    ]
  },
  {
    category: 'Resources',
    items: [
      { name: 'Campus Map', desc: 'Find buildings, rooms, and directions', icon: 'mapPin', link: '/map' },
      { name: 'Dining Services', desc: 'Menus, hours, and locations', icon: 'dining', link: '/dining' },
      { name: 'Transit & Parking', desc: 'Bus schedules and parking info', icon: 'bus', link: '/transit' },
      { name: 'Printing Services', desc: '25 free pages/day at the library', icon: 'printer', link: null },
    ]
  },
  {
    category: 'Support',
    items: [
      { name: 'Health Services', desc: 'Campus clinic and counseling', icon: 'health', link: null },
      { name: 'Financial Aid', desc: 'Scholarships, grants, and loans', icon: 'briefcase', link: null },
      { name: 'Housing', desc: 'Residence halls and off-campus resources', icon: 'building', link: null },
      { name: 'Campus Safety', desc: '24/7 security and safety resources', icon: 'info', link: null },
    ]
  },
]

const quickLinks = [
  { name: 'WiFi Setup', desc: 'Connect to Purdue-WiFi', icon: 'wifi' },
  { name: 'Class Schedule', desc: 'View your classes', icon: 'schedule', link: '/schedule' },
  { name: 'Campus Map', desc: 'Find any building', icon: 'mapPin', link: '/map' },
  { name: 'Bus Tracker', desc: 'Live shuttle times', icon: 'bus', link: '/transit' },
]

export default function Services() {
  return (
    <div className="max-w-[900px] mx-auto px-8 py-6 pb-20">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-[var(--color-txt-0)]">Student Services</h1>
        <p className="text-[13px] text-[var(--color-txt-1)] mt-1">
          Everything you need in one place
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {quickLinks.map(link => (
          <Link
            key={link.name}
            to={link.link || '#'}
            className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-border-2)] hover:-translate-y-0.5 transition-all text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-stat)] flex items-center justify-center mx-auto mb-2">
              <Icon name={link.icon} size={20} className="text-[var(--color-txt-1)]" />
            </div>
            <div className="text-[13px] font-medium text-[var(--color-txt-0)]">{link.name}</div>
            <div className="text-[11px] text-[var(--color-txt-2)] mt-0.5">{link.desc}</div>
          </Link>
        ))}
      </div>

      {/* Service Categories */}
      <div className="grid grid-cols-2 gap-4">
        {services.map(category => (
          <div 
            key={category.category}
            className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-4"
          >
            <div className="text-[10px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-3">
              {category.category}
            </div>
            <div className="flex flex-col gap-2">
              {category.items.map(item => {
                const content = (
                  <div className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-[var(--color-stat)] transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-stat)] flex items-center justify-center shrink-0">
                      <Icon name={item.icon} size={16} className="text-[var(--color-txt-1)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[var(--color-txt-0)] flex items-center gap-1">
                        {item.name}
                        {item.link && <Icon name="arrowUpRight" size={11} className="text-[var(--color-txt-2)]" />}
                      </div>
                      <div className="text-[11px] text-[var(--color-txt-2)] mt-0.5">{item.desc}</div>
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
        ))}
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-[var(--color-stat)] rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gold-dark flex items-center justify-center">
            <Icon name="sparkles" size={24} className="text-gold" />
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--color-txt-0)]">Need help finding something?</div>
            <div className="text-xs text-[var(--color-txt-1)] mt-0.5">Ask the Campus Assistant for quick answers</div>
          </div>
        </div>
        <button className="bg-gold-dark text-gold rounded-lg px-4 py-2 text-xs">
          Open Assistant
        </button>
      </div>
    </div>
  )
}
