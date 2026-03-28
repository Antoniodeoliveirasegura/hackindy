import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icons'

const responses = {
  'next class': 'Your next class is CS 30200 – Software Engineering at 1:30 PM in ET 215 with Prof. Nguyen.',
  'schedule': { text: 'View your full schedule →', link: '/schedule' },
  'bus': 'Next bus (Route 1) departs in 8 min at 12:38 PM. Union → ET Building → Campus Center.',
  'transit': { text: 'See live bus countdowns →', link: '/transit' },
  'dining': 'Tower Dining is open for lunch until 2:00 PM. Today: Grilled Chicken, Pasta Marinara, Black Bean Burger, and more.',
  'menu': { text: 'See the full dining menu →', link: '/dining' },
  'hours': 'Dining hours: Breakfast 7–10:30 AM · Lunch 11 AM–2 PM · Dinner 4:30–8 PM.',
  'et building': 'ET Building is at 723 W. Michigan St — home to CS, ECE, and Engineering Technology labs.',
  'map': { text: 'Explore the campus map →', link: '/map' },
  'events': '3 events today: Hackathon Workshop (10am, ET 108), Career Fair (12pm, Ballroom), Student Org Showcase (3pm).',
  'career fair': 'Spring Career Fair is today at 12:00 PM in the Campus Center Ballroom. Open to all majors.',
  'hackathon': 'Hackathon Kickoff Workshop today at 10:00 AM in ET 108. Pizza and snacks provided!',
  'board': { text: 'Visit the Campus Board →', link: '/board' },
  'services': { text: 'Browse student services →', link: '/services' },
  'library': 'University Library — 400,000+ volumes, private study rooms, 24/7 during finals.',
  'print': 'The Library gives you 25 free pages/day with your student ID.',
  'tutor': 'The Academic Success Center offers free tutoring at 620 Union Dr.',
}

export default function CampusAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'assistant', content: 'Hey Jordan! Ask me anything — schedule, dining, buses, or buildings.' }
  ])
  const [input, setInput] = useState('')
  const messagesRef = useRef(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMsg = input.trim()
    setMessages(prev => [...prev, { type: 'user', content: userMsg }])
    setInput('')

    setTimeout(() => {
      const low = userMsg.toLowerCase()
      let response = 'I can help with schedule, dining, buses, buildings, and events. Try asking about your next class!'
      
      for (const [key, value] of Object.entries(responses)) {
        if (low.includes(key)) {
          response = value
          break
        }
      }

      setMessages(prev => [...prev, { type: 'assistant', content: response }])
    }, 500)
  }

  const renderMessage = (msg, idx) => {
    const isUser = msg.type === 'user'
    const content = msg.content

    return (
      <div
        key={idx}
        className={`text-xs px-3 py-2 rounded-lg max-w-[90%] leading-relaxed
          ${isUser 
            ? 'bg-gold-dark text-gold self-end rounded-br-sm' 
            : 'bg-[var(--color-stat)] text-[var(--color-txt-0)] self-start rounded-bl-sm'
          }`}
      >
        {typeof content === 'object' && content.link ? (
          <Link to={content.link} className="underline" onClick={() => setOpen(false)}>
            {content.text}
          </Link>
        ) : (
          content
        )}
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5">
      {open && (
        <div className="bg-[var(--color-bg-0)] border border-[var(--color-border-2)] rounded-xl p-4 w-80 shadow-xl animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[13px] font-semibold text-[var(--color-txt-0)] flex items-center gap-1.5">
              <Icon name="sparkles" size={14} className="text-gold" />
              Campus Assistant
            </span>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-[var(--color-bg-2)] text-[var(--color-txt-2)]"
            >
              <Icon name="close" size={14} />
            </button>
          </div>

          <div
            ref={messagesRef}
            className="min-h-[80px] max-h-[220px] overflow-y-auto flex flex-col gap-2 mb-2.5"
          >
            {messages.map(renderMessage)}
          </div>

          <div className="flex gap-1.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about campus..."
              className="flex-1 text-xs border border-[var(--color-border-2)] rounded-lg px-3 py-2 bg-[var(--color-bg-2)] text-[var(--color-txt-0)] outline-none focus:border-gold transition-colors"
            />
            <button
              onClick={handleSend}
              className="bg-gold-dark text-gold rounded-lg px-3.5 py-2 hover:bg-[#5c3a00] transition-colors"
            >
              <Icon name="send" size={14} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-dark to-[#5c3a00] text-gold flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        title="Campus Assistant"
      >
        <Icon name="sparkles" size={22} />
      </button>
    </div>
  )
}
