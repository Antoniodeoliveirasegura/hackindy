import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { authRequest } from '../lib/authApi'
import Icon from '../components/Icons'

export default function Board() {
  const { getDisplayName } = useAuth()
  const [posts, setPosts] = useState([])
  const [sort, setSort] = useState('recent')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(new Set())
  const [repliesOpen, setRepliesOpen] = useState(new Set())
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [isAnon, setIsAnon] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [improving, setImproving] = useState(false)

  const handleImprovePost = async () => {
    if (!newTitle.trim() || improving) return
    setImproving(true)
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Improve this campus board post to be clearer and more likely to get helpful responses. Keep the same question intent. Return ONLY the improved title on the first line, then a blank line, then the improved body (or nothing if no body needed). No explanations.\n\nTitle: ${newTitle}\nBody: ${newBody}`,
          }],
        }),
      })
      const data = await res.json()
      if (data.reply) {
        const lines = data.reply.trim().split('\n')
        const title = lines[0].replace(/^(Title:\s*|#+\s*)/i, '').trim()
        const bodyLines = lines.slice(1).filter((l, i) => i > 0 || l.trim())
        const body = bodyLines.join('\n').replace(/^(Body:\s*)/i, '').trim()
        if (title) setNewTitle(title)
        if (body) setNewBody(body)
      }
    } catch (err) {
      console.error('Improve post error', err)
    } finally {
      setImproving(false)
    }
  }
  const mounted = true

  const currentUserName = getDisplayName()

  // ── Fetch posts ────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await authRequest(`/api/board/posts?sort=${sort}`)
      setPosts((data.posts || []).map(p => ({
        ...p,
        time: formatRelative(p.time),
        replies: (p.replies || []).map(r => ({ ...r, time: formatRelative(r.time) })),
      })))
    } catch (err) {
      console.error('Board fetch error', err)
    } finally {
      setLoading(false)
    }
  }, [sort])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  // ── Upvote ─────────────────────────────────────────────────────────────────
  const handleUpvote = async (id) => {
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === id
        ? { ...p, upvotes: p.upvotedByMe ? p.upvotes - 1 : p.upvotes + 1, upvotedByMe: !p.upvotedByMe }
        : p
    ))
    try {
      const data = await authRequest(`/api/board/posts/${id}/upvote`, { method: 'POST' })
      setPosts(prev => prev.map(p =>
        p.id === id ? { ...p, upvotes: data.upvotes, upvotedByMe: data.upvotedByMe } : p
      ))
    } catch {
      // Revert
      setPosts(prev => prev.map(p =>
        p.id === id
          ? { ...p, upvotes: p.upvotedByMe ? p.upvotes - 1 : p.upvotes + 1, upvotedByMe: !p.upvotedByMe }
          : p
      ))
    }
  }

  const toggleExpand  = (id) => setExpanded(prev => toggle(prev, id))
  const toggleReplies = (id) => setRepliesOpen(prev => toggle(prev, id))

  // ── Submit post ────────────────────────────────────────────────────────────
  const handleSubmitPost = async () => {
    if (!newTitle.trim() || submitting) return
    setSubmitting(true)
    try {
      const data = await authRequest('/api/board/posts', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, body: newBody, anon: isAnon }),
      })
      setPosts(prev => [{ ...data.post, time: 'Just now' }, ...prev])
      setNewTitle('')
      setNewBody('')
      setShowForm(false)
    } catch (err) {
      console.error('Post submit error', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Submit reply ───────────────────────────────────────────────────────────
  const handleSubmitReply = async (postId, text) => {
    if (!text.trim()) return
    try {
      const data = await authRequest(`/api/board/posts/${postId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body: text, anon: false }),
      })
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, replies: [...p.replies, { ...data.reply, time: 'Just now' }] }
          : p
      ))
    } catch (err) {
      console.error('Reply submit error', err)
    }
  }

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return sort === 'popular' ? b.upvotes - a.upvotes : 0
  })

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
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2.5 text-[13px] text-[var(--color-txt-1)] cursor-pointer select-none">
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isAnon ? 'bg-[var(--color-gold)] border-[var(--color-gold)]' : 'border-[var(--color-border-2)] bg-transparent'}`}
                onClick={() => setIsAnon(v => !v)}
              >
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
            <div className="flex items-center gap-2">
              <button
                onClick={handleImprovePost}
                disabled={!newTitle.trim() || improving}
                className="btn btn-secondary text-[13px] px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Let AI rewrite your post to be clearer"
              >
                <Icon name="sparkles" size={13} />
                {improving ? 'Improving…' : 'Improve'}
              </button>
              <button
                onClick={handleSubmitPost}
                disabled={!newTitle.trim() || submitting}
                className="btn btn-primary text-[13px] px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting…' : 'Post question'}
              </button>
            </div>
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

      {/* Loading */}
      {loading && (
        <div className="card p-12 text-center animate-fade-in-up stagger-2">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-[var(--color-txt-2)]">Loading posts…</p>
        </div>
      )}

      {/* Posts */}
      {!loading && (
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
                    ${post.upvotedByMe
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
                      {post.replies.map((reply, i) => (
                        <div key={reply.id ?? i} className="py-3 border-b border-[var(--color-border)] last:border-b-0">
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

          {sortedPosts.length === 0 && (
            <div className="card p-12 text-center">
              <Icon name="message" size={32} className="mx-auto mb-3 text-[var(--color-txt-3)]" />
              <p className="text-[14px] text-[var(--color-txt-2)]">No posts yet. Be the first to ask a question!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ReplyInput({ onSubmit }) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (!text.trim()) return
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

// ── Utilities ──────────────────────────────────────────────────────────────────

function toggle(set, id) {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

function formatRelative(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(isoString).toLocaleDateString()
}
