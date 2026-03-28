import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icons'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const schedule = {
  Monday: [
    { code: 'CS 30200', name: 'Software Engineering', time: '1:30 – 2:45 PM', room: 'ET 215', prof: 'Prof. Nguyen', color: 'blue' },
    { code: 'MATH 261', name: 'Linear Algebra', time: '3:00 – 4:15 PM', room: 'SL 108', prof: 'Prof. Chen', color: 'purple' },
  ],
  Tuesday: [
    { code: 'CS 38100', name: 'Algorithms', time: '10:30 – 11:45 AM', room: 'ET 206', prof: 'Prof. Patel', color: 'green' },
    { code: 'ENG 302', name: 'Technical Writing', time: '2:00 – 3:15 PM', room: 'CAV 129', prof: 'Prof. Smith', color: 'orange' },
  ],
  Wednesday: [
    { code: 'CS 30200', name: 'Software Engineering', time: '1:30 – 2:45 PM', room: 'ET 215', prof: 'Prof. Nguyen', color: 'blue' },
    { code: 'MATH 261', name: 'Linear Algebra', time: '3:00 – 4:15 PM', room: 'SL 108', prof: 'Prof. Chen', color: 'purple' },
  ],
  Thursday: [
    { code: 'CS 38100', name: 'Algorithms', time: '10:30 – 11:45 AM', room: 'ET 206', prof: 'Prof. Patel', color: 'green' },
    { code: 'ENG 302', name: 'Technical Writing', time: '2:00 – 3:15 PM', room: 'CAV 129', prof: 'Prof. Smith', color: 'orange' },
  ],
  Friday: [
    { code: 'CS 30200', name: 'Software Engineering Lab', time: '10:00 – 11:50 AM', room: 'ET 202', prof: 'TA Sarah', color: 'blue' },
  ],
}

const colorConfig = {
  blue: { bg: 'bg-[var(--color-map-bg)]', border: 'border-[var(--color-map-color)]/20', text: 'text-[var(--color-map-color)]', accent: 'bg-[var(--color-map-color)]' },
  green: { bg: 'bg-[var(--color-dining-bg)]', border: 'border-[var(--color-dining-color)]/20', text: 'text-[var(--color-dining-color)]', accent: 'bg-[var(--color-dining-color)]' },
  purple: { bg: 'bg-[#F0E8F8]', border: 'border-[#7A5099]/20', text: 'text-[#7A5099]', accent: 'bg-[#7A5099]' },
  orange: { bg: 'bg-[var(--color-bus-bg)]', border: 'border-[var(--color-bus-title)]/20', text: 'text-[var(--color-bus-title)]', accent: 'bg-[var(--color-bus-title)]' },
}

