import { useState } from 'react'
import Icon from '../components/Icons'

const initialPosts = [
  { id: 1, title: 'Anyone know if ET 215 has outlets near the windows?', body: 'Trying to find a good spot to charge my laptop during class. The ones by the door are always taken.', anon: true, user: 'Anonymous', upvotes: 14, pinned: false, time: '2h ago', replies: [
    { user: 'Anonymous', body: 'Yes! There are a few power strips along the south wall near the windows. Get there early though.', time: '1h ago' },
    { user: 'jake_cs', body: 'Also the front row has outlets under the desks.', time: '45m ago' },
  ]},
  { id: 2, title: 'Best place to study during finals week?', body: 'Looking for somewhere quiet with good wifi and outlets. Library gets packed early.', anon: false, user: 'sarah_k', upvotes: 31, pinned: false, time: '5h ago', replies: [
    { user: 'Anonymous', body: 'Try the 3rd floor of the Campus Center after 8pm — much quieter.', time: '4h ago' },
    { user: 'TA_Mike', body: 'The ASC has private study rooms you can book online. Highly recommend.', time: '3h ago' },
    { user: 'sarah_k', body: "Thanks! Didn't know about the ASC rooms.", time: '2h ago' },
  ]},
  { id: 3, title: 'Is the Career Fair open to freshmen?', body: "I'm a first-year CS student — not sure if I should bother going or if it's mainly for upperclassmen.", anon: true, user: 'Anonymous', upvotes: 8, pinned: false, time: '6h ago', replies: [
    { user: 'career_office', body: 'Absolutely! All class years are welcome. Freshmen are encouraged to come, introduce themselves, and start building connections early.', time: '5h ago' },
  ]},
  { id: 4, title: 'Reminder: free tutoring at ASC this week', body: 'The Academic Success Center is offering extended hours this week Mon–Fri until 8pm. All subjects covered.', anon: false, user: 'ASC_Staff', upvotes: 22, pinned: true, time: '1d ago', replies: [] },
  { id: 5, title: 'Where can I print on campus for free?', body: '', anon: true, user: 'Anonymous', upvotes: 5, pinned: false, time: '1d ago', replies: [
    { user: 'lib_help', body: "The University Library gives you 25 free pages per day with your student ID. After that it's 10¢/page.", time: '22h ago' },
  ]},
]

