import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authRequest } from '../lib/authApi'
import Icon from '../components/Icons'

const categoryConfig = {
  exam: { 
    label: 'Exams',
    bg: 'bg-red-50 dark:bg-red-900/20', 
    text: 'text-red-700 dark:text-red-400', 
    border: 'border-red-200 dark:border-red-800',
    icon: 'alert'
  },
  assignment: { 
    label: 'Assignments',
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    text: 'text-blue-700 dark:text-blue-400', 
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'edit'
  },
  lab: { 
    label: 'Labs',
    bg: 'bg-green-50 dark:bg-green-900/20', 
    text: 'text-green-700 dark:text-green-400', 
    border: 'border-green-200 dark:border-green-800',
    icon: 'beaker'
  },
  project: { 
    label: 'Projects',
    bg: 'bg-purple-50 dark:bg-purple-900/20', 
    text: 'text-purple-700 dark:text-purple-400', 
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'folder'
  },
  quiz: { 
    label: 'Quizzes',
    bg: 'bg-orange-50 dark:bg-orange-900/20', 
    text: 'text-orange-700 dark:text-orange-400', 
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'document'
  },
  campus_event: { 
    label: 'Campus Events',
    bg: 'bg-pink-50 dark:bg-pink-900/20', 
    text: 'text-pink-700 dark:text-pink-400', 
    border: 'border-pink-200 dark:border-pink-800',
    icon: 'calendar'
  },
  resource: { 
    label: 'Resources',
    bg: 'bg-gray-50 dark:bg-gray-800/50', 
    text: 'text-gray-600 dark:text-gray-400', 
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'document'
  },
  deadline: { 
    label: 'Deadlines',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
    text: 'text-yellow-700 dark:text-yellow-400', 
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'clock'
  },
  event: { 
    label: 'Other',
    bg: 'bg-[var(--color-bg-2)]', 
    text: 'text-[var(--color-txt-1)]', 
    border: 'border-[var(--color-border)]',
    icon: 'calendar'
  },
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const isToday = date.toDateString() === now.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()
  
  if (isToday) return 'Today'
  if (isTomorrow) return 'Tomorrow'
  
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function getRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Past'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays <= 7) return `${diffDays} days`
  if (diffDays <= 14) return '1-2 weeks'
  return `${Math.ceil(diffDays / 7)} weeks`
}

function isPastDue(dateString) {
  return new Date(dateString) < new Date()
}

// Categories that belong on the Events page, not Tasks
const eventCategories = ['campus_event', 'event', 'deadline']

