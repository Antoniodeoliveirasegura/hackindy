import { useState } from 'react'
import Icon from '../components/Icons'

const allEvents = [
  { id: 1, title: 'Hackathon Kickoff Workshop', time: '10:00 AM', location: 'ET 108', category: 'engineering', date: 'Today', desc: 'Join us for the kickoff of our spring hackathon! Pizza and snacks provided. Learn about this year\'s theme and form teams.' },
  { id: 2, title: 'Spring Career Fair', time: '12:00 PM', location: 'Campus Center Ballroom', category: 'career', date: 'Today', desc: 'Meet recruiters from top tech companies, startups, and organizations. Bring your resume!' },
  { id: 3, title: 'Student Org Showcase', time: '3:00 PM', location: 'IUPUI Commons', category: 'social', date: 'Today', desc: 'Explore 50+ student organizations and find your community on campus.' },
  { id: 4, title: 'AI/ML Research Seminar', time: '2:00 PM', location: 'SL 108', category: 'engineering', date: 'Tomorrow', desc: 'Prof. Chen presents latest research on transformer architectures and their applications.' },
  { id: 5, title: 'Resume Workshop', time: '4:00 PM', location: 'CAV 129', category: 'career', date: 'Tomorrow', desc: 'Get your resume reviewed by career services and learn tips for standing out.' },
  { id: 6, title: 'Board Game Night', time: '7:00 PM', location: 'Campus Center Game Room', category: 'social', date: 'Tomorrow', desc: 'Relax with fellow students and enjoy classic and modern board games.' },
  { id: 7, title: 'Intro to Cloud Computing', time: '1:00 PM', location: 'ET 202', category: 'engineering', date: 'Mar 29', desc: 'Learn AWS fundamentals with hands-on labs. Bring your laptop!' },
  { id: 8, title: 'Networking Mixer', time: '5:30 PM', location: 'Tower Dining', category: 'career', date: 'Mar 29', desc: 'Casual networking event with local industry professionals. Appetizers provided.' },
]

const CATEGORIES = ['all', 'engineering', 'career', 'social']

const categoryColors = {
  engineering: { bg: 'bg-[var(--color-map-bg)]', text: 'text-[var(--color-map-color)]', dot: 'bg-[#2062a4]' },
  career: { bg: 'bg-[var(--color-dining-bg)]', text: 'text-[var(--color-dining-color)]', dot: 'bg-[#3d7e18]' },
  social: { bg: 'bg-[var(--color-events-bg)]', text: 'text-[var(--color-events-color)]', dot: 'bg-[#a33060]' },
}

export default function Events() {
  const [filter, setFilter] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)

  const filteredEvents = allEvents.filter(e => filter === 'all' || e.category === filter)

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = []
    acc[event.date].push(event)
    return acc
  }, {})

  return (
    <div className="max-w-[900px] mx-auto px-8 py-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-medium text-[var(--color-txt-0)]">Campus Events</h1>
          <p className="text-[13px] text-[var(--color-txt-1)] mt-1">
            Discover what's happening on campus
          </p>
        </div>
        <button className="bg-gold-dark text-gold rounded-lg px-4 py-2 text-[13px] flex items-center gap-1.5">
          <Icon name="plus" size={14} />
          Submit event
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-5">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-4 py-1.5 rounded-full border transition-colors capitalize
              ${filter === cat 
                ? 'bg-gold-dark text-gold border-gold-dark' 
                : 'bg-[var(--color-bg-2)] text-[var(--color-txt-1)] border-[var(--color-border-2)] hover:bg-[var(--color-stat)]'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Events List */}
        <div>
          {Object.entries(groupedEvents).map(([date, events]) => (
            <div key={date} className="mb-5">
              <div className="text-[11px] font-semibold text-[var(--color-txt-2)] uppercase tracking-wide mb-2">
                {date}
              </div>
              <div className="flex flex-col gap-2">
                {events.map(event => {
                  const colors = categoryColors[event.category]
                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`bg-[var(--color-bg-0)] border rounded-xl p-4 cursor-pointer transition-all
                        ${selectedEvent?.id === event.id 
                          ? 'border-[var(--color-accent)]' 
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-2)]'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-1.5 h-1.5 rounded-sm mt-2 ${colors.dot}`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[var(--color-txt-0)]">
                            {event.title}
                          </div>
                          <div className="text-[11px] text-[var(--color-txt-2)] mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Icon name="clock" size={11} />
                              {event.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="mapPin" size={11} />
                              {event.location}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}>
                          {event.category}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-4 h-fit sticky top-20">
          {selectedEvent ? (
            <>
              <div className={`text-[10px] px-2.5 py-1 rounded-full font-medium capitalize inline-block mb-2
                ${categoryColors[selectedEvent.category].bg} ${categoryColors[selectedEvent.category].text}`}>
                {selectedEvent.category}
              </div>
              <div className="text-[15px] font-medium text-[var(--color-txt-0)]">
                {selectedEvent.title}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-[var(--color-stat)] rounded-lg p-2.5">
                  <div className="text-[9px] text-[var(--color-txt-2)] uppercase tracking-wide mb-0.5">Date</div>
                  <div className="text-xs font-medium text-[var(--color-txt-0)]">{selectedEvent.date}</div>
                </div>
                <div className="bg-[var(--color-stat)] rounded-lg p-2.5">
                  <div className="text-[9px] text-[var(--color-txt-2)] uppercase tracking-wide mb-0.5">Time</div>
                  <div className="text-xs font-medium text-[var(--color-txt-0)]">{selectedEvent.time}</div>
                </div>
                <div className="bg-[var(--color-stat)] rounded-lg p-2.5 col-span-2">
                  <div className="text-[9px] text-[var(--color-txt-2)] uppercase tracking-wide mb-0.5">Location</div>
                  <div className="text-xs font-medium text-[var(--color-txt-0)]">{selectedEvent.location}</div>
                </div>
              </div>

              <p className="text-xs text-[var(--color-txt-1)] leading-relaxed mt-4">
                {selectedEvent.desc}
              </p>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-gold-dark text-gold rounded-lg px-3 py-2 text-xs flex items-center justify-center gap-1.5">
                  <Icon name="calendar" size={12} />
                  Add to calendar
                </button>
                <button className="flex-1 bg-[var(--color-bg-2)] text-[var(--color-txt-0)] border border-[var(--color-border-2)] rounded-lg px-3 py-2 text-xs hover:bg-[var(--color-stat)]">
                  Share
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Icon name="calendar" size={28} className="text-[var(--color-txt-2)] mx-auto mb-2" />
              <p className="text-[13px] text-[var(--color-txt-2)]">Select an event to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
