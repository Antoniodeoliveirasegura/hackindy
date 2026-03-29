/**
 * Turn raw text with http(s) URLs into React nodes with clickable, wrapping links.
 */
export function linkifyText(text, { maxDisplayLength = 80 } = {}) {
  if (text == null || text === '') return null

  const urlRegex = /(https?:\/\/[^\s<]+)/gi
  const parts = text.split(urlRegex)

  return parts.map((part, i) => {
    const isUrl = /^https?:\/\//i.test(part)
    if (!isUrl) {
      return (
        <span key={i} className="whitespace-pre-wrap break-words">
          {part}
        </span>
      )
    }
    const display =
      maxDisplayLength > 0 && part.length > maxDisplayLength
        ? `${part.slice(0, maxDisplayLength)}…`
        : part
    return (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--color-accent)] hover:underline break-all [overflow-wrap:anywhere] align-baseline"
      >
        {display}
      </a>
    )
  })
}
