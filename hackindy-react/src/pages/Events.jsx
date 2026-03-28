import { useState } from 'react'
import Icon from '../components/Icons'

const allEvents = [
  { id: 1, title: 'Hackathon Kickoff Workshop', time: '10:00 AM', location: 'ET 108', category: 'engineering', date: 'Today', desc: 'Join us for the kickoff of our spring hackathon! Pizza and snacks provided. Learn about this year\'s theme and form teams.', attendees: 42 },
  { id: 2, title: 'Spring Career Fair', time: '12:00 PM', location: 'Campus Center Ballroom', category: 'career', date: 'Today', desc: 'Meet recruiters from top tech companies, startups, and organizations. Bring your resume!', attendees: 156 },
  { id: 3, title: 'Student Org Showcase', time: '3:00 PM', location: 'IUPUI Commons', category: 'social', date: 'Today', desc: 'Explore 50+ student organizations and find your community on campus.', attendees: 89 },
  { id: 4, title: 'AI/ML Research Seminar', time: '2:00 PM', location: 'SL 108', category: 'engineering', date: 'Tomorrow', desc: 'Prof. Chen presents latest research on transformer architectures and their applications.', attendees: 35 },
  { id: 5, title: 'Resume Workshop', time: '4:00 PM', location: 'CAV 129', category: 'career', date: 'Tomorrow', desc: 'Get your resume reviewed by career services and learn tips for standing out.', attendees: 28 },
  { id: 6, title: 'Board Game Night', time: '7:00 PM', location: 'Campus Center Game Room', category: 'social', date: 'Tomorrow', desc: 'Relax with fellow students and enjoy classic and modern board games.', attendees: 45 },
  { id: 7, title: 'Intro to Cloud Computing', time: '1:00 PM', location: 'ET 202', category: 'engineering', date: 'Mar 29', desc: 'Learn AWS fundamentals with hands-on labs. Bring your laptop!', attendees: 52 },
  { id: 8, title: 'Networking Mixer', time: '5:30 PM', location: 'Tower Dining', category: 'career', date: 'Mar 29', desc: 'Casual networking event with local industry professionals. Appetizers provided.', attendees: 67 },
]

const CATEGORIES = ['all', 'engineering', 'career', 'social']

const categoryConfig = {
  engineering: { 
    bg: 'bg-[var(--color-map-bg)]', 
    text: 'text-[var(--color-map-color)]', 
    dot: 'bg-[var(--color-map-color)]',
    icon: 'building'
  },
  career: { 
    bg: 'bg-[var(--color-dining-bg)]', 
    text: 'text-[var(--color-dining-color)]', 
    dot: 'bg-[var(--color-dining-color)]',
    icon: 'briefcase'
  },
  social: { 
    bg: 'bg-[var(--color-events-bg)]', 
    text: 'text-[var(--color-events-color)]', 
    dot: 'bg-[var(--color-events-color)]',
    icon: 'users'
  },
}

