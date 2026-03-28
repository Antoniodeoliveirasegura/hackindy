import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icons'

const initialPosts = [
  { id: 1, title: 'Anyone know if ET 215 has outlets near the windows?', body: 'Trying to find a good spot to charge my laptop during class. The ones by the door are always taken.', anon: true, user: 'Anonymous', upvotes: 14, pinned: false, time: '2h ago', hot: true, replies: [
    { user: 'Anonymous', body: 'Yes! There are a few power strips along the south wall near the windows. Get there early though.', time: '1h ago' },
    { user: 'jake_cs', body: 'Also the front row has outlets under the desks.', time: '45m ago' },
  ]},
  { id: 2, title: 'Best place to study during finals week?', body: 'Looking for somewhere quiet with good wifi and outlets. Library gets packed early.', anon: false, user: 'sarah_k', upvotes: 31, pinned: false, time: '5h ago', hot: true, replies: [
    { user: 'Anonymous', body: 'Try the 3rd floor of the Campus Center after 8pm — much quieter.', time: '4h ago' },
    { user: 'TA_Mike', body: 'The ASC has private study rooms you can book online. Highly recommend.', time: '3h ago' },
    { user: 'sarah_k', body: "Thanks! Didn't know about the ASC rooms.", time: '2h ago' },
  ]},
  { id: 3, title: 'Is the Career Fair open to freshmen?', body: "I'm a first-year CS student — not sure if I should bother going or if it's mainly for upperclassmen.", anon: true, user: 'Anonymous', upvotes: 8, pinned: false, time: '6h ago', hot: false, replies: [
    { user: 'career_office', body: 'Absolutely! All class years are welcome. Freshmen are encouraged to come, introduce themselves, and start building connections early.', time: '5h ago' },
  ]},
  { id: 4, title: 'Reminder: free tutoring at ASC this week', body: 'The Academic Success Center is offering extended hours this week Mon–Fri until 8pm. All subjects covered.', anon: false, user: 'ASC_Staff', upvotes: 22, pinned: true, time: '1d ago', hot: false, replies: [] },
  { id: 5, title: 'Where can I print on campus for free?', body: '', anon: true, user: 'Anonymous', upvotes: 5, pinned: false, time: '1d ago', hot: false, replies: [
    { user: 'lib_help', body: "The University Library gives you 25 free pages per day with your student ID. After that it's 10¢/page.", time: '22h ago' },
  ]},
]

