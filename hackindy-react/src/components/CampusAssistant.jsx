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

const quickQuestions = [
  'When is my next class?',
  'What\'s for lunch?',
  'When is the next bus?',
]

export default function CampusAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'assistant', content: 'Hey Jordan! 👋 Ask me anything — schedule, dining, buses, or buildings.' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesRef = useRef(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (text = input) => {
    if (!text.trim()) return

    const userMsg = text.trim()
    setMessages(prev => [...prev, { type: 'user', content: userMsg }])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const low = userMsg.toLowerCase()
      let response = 'I can help with schedule, dining, buses, buildings, and events. Try asking about your next class!'
      
      for (const [key, value] of Object.entries(responses)) {
        if (low.includes(key)) {
          response = value
          break
        }
      }

      setIsTyping(false)
      setMessages(prev => [...prev, { type: 'assistant', content: response }])
    }, 800)
  }

  const renderMessage = (msg, idx) => {
    const isUser = msg.type === 'user'
    const content = msg.content

    return (
      <div
        key={idx}
        className={`flex gap-2.5 animate-fade-in-up ${isUser ? 'flex-row-reverse' : ''}`}
        style={{ animationDelay: `${idx * 0.05}s` }}
      >
        {!isUser && (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-muted)] flex items-center justify-center shrink-0">
            <Icon name="sparkles" size={14} className="text-[var(--color-gold-dark)]" />
          </div>
        )}
        <div
          className={`text-[13px] px-4 py-2.5 rounded-2xl max-w-[85%] leading-relaxed
            ${isUser 
              ? 'bg-gradient-to-br from-[var(--color-gold-dark)] to-[#2A1E0A] text-[var(--color-gold)] rounded-br-md' 
              : 'bg-[var(--color-stat)] text-[var(--color-txt-0)] rounded-bl-md'
            }`}
        >
          {typeof content === 'object' && content.link ? (
            <Link 
              to={content.link} 
              className="text-[var(--color-accent)] hover:underline flex items-center gap-1" 
              onClick={() => setOpen(false)}
            >
              {content.text}
              <Icon name="arrowUpRight" size={12} />
            </Link>
          ) : (
            content
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
      />

      {/* Chat Window */}
      <div className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] transition-all duration-500 ease-out ${open ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
        <div className="card p-0 overflow-hidden shadow-xl border-[var(--color-border-2)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--color-gold-dark)] to-[#2A1E0A] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-gold)]/20 flex items-center justify-center">
                <Icon name="sparkles" size={20} className="text-[var(--color-gold)]" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-[var(--color-gold)]">Campus Assistant</div>
                <div className="text-[11px] text-[var(--color-gold)]/60 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                  Always here to help
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg bg-[var(--color-gold)]/10 flex items-center justify-center text-[var(--color-gold)]/70 hover:text-[var(--color-gold)] hover:bg-[var(--color-gold)]/20 transition-colors"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messagesRef}
            className="min-h-[200px] max-h-[320px] overflow-y-auto p-4 space-y-3 bg-[var(--color-surface)]"
          >
            {messages.map(renderMessage)}
            
            {isTyping && (
              <div className="flex gap-2.5 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-muted)] flex items-center justify-center shrink-0">
                  <Icon name="sparkles" size={14} className="text-[var(--color-gold-dark)]" />
                </div>
                <div className="bg-[var(--color-stat)] text-[var(--color-txt-0)] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-txt-3)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[var(--color-txt-3)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[var(--color-txt-3)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2 bg-[var(--color-surface)]">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-[var(--color-border-2)] text-[var(--color-txt-1)] hover:bg-[var(--color-stat)] hover:text-[var(--color-txt-0)] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg-1)]">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about campus..."
                className="input flex-1 text-[13px] px-4 py-2.5"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="btn btn-primary px-4 py-2.5 disabled:opacity-50"
              >
                <Icon name="send" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group
          ${open 
            ? 'bg-[var(--color-surface)] border border-[var(--color-border-2)] rotate-90' 
            : 'bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-muted)] hover:shadow-xl hover:scale-110'
          }`}
        title="Campus Assistant"
      >
        {open ? (
          <Icon name="close" size={22} className="text-[var(--color-txt-1)]" />
        ) : (
          <>
            <Icon name="sparkles" size={24} className="text-[var(--color-gold-dark)]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--color-success)] border-2 border-[var(--color-bg-1)] animate-pulse" />
          </>
        )}
      </button>
    </>
  )
}
