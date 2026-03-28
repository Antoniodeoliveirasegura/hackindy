import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icons'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const schedule = {
  Monday: [
    { code: 'CS 30200', name: 'Software Engineering', time: '1:30 – 2:45 PM', room: 'ET 215', prof: 'Prof. Nguyen' },
    { code: 'MATH 261', name: 'Linear Algebra', time: '3:00 – 4:15 PM', room: 'SL 108', prof: 'Prof. Chen' },
  ],
  Tuesday: [
    { code: 'CS 38100', name: 'Algorithms', time: '10:30 – 11:45 AM', room: 'ET 206', prof: 'Prof. Patel' },
    { code: 'ENG 302', name: 'Technical Writing', time: '2:00 – 3:15 PM', room: 'CAV 129', prof: 'Prof. Smith' },
  ],
  Wednesday: [
    { code: 'CS 30200', name: 'Software Engineering', time: '1:30 – 2:45 PM', room: 'ET 215', prof: 'Prof. Nguyen' },
    { code: 'MATH 261', name: 'Linear Algebra', time: '3:00 – 4:15 PM', room: 'SL 108', prof: 'Prof. Chen' },
  ],
  Thursday: [
    { code: 'CS 38100', name: 'Algorithms', time: '10:30 – 11:45 AM', room: 'ET 206', prof: 'Prof. Patel' },
    { code: 'ENG 302', name: 'Technical Writing', time: '2:00 – 3:15 PM', room: 'CAV 129', prof: 'Prof. Smith' },
  ],
  Friday: [
    { code: 'CS 30200', name: 'Software Engineering Lab', time: '10:00 – 11:50 AM', room: 'ET 202', prof: 'TA Sarah' },
  ],
}

export default function Schedule() {
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [selectedClass, setSelectedClass] = useState(null)

  const classes = schedule[selectedDay] || []

  return (
    <div className="max-w-[900px] mx-auto px-8 py-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-medium text-[var(--color-txt-0)]">Class Schedule</h1>
          <p className="text-[13px] text-[var(--color-txt-1)] mt-1">
            Spring 2026 · 15 credit hours
          </p>
        </div>
        <div className="text-xs text-[var(--color-txt-1)] bg-[var(--color-bg-0)] border border-[var(--color-border-2)] rounded-lg px-3.5 py-1.5 flex items-center gap-1.5">
          <Icon name="calendar" size={13} className="text-[var(--color-txt-2)]" />
          Week of March 23
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-1 mb-5 bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-1">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => { setSelectedDay(day); setSelectedClass(null) }}
            className={`flex-1 text-[13px] py-2 rounded-lg transition-colors
              ${selectedDay === day 
                ? 'bg-gold-dark text-gold font-medium' 
                : 'text-[var(--color-txt-1)] hover:bg-[var(--color-bg-2)]'
              }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Class List */}
        <div className="flex flex-col gap-2.5">
          {classes.length === 0 ? (
            <div className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-8 text-center">
              <Icon name="calendar" size={32} className="text-[var(--color-txt-2)] mx-auto mb-2" />
              <p className="text-[var(--color-txt-1)]">No classes scheduled</p>
            </div>
          ) : (
            classes.map((cls, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedClass(cls)}
                className={`bg-[var(--color-bg-0)] border rounded-xl p-4 cursor-pointer transition-all
                  ${selectedClass?.code === cls.code 
                    ? 'border-[var(--color-cls-sub)] bg-[var(--color-cls-bg)]' 
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-2)]'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-semibold text-[var(--color-cls-sub)] tracking-wide">
                      {cls.code}
                    </div>
                    <div className="text-sm font-medium text-[var(--color-cls-title)] mt-1">
                      {cls.name}
                    </div>
                    <div className="text-[11px] text-[var(--color-txt-1)] mt-2 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Icon name="clock" size={11} />
                        {cls.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="mapPin" size={11} />
                        {cls.room}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-[var(--color-txt-2)]">
                    {cls.prof}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="bg-[var(--color-bg-0)] border border-[var(--color-border)] rounded-xl p-4 h-fit sticky top-20">
          {selectedClass ? (
            <>
              <div className="text-[10px] font-semibold text-[var(--color-cls-sub)] tracking-wide">
                {selectedClass.code}
              </div>
              <div className="text-[15px] font-medium text-[var(--color-txt-0)] mt-1">
                {selectedClass.name}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-[var(--color-stat)] rounded-lg p-2.5">
                  <div className="text-[9px] text-[var(--color-txt-2)] uppercase tracking-wide mb-0.5">Time</div>
                  <div className="text-xs font-medium text-[var(--color-txt-0)]">{selectedClass.time}</div>
                </div>
                <div className="bg-[var(--color-stat)] rounded-lg p-2.5">
                  <div className="text-[9px] text-[var(--color-txt-2)] uppercase tracking-wide mb-0.5">Room</div>
                  <div className="text-xs font-medium text-[var(--color-txt-0)]">{selectedClass.room}</div>
                </div>
                <div className="bg-[var(--color-stat)] rounded-lg p-2.5 col-span-2">
                  <div className="text-[9px] text-[var(--color-txt-2)] uppercase tracking-wide mb-0.5">Instructor</div>
                  <div className="text-xs font-medium text-[var(--color-txt-0)]">{selectedClass.prof}</div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Link 
                  to="/map" 
                  className="flex-1 bg-gold-dark text-gold rounded-lg px-3 py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <Icon name="mapPin" size={12} />
                  Find room
                </Link>
                <button className="flex-1 bg-[var(--color-bg-2)] text-[var(--color-txt-0)] border border-[var(--color-border-2)] rounded-lg px-3 py-2 text-xs hover:bg-[var(--color-stat)]">
                  Add reminder
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Icon name="calendar" size={28} className="text-[var(--color-txt-2)] mx-auto mb-2" />
              <p className="text-[13px] text-[var(--color-txt-2)]">Select a class to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