export default function Board() {
  const { getDisplayName } = useAuth()
  const [posts, setPosts] = useState(initialPosts)
  const [sort, setSort] = useState('recent')
  const [voted, setVoted] = useState(new Set())
  const [expanded, setExpanded] = useState(new Set())
  const [repliesOpen, setRepliesOpen] = useState(new Set())
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [isAnon, setIsAnon] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentUserName = getDisplayName()

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return sort === 'popular' ? b.upvotes - a.upvotes : 0
  })

  const handleUpvote = (id) => {
    setPosts(posts.map(p => {
      if (p.id === id) {
        const wasVoted = voted.has(id)
        return { ...p, upvotes: wasVoted ? p.upvotes - 1 : p.upvotes + 1 }
      }
      return p
    }))
    setVoted(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleReplies = (id) => {
    setRepliesOpen(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmitPost = () => {
    if (!newTitle.trim()) return
    const newPost = {
      id: Date.now(),
      title: newTitle,
      body: newBody,
      anon: isAnon,
      user: isAnon ? 'Anonymous' : currentUserName,
      upvotes: 0,
      pinned: false,
      hot: false,
      time: 'Just now',
      replies: []
    }
    setPosts([newPost, ...posts])
    setNewTitle('')
    setNewBody('')
    setShowForm(false)
  }

  const handleSubmitReply = (postId, text) => {
    if (!text.trim()) return
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          replies: [...p.replies, { user: currentUserName, body: text, time: 'Just now' }]
        }
      }
      return p
    }))
  }

  return (
    <div className={`max-w-[800px] mx-auto px-6 py-8 pb-24 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-txt-0)]">Campus Board</h1>
          <p className="text-[14px] text-[var(--color-txt-2)] mt-1">
            Ask questions, share tips, and connect with other students
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary text-[13px] px-4 py-2.5 w-fit"
        >
          <Icon name="plus" size={16} />
          Ask a question
        </button>
      </div>

      {/* New Post Form */}
      <div className={`overflow-hidden transition-all duration-500 ease-out ${showForm ? 'max-h-[400px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
        <div className="card p-5 animate-fade-in-scale">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[15px] font-semibold text-[var(--color-txt-0)]">New question</span>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost w-8 h-8 p-0">
              <Icon name="close" size={16} />
            </button>
          </div>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What's your question?"
            className="input w-full text-[14px] px-4 py-3 mb-3"
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Add more context (optional)..."
            className="input w-full text-[14px] px-4 py-3 resize-y min-h-[100px] mb-4"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 text-[13px] text-[var(--color-txt-1)] cursor-pointer select-none">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isAnon ? 'bg-[var(--color-gold)] border-[var(--color-gold)]' : 'border-[var(--color-border-2)] bg-transparent'}`}>
                {isAnon && <Icon name="check" size={12} className="text-[var(--color-gold-dark)]" strokeWidth={3} />}
              </div>
              <input 
                type="checkbox" 
                checked={isAnon} 
                onChange={(e) => setIsAnon(e.target.checked)}
                className="sr-only"
              />
              Post anonymously
            </label>
            <button 
              onClick={handleSubmitPost}
              disabled={!newTitle.trim()}
              className="btn btn-primary text-[13px] px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post question
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-5 animate-fade-in-up stagger-1">
        <div className="flex gap-2">
          {['recent', 'popular'].map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`pill capitalize ${sort === s ? 'pill-active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-[var(--color-txt-3)]">{posts.length} posts</span>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {sortedPosts.map((post, idx) => (
          <div 
            key={post.id}
            className={`card p-5 transition-all duration-300 animate-fade-in-up
              ${post.pinned ? 'ring-2 ring-[var(--color-gold)]/30 ring-offset-2 ring-offset-[var(--color-bg-1)]' : ''}`}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className="flex gap-3">
              {/* Upvote button */}
              <button
                onClick={() => handleUpvote(post.id)}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all hover:scale-105
                  ${voted.has(post.id) 
                    ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold-muted)]' 
                    : 'bg-[var(--color-stat)] text-[var(--color-txt-2)] hover:bg-[var(--color-bg-3)]'
                  }`}
              >
                <Icon name="chevronUp" size={16} strokeWidth={2.5} />
                <span className="text-[12px] font-semibold">{post.upvotes}</span>
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  {post.pinned && (
                    <span className="badge bg-[var(--color-gold)] text-[var(--color-gold-dark)] text-[9px]">
                      <Icon name="pin" size={8} />
                      Pinned
                    </span>
                  )}
                  {post.hot && !post.pinned && (
                    <span className="badge bg-[var(--color-events-bg)] text-[var(--color-events-color)] text-[9px]">
                      HOT
                    </span>
                  )}
                </div>
                
                <div 
                  onClick={() => toggleExpand(post.id)}
                  className="text-[15px] font-medium text-[var(--color-txt-0)] cursor-pointer hover:text-[var(--color-accent)] transition-colors leading-snug"
                >
                  {post.title}
                </div>
                
                <div className={`overflow-hidden transition-all duration-300 ${expanded.has(post.id) && post.body ? 'max-h-[200px] mt-2' : 'max-h-0'}`}>
                  <p className="text-[13px] text-[var(--color-txt-1)] leading-relaxed">
                    {post.body}
                  </p>
                </div>
                
                <div className="text-[11px] text-[var(--color-txt-3)] mt-2 flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-stat)] flex items-center justify-center text-[9px] font-medium">
                      {post.user.charAt(0).toUpperCase()}
                    </div>
                    {post.user}
                  </span>
                  <span>{post.time}</span>
                  <button
                    onClick={() => toggleReplies(post.id)}
                    className="flex items-center gap-1 text-[var(--color-accent)] hover:underline"
                  >
                    <Icon name="message" size={11} />
                    {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
                  </button>
                </div>

                {/* Replies */}
                <div className={`overflow-hidden transition-all duration-300 ${repliesOpen.has(post.id) ? 'max-h-[600px] mt-4' : 'max-h-0'}`}>
                  <div className="pt-4 border-t border-[var(--color-border)]">
                    {post.replies.map((reply, idx) => (
                      <div key={idx} className="py-3 border-b border-[var(--color-border)] last:border-b-0">
                        <p className="text-[13px] text-[var(--color-txt-1)] leading-relaxed">{reply.body}</p>
                        <div className="text-[11px] text-[var(--color-txt-3)] mt-2 flex items-center gap-2">
                          <span className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-[var(--color-stat)] flex items-center justify-center text-[8px] font-medium">
                              {reply.user.charAt(0).toUpperCase()}
                            </div>
                            {reply.user}
                          </span>
                          <span>{reply.time}</span>
                        </div>
                      </div>
                    ))}
                    <ReplyInput onSubmit={(text) => handleSubmitReply(post.id, text)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReplyInput({ onSubmit }) {
  const [text, setText] = useState('')
  
  const handleSubmit = () => {
    onSubmit(text)
    setText('')
  }

  return (
    <div className="flex gap-2 mt-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Write a reply..."
        className="input flex-1 text-[13px] px-4 py-2.5"
      />
      <button 
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="btn btn-primary px-4 py-2.5 disabled:opacity-50"
      >
        <Icon name="send" size={14} />
      </button>
    </div>
  )
}