export default function Events() {
  const [filter, setFilter] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const mounted = true

  const filteredEvents = allEvents.filter(e => filter === 'all' || e.category === filter)

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = []
    acc[event.date].push(event)
    return acc
  }, {})

  return (
    <div className={`max-w-[1000px] mx-auto px-6 py-8 pb-24 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Campus Events</h1>
          <p className="text-[14px] text-[var(--color-txt-2)] mt-1">
            Discover what's happening on campus
          </p>
        </div>
        <button className="btn btn-primary text-[13px] px-4 py-2.5 w-fit">
          <Icon name="plus" size={16} />
          Submit Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1 animate-fade-in-up stagger-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`pill whitespace-nowrap capitalize ${filter === cat ? 'pill-active' : ''}`}
          >
            {cat === 'all' ? 'All Events' : cat}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Events List */}
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, events], groupIdx) => (
            <div key={date} className="animate-fade-in-up" style={{ animationDelay: `${groupIdx * 0.1}s` }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[12px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider">
                  {date}
                </span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="text-[11px] text-[var(--color-txt-3)]">
                  {events.length} event{events.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="space-y-2">
                {events.map((event, idx) => {
                  const config = categoryConfig[event.category]
                  const isSelected = selectedEvent?.id === event.id
                  
                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`card card-interactive p-4 transition-all duration-300
                        ${isSelected ? 'ring-2 ring-[var(--color-gold)] ring-offset-2 ring-offset-[var(--color-bg-1)]' : ''}`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-1 h-full min-h-[60px] rounded-full ${config.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[15px] font-medium text-[var(--color-txt-0)] group-hover:text-[var(--color-accent)]">
                                {event.title}
                              </div>
                              <div className="text-[12px] text-[var(--color-txt-2)] mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span className="flex items-center gap-1.5">
                                  <Icon name="clock" size={12} />
                                  {event.time}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Icon name="mapPin" size={12} />
                                  {event.location}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Icon name="users" size={12} />
                                  {event.attendees} attending
                                </span>
                              </div>
                            </div>
                            <span className={`badge shrink-0 ${config.bg} ${config.text}`}>
                              <Icon name={config.icon} size={10} />
                              {event.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="hidden lg:block">
          <div className="card p-5 sticky top-24">
            {selectedEvent ? (
              <div className="animate-fade-in">
                <span className={`badge mb-3 ${categoryConfig[selectedEvent.category].bg} ${categoryConfig[selectedEvent.category].text}`}>
                  <Icon name={categoryConfig[selectedEvent.category].icon} size={10} />
                  {selectedEvent.category}
                </span>
                
                <h2 className="text-[17px] font-semibold text-[var(--color-txt-0)] leading-snug">
                  {selectedEvent.title}
                </h2>
                
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="bg-[var(--color-stat)] rounded-xl p-3">
                    <div className="text-[10px] text-[var(--color-txt-3)] uppercase tracking-wider mb-1">Date</div>
                    <div className="text-[13px] font-medium text-[var(--color-txt-0)]">{selectedEvent.date}</div>
                  </div>
                  <div className="bg-[var(--color-stat)] rounded-xl p-3">
                    <div className="text-[10px] text-[var(--color-txt-3)] uppercase tracking-wider mb-1">Time</div>
                    <div className="text-[13px] font-medium text-[var(--color-txt-0)]">{selectedEvent.time}</div>
                  </div>
                  <div className="bg-[var(--color-stat)] rounded-xl p-3 col-span-2">
                    <div className="text-[10px] text-[var(--color-txt-3)] uppercase tracking-wider mb-1">Location</div>
                    <div className="text-[13px] font-medium text-[var(--color-txt-0)]">{selectedEvent.location}</div>
                  </div>
                </div>

                <p className="text-[13px] text-[var(--color-txt-1)] leading-relaxed mt-4">
                  {selectedEvent.desc}
                </p>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-7 h-7 rounded-full bg-[var(--color-bg-3)] border-2 border-[var(--color-surface)] flex items-center justify-center text-[9px] font-medium text-[var(--color-txt-2)]"
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-[var(--color-txt-2)]">
                    +{selectedEvent.attendees - 4} attending
                  </span>
                </div>

                <div className="flex gap-2 mt-5">
                  <button className="btn btn-primary text-[12px] px-4 py-2.5 flex-1">
                    <Icon name="calendar" size={14} />
                    Add to Calendar
                  </button>
                  <button className="btn btn-secondary text-[12px] px-4 py-2.5">
                    <Icon name="external" size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-stat)] flex items-center justify-center mx-auto mb-4">
                  <Icon name="calendar" size={24} className="text-[var(--color-txt-3)]" />
                </div>
                <p className="text-[14px] font-medium text-[var(--color-txt-1)]">No event selected</p>
                <p className="text-[12px] text-[var(--color-txt-3)] mt-1">Click an event to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