export default function Assignments() {
  const { onboarding } = useAuth()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPast, setShowPast] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [calRes, catRes] = await Promise.all([
        authRequest('/api/me/calendar?limit=500'),
        authRequest('/api/me/calendar/categories'),
      ])
      setItems(calRes.items || [])
      setCategories(catRes.categories || [])
    } catch (error) {
      console.error('Failed to load assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = useMemo(() => {
    // Filter out class and event-type categories (those go to Events page)
    let filtered = items.filter(item => 
      item.category !== 'class' && !eventCategories.includes(item.category)
    )
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item => selectedCategories.includes(item.category))
    }
    
    if (!showPast) {
      filtered = filtered.filter(item => !isPastDue(item.startTime))
    }
    
    return filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  }, [items, selectedCategories, showPast])

  const groupedItems = useMemo(() => {
    const groups = {}
    for (const item of filteredItems) {
      const dateKey = formatDate(item.startTime)
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(item)
    }
    return groups
  }, [filteredItems])

  const toggleCategory = (catId) => {
    setSelectedCategories(prev => 
      prev.includes(catId) 
        ? prev.filter(c => c !== catId)
        : [...prev, catId]
    )
  }

  const hasNoSources = onboarding?.linkedSourceCount === 0

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8 pb-24 transition-opacity duration-500 opacity-100">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Assignments & Events</h1>
          <p className="text-[14px] text-[var(--color-txt-2)] mt-1">
            {filteredItems.length} upcoming items from Brightspace
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] text-[var(--color-txt-2)] cursor-pointer">
            <input 
              type="checkbox" 
              checked={showPast} 
              onChange={(e) => setShowPast(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-border-2)]"
            />
            Show past items
          </label>
          <button onClick={loadData} className="btn btn-secondary text-[13px] px-4 py-2">
            <Icon name="refresh" size={14} />
            Refresh
          </button>
        </div>
      </div>

      {hasNoSources && (
        <div className="card p-5 mb-6 border-[var(--color-gold)]/30 bg-[var(--color-gold)]/8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-[16px] font-semibold text-[var(--color-txt-0)]">
                Connect your Brightspace calendar
              </div>
              <p className="text-[13px] text-[var(--color-txt-2)] mt-1 max-w-[640px]">
                Import your assignments, exams, and due dates from Brightspace to see them here.
              </p>
            </div>
            <Link to="/setup" className="btn btn-primary text-[13px] px-5 py-2.5 w-fit">
              <Icon name="calendar" size={15} />
              Connect Brightspace
            </Link>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 animate-fade-in-up stagger-1">
          <button
            onClick={() => setSelectedCategories([])}
            className={`pill whitespace-nowrap ${selectedCategories.length === 0 ? 'pill-active' : ''}`}
          >
            All ({items.filter(i => i.category !== 'class' && !eventCategories.includes(i.category)).length})
          </button>
          {categories.filter(c => c.id !== 'class' && !eventCategories.includes(c.id)).map(cat => {
            const isActive = selectedCategories.includes(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`pill whitespace-nowrap ${isActive ? 'pill-active' : ''}`}
              >
                {cat.label} ({cat.count})
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-[var(--color-txt-2)]">
          Loading assignments...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-8 text-center">
          <Icon name="calendar" size={32} className="mx-auto text-[var(--color-txt-3)] mb-3" />
          <div className="text-[var(--color-txt-1)] font-medium">No items found</div>
          <p className="text-[13px] text-[var(--color-txt-2)] mt-1">
            {hasNoSources 
              ? 'Connect your Brightspace calendar to see assignments and events.'
              : selectedCategories.length > 0 
                ? 'Try selecting different categories or showing past items.'
                : 'No upcoming assignments or events.'}
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-6 animate-fade-in-up stagger-2">
            {Object.entries(groupedItems).map(([date, dateItems]) => (
              <div key={date}>
                <div className="text-[12px] font-semibold text-[var(--color-txt-3)] uppercase tracking-wider mb-3">
                  {date}
                </div>
                <div className="space-y-2">
                  {dateItems.map(item => {
                    const config = categoryConfig[item.category] || categoryConfig.event
                    const isSelected = selectedItem?.id === item.id
                    const past = isPastDue(item.startTime)
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`w-full text-left card-interactive p-4 transition-all ${
                          isSelected ? 'ring-2 ring-[var(--color-gold)]' : ''
                        } ${past ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${config.text.replace('text-', 'bg-')}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium text-[var(--color-txt-0)] text-[14px] line-clamp-2">
                                {item.title}
                              </div>
                              <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                                {config.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-[12px] text-[var(--color-txt-2)]">
                              <span className="flex items-center gap-1">
                                <Icon name="clock" size={12} />
                                {formatTime(item.startTime)}
                              </span>
                              {item.location && (
                                <span className="flex items-center gap-1 truncate">
                                  <Icon name="mapPin" size={12} />
                                  {item.location.split(' (')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-24 h-fit animate-fade-in-up stagger-3">
            {selectedItem ? (
              <div className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full ${
                      (categoryConfig[selectedItem.category] || categoryConfig.event).bg
                    } ${(categoryConfig[selectedItem.category] || categoryConfig.event).text}`}>
                      {(categoryConfig[selectedItem.category] || categoryConfig.event).label}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="text-[var(--color-txt-3)] hover:text-[var(--color-txt-1)]"
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>
                
                <h3 className="text-[18px] font-semibold text-[var(--color-txt-0)] mb-4">
                  {selectedItem.title}
                </h3>
                
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-[13px]">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-2)] flex items-center justify-center">
                      <Icon name="calendar" size={15} className="text-[var(--color-txt-2)]" />
                    </div>
                    <div>
                      <div className="text-[var(--color-txt-1)]">{formatDate(selectedItem.startTime)}</div>
                      <div className="text-[var(--color-txt-3)] text-[12px]">{formatTime(selectedItem.startTime)}</div>
                    </div>
                  </div>
                  
                  {selectedItem.location && (
                    <div className="flex items-center gap-3 text-[13px]">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-2)] flex items-center justify-center">
                        <Icon name="mapPin" size={15} className="text-[var(--color-txt-2)]" />
                      </div>
                      <div className="text-[var(--color-txt-1)]">{selectedItem.location}</div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 text-[13px]">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-2)] flex items-center justify-center">
                      <Icon name="clock" size={15} className="text-[var(--color-txt-2)]" />
                    </div>
                    <div>
                      <div className={`${isPastDue(selectedItem.startTime) ? 'text-[var(--color-error)]' : 'text-[var(--color-txt-1)]'}`}>
                        {isPastDue(selectedItem.startTime) ? 'Past due' : `Due in ${getRelativeTime(selectedItem.startTime)}`}
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedItem.description && (
                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <div className="text-[12px] font-medium text-[var(--color-txt-3)] uppercase tracking-wider mb-2">
                      Description
                    </div>
                    <p className="text-[13px] text-[var(--color-txt-1)] leading-relaxed whitespace-pre-wrap">
                      {selectedItem.description.slice(0, 500)}
                      {selectedItem.description.length > 500 && '...'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-5 text-center text-[var(--color-txt-2)]">
                <Icon name="document" size={24} className="mx-auto mb-2 text-[var(--color-txt-3)]" />
                <p className="text-[13px]">Select an item to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