export default function Board() {
  const [posts, setPosts] = useState(initialPosts)
  const [sort, setSort] = useState('recent')
  const [voted, setVoted] = useState(new Set())
  const [expanded, setExpanded] = useState(new Set())
  const [repliesOpen, setRepliesOpen] = useState(new Set())
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [isAnon, setIsAnon] = useState(true)

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
      user: isAnon ? 'Anonymous' : 'Jordan S.',
      upvotes: 0,
      pinned: false,
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
          replies: [...p.replies, { user: 'Jordan S.', body: text, time: 'Just now' }]
        }
      }
      return p
    }))
  }

  return (
    <div className="max-w-[760px] mx-auto px-8 py-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-medium text-[var(--color-txt-0)]">Campus Board</h1>
          <p className="text-[13px] text-[var(--color-txt-1)] mt-1">
            Ask questions, share tips, and connect with other students.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-gold-dark text-gold rounded-lg px-4 py-2 text-[13px] flex items-center gap-1.5 hover:bg-[#5c3a00] transition-colors"
        >
          <Icon name="plus" size={14} />
          Ask a question
        </button>
      </div>

      {/* New Post Form */}
      {showForm && (
        <div className="bg-[var(--color-bg-0)] border border-[var(--color-border-2)] rounded-xl p-4 mb-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-[var(--color-txt-0)]">New question</span>
            <button onClick={() => setShowForm(false)} className="text-[var(--color-txt-2)]">
              <Icon name="close" size={15} />
            </button>
          </div>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What's your question?"
            className="w-full text-[13px] border border-[var(--color-border-2)] rounded-lg px-3 py-2.5 bg-[var(--color-bg-2)] text-[var(--color-txt-0)] outline-none mb-2"
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Add more context (optional)..."
            className="w-full text-[13px] border border-[var(--color-border-2)] rounded-lg px-3 py-2.5 bg-[var(--color-bg-2)] text-[var(--color-txt-0)] outline-none resize-y min-h-[80px] mb-2.5"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-[var(--color-txt-1)] cursor-pointer">
              <input 
                type="checkbox" 
                checked={isAnon} 
                onChange={(e) => setIsAnon(e.target.checked)}
                className="w-4 h-4"
              />
              Post anonymously
            </label>
            <button 
              onClick={handleSubmitPost}
              className="bg-gold-dark text-gold rounded-lg px-4 py-2 text-xs"
            >
              Post question
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5">
          {['recent', 'popular'].map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors capitalize
                ${sort === s 
                  ? 'bg-gold-dark text-gold border-gold-dark' 
                  : 'bg-[var(--color-bg-2)] text-[var(--color-txt-1)] border-[var(--color-border-2)] hover:bg-[var(--color-stat)]'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--color-txt-2)]">{posts.length} posts</span>
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-2.5">
        {sortedPosts.map(post => (
          <div 
            key={post.id}
            className={`bg-[var(--color-bg-0)] border rounded-xl p-4
              ${post.pinned ? 'border-gold' : 'border-[var(--color-border)]'}`}
          >
            {post.pinned && (
              <div className="text-[9px] font-semibold text-gold-dark bg-gold px-2 py-0.5 rounded-full inline-block mb-2">
                Pinned
              </div>
            )}
            
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex-1">
                <div 
                  onClick={() => toggleExpand(post.id)}
                  className="text-sm font-medium text-[var(--color-txt-0)] cursor-pointer hover:text-[var(--color-accent)] transition-colors"
                >
                  {post.title}
                </div>
                {post.body && expanded.has(post.id) && (
                  <p className="text-[13px] text-[var(--color-txt-1)] leading-relaxed mt-2">
                    {post.body}
                  </p>
                )}
                <div className="text-[11px] text-[var(--color-txt-2)] mt-2 flex gap-2.5">
                  <span>{post.user}</span>
                  <span>{post.time}</span>
                  <span>{post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleUpvote(post.id)}
                className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors
                  ${voted.has(post.id) 
                    ? 'bg-gold-dark text-gold border-gold-dark' 
                    : 'bg-[var(--color-stat)] text-[var(--color-txt-1)] border-[var(--color-border)]'
                  }`}
              >
                <Icon name="chevronUp" size={12} strokeWidth={2.5} />
                {post.upvotes}
              </button>
            </div>

            {post.replies.length > 0 && (
              <button
                onClick={() => toggleReplies(post.id)}
                className="text-[11px] text-[var(--color-accent)] mt-2"
              >
                {repliesOpen.has(post.id) ? 'Hide' : 'Show'} {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}

            {repliesOpen.has(post.id) && (
              <div className="mt-2.5 pt-2.5 border-t border-[var(--color-border)]">
                {post.replies.map((reply, idx) => (
                  <div key={idx} className="py-2 border-b border-[var(--color-border)] last:border-b-0">
                    <p className="text-xs text-[var(--color-txt-1)]">{reply.body}</p>
                    <div className="text-[10px] text-[var(--color-txt-2)] mt-1 flex gap-2">
                      <span>{reply.user}</span>
                      <span>{reply.time}</span>
                    </div>
                  </div>
                ))}
                <ReplyInput onSubmit={(text) => handleSubmitReply(post.id, text)} />
              </div>
            )}
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
    <div className="flex gap-1.5 mt-2.5">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply..."
        className="flex-1 text-xs border border-[var(--color-border-2)] rounded-lg px-2.5 py-2 bg-[var(--color-bg-2)] text-[var(--color-txt-0)] outline-none"
      />
      <button 
        onClick={handleSubmit}
        className="bg-gold-dark text-gold rounded-lg px-3.5 py-2 text-xs"
      >
        <Icon name="send" size={12} />
      </button>
    </div>
  )
}
