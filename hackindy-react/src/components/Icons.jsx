const icons = {
  home: (
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
  ),
  mapPin: (
    <>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="currentColor" stroke="none"/>
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="3"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <circle cx="8" cy="15" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="15" r="1.5" fill="currentColor" stroke="none"/>
    </>
  ),
  schedule: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="3"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <path d="M7 11h4"/>
      <path d="M7 15h6"/>
      <path d="M7 19h2"/>
    </>
  ),
  bus: (
    <>
      <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/>
      <path d="M4 10h16"/>
      <circle cx="7.5" cy="14" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="16.5" cy="14" r="1.5" fill="currentColor" stroke="none"/>
      <path d="M6 18v2"/>
      <path d="M18 18v2"/>
      <path d="M8 4v2"/>
      <path d="M16 4v2"/>
    </>
  ),
  dining: (
    <>
      <path d="M3 3v7c0 1.1.9 2 2 2h3v9a1 1 0 002 0V12h3a2 2 0 002-2V3"/>
      <path d="M7 3v5"/>
      <path d="M19 3v18a1 1 0 01-1 1h0a1 1 0 01-1-1v-6h-1a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3z"/>
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2"/>
      <path d="M12 20v2"/>
      <path d="M4.93 4.93l1.41 1.41"/>
      <path d="M17.66 17.66l1.41 1.41"/>
      <path d="M2 12h2"/>
      <path d="M20 12h2"/>
      <path d="M6.34 17.66l-1.41 1.41"/>
      <path d="M19.07 4.93l-1.41 1.41"/>
    </>
  ),
  moon: (
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7"/>
      <path d="M21 21l-4.35-4.35"/>
    </>
  ),
  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </>
  ),
  arrowUpRight: (
    <>
      <path d="M7 17L17 7"/>
      <path d="M7 7h10v10"/>
    </>
  ),
  send: (
    <>
      <path d="M22 2L11 13"/>
      <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
    </>
  ),
  chevronUp: (
    <path d="M18 15l-6-6-6 6"/>
  ),
  chevronDown: (
    <path d="M6 9l6 6 6-6"/>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </>
  ),
  minus: (
    <line x1="5" y1="12" x2="19" y2="12"/>
  ),
  coffee: (
    <>
      <path d="M18 8h1a4 4 0 010 8h-1"/>
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
      <path d="M6 1v3"/>
      <path d="M10 1v3"/>
      <path d="M14 1v3"/>
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      <path d="M8 7h8"/>
      <path d="M8 11h6"/>
    </>
  ),
  building: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/>
      <path d="M16 6h.01"/>
      <path d="M12 6h.01"/>
      <path d="M12 10h.01"/>
      <path d="M12 14h.01"/>
      <path d="M16 10h.01"/>
      <path d="M16 14h.01"/>
      <path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/>
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="7" r="3"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <circle cx="17" cy="8" r="2.5"/>
      <path d="M21 21v-1.5a3 3 0 00-3-3h-1"/>
    </>
  ),
  message: (
    <>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      <path d="M8 9h8"/>
      <path d="M8 13h4"/>
    </>
  ),
  sparkles: (
    <path fill="currentColor" d="M9.5 2l1.5 4.5L15.5 8l-4.5 1.5L9.5 14l-1.5-4.5L3.5 8l4.5-1.5L9.5 2zM18 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zM6 16l.75 2.25L9 19l-2.25.75L6 22l-.75-2.25L3 19l2.25-.75L6 16z"/>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 6v6l4 2"/>
    </>
  ),
  check: (
    <polyline points="20 6 9 17 4 12"/>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <circle cx="12" cy="8" r="0.5" fill="currentColor"/>
    </>
  ),
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  ),
  star: (
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  ),
  navigation: (
    <path fill="currentColor" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>
  ),
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </>
  ),
  external: (
    <>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </>
  ),
  filter: (
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  ),
  wave: (
    <path fill="currentColor" d="M7.5 4.5c-.6 0-1 .4-1 1v4.7c0 .3-.1.5-.3.7-.2.2-.4.3-.7.3h-1c-.6 0-1 .4-1 1v2c0 .3.1.5.3.7l4.4 4.4c.2.2.5.3.7.3h7.6c.6 0 1-.4 1-1v-1.7c0-.3-.1-.5-.3-.7l-2.5-2.5c-.2-.2-.3-.4-.3-.7V9c0-.6-.4-1-1-1s-1 .4-1 1v2.5c0 .3-.1.5-.3.7l-1.4 1.4c-.2.2-.5.3-.7.3-.3 0-.5-.1-.7-.3L8.2 12c-.2-.2-.3-.4-.3-.7V5.5c0-.5-.4-1-1-1zm3-2c-.6 0-1 .4-1 1v1c0 .6.4 1 1 1s1-.4 1-1v-1c0-.6-.4-1-1-1zm4 0c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1z"/>
  ),
  pin: (
    <>
      <path d="M12 17v5"/>
      <path d="M9 11V7a1 1 0 011-1h4a1 1 0 011 1v4"/>
      <path d="M5 11h14l-1.5 4.5a2 2 0 01-1.9 1.5H8.4a2 2 0 01-1.9-1.5L5 11z"/>
      <path d="M12 2v4"/>
    </>
  ),
  library: (
    <>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </>
  ),
  graduation: (
    <>
      <path d="M22 10l-10-5-10 5 10 5 10-5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      <path d="M22 10v6"/>
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
      <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
    </>
  ),
  printer: (
    <>
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </>
  ),
  health: (
    <>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </>
  ),
  wifi: (
    <>
      <path d="M5 12.55a11 11 0 0114.08 0"/>
      <path d="M1.42 9a16 16 0 0121.16 0"/>
      <path d="M8.53 16.11a6 6 0 016.95 0"/>
      <circle cx="12" cy="20" r="1" fill="currentColor"/>
    </>
  ),
}

export default function Icon({ name, size = 16, className = '', strokeWidth = 2 }) {
  const iconPath = icons[name]
  
  if (!iconPath) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={`inline-flex shrink-0 ${className}`}
    >
      {iconPath}
    </svg>
  )
}