export default function Schedule() {
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [selectedClass, setSelectedClass] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const classes = schedule[selectedDay] || []

  return (
    <div className={`max-w-[1000px] mx-auto px-6 py-8 pb-24 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Class Schedule</h1>
          <p className="text-[14px] text-[var(--color-txt-2)] mt-1">
            Spring 2026 · 15 credit hours
          </p>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[var(--color-txt-2)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 shadow-sm">
          <Icon name="calendar" size={14} className="text-[var(--color-txt-3)]" />
          Week of March 23
        </div>
      </div>

      {/* Day Tabs */}
      <div className="card p-1.5 mb-6 animate-fade-in-up stagger-1">
        <div className="flex gap-1">
          {DAYS.map(day => {
            const isSelected = selectedDay === day
            const hasClasses = schedule[day]?.length > 0
            return (
              <button
                key={day}
                onClick={() => { setSelectedDay(day); setSelectedClass(null) }}
                className={`flex-1 text-[13px] py-2.5 rounded-xl transition-all duration-300 relative
                  ${isSelected 
                    ? 'bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-light)] text-[var(--color-gold-dark)] font-semibold shadow-sm' 
                    : 'text-[var(--color-txt-1)] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-txt-0)]'
                  }`}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 3)}</span>
                {hasClasses && !isSelected && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Class List */}
        <div className="space-y-3 animate-fade-in-up stagger-2">
          {classes.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-stat)] flex items-center justify-center mx-auto mb-4">
                <Icon name="calendar" size={28} className="text-[var(--color-txt-3)]" />
              </div>
              <p className="text-[15px] font-medium text-[var(--color-txt-1)]">No classes scheduled</p>
              <p className="text-[13px] text-[var(--color-txt-3)] mt-1">Enjoy your day off!</p>
            </div>
          ) : (
            classes.map((cls, idx) => {
              const config = colorConfig[cls.color]
              const isSelected = selectedClass?.code === cls.code
              
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedClass(cls)}
                  className={`card card-interactive p-0 overflow-hidden transition-all duration-300
                    ${isSelected ? 'ring-2 ring-[var(--color-gold)] ring-offset-2 ring-offset-[var(--color-bg-1)]' : ''}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex">
                    <div className={`w-1.5 ${config.accent}`} />
                    <div className={`flex-1 p-4 ${config.bg} ${config.border} border-l-0 border`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className={`text-[11px] font-semibold ${config.text} tracking-wide`}>
                            {cls.code}
                          </div>
                          <div className="text-[16px] font-semibold text-[var(--color-txt-0)] mt-1">
                            {cls.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--color-txt-2)] mt-2">
                            <span className="flex items-center gap-1.5">
                              <Icon name="clock" size={12} />
                              {cls.time}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Icon name="mapPin" size={12} />
                              {cls.room}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Icon name="user" size={12} />
                              {cls.prof}
                            </span>
                          </div>
                        </div>
                        <Icon name="arrowUpRight" size={16} className={`${config.text} opacity-50`} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="hidden lg:block">
          <div className="card p-5 sticky top-24">
            {selectedClass ? (
              <div className="animate-fade-in">
                <div className={`text-[11px] font-semibold ${colorConfig[selectedClass.color].text} tracking-wide`}>
                  {selectedClass.code}
                </div>
                <h2 className="text-[17px] font-semibold text-[var(--color-txt-0)] mt-1">
                  {selectedClass.name}
                </h2>
                
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="bg-[var(--color-stat)] rounded-xl p-3">
                    <div className="text-[10px] text-[var(--color-txt-3)] uppercase tracking-wider mb-1">Time</div>
                    <div className="text-[13px] font-medium text-[var(--color-txt-0)]">{selectedClass.time}</div>
                  </div>
                  <div className="bg-[var(--color-stat)] rounded-xl p-3">
                    <div className="text-[10px] text-[var(--color-txt-3)] uppercase tracking-wider mb-1">Room</div>
                    <div className="text-[13px] font-medium text-[var(--color-txt-0)]">{selectedClass.room}</div>
                  </div>
                  <div className="bg-[var(--color-stat)] rounded-xl p-3 col-span-2">
                    <div className="text-[10px] text-[var(--color-txt-3)] uppercase tracking-wider mb-1">Instructor</div>
                    <div className="text-[13px] font-medium text-[var(--color-txt-0)]">{selectedClass.prof}</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <Link 
                    to="/map" 
                    className="btn btn-primary text-[12px] px-4 py-2.5 flex-1"
                  >
                    <Icon name="mapPin" size={14} />
                    Find Room
                  </Link>
                  <button className="btn btn-secondary text-[12px] px-4 py-2.5 flex-1">
                    <Icon name="clock" size={14} />
                    Set Reminder
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-stat)] flex items-center justify-center mx-auto mb-4">
                  <Icon name="calendar" size={24} className="text-[var(--color-txt-3)]" />
                </div>
                <p className="text-[14px] font-medium text-[var(--color-txt-1)]">No class selected</p>
                <p className="text-[12px] text-[var(--color-txt-3)] mt-1">Click a class to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
