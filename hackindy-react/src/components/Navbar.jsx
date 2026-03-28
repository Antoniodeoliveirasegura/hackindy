import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import Icon from './Icons'

const navItems = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/map', label: 'Map', icon: 'mapPin' },
  { path: '/schedule', label: 'Schedule', icon: 'schedule' },
  { path: '/events', label: 'Events', icon: 'calendar' },
  { path: '/services', label: 'More', icon: 'grid' },
]

export default function Navbar() {
  const location = useLocation()
  const { dark, toggleTheme } = useTheme()

  return (
    <nav className="bg-[var(--color-bg-0)] border-b border-[var(--color-border)] px-8 h-[52px] flex items-center justify-between sticky top-0 z-20">
      <Link to="/" className="text-[15px] font-medium flex items-center gap-2 text-[var(--color-txt-0)]">
        <span className="bg-gold text-gold-dark text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide">
          PIH
        </span>
        Purdue Indy Hub
      </Link>

      <div className="flex gap-0.5">
        {navItems.map(({ path, label, icon }) => {
          const isActive = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={`text-[13px] px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all
                ${isActive 
                  ? 'bg-[var(--color-bg-2)] text-[var(--color-txt-0)] font-medium' 
                  : 'text-[var(--color-txt-1)] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-txt-0)]'
                }`}
            >
              <Icon name={icon} size={14} />
              {label}
            </Link>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg border border-[var(--color-border-2)] bg-[var(--color-bg-2)] flex items-center justify-center text-[var(--color-txt-0)] hover:scale-105 transition-transform"
        >
          <Icon name={dark ? 'moon' : 'sun'} size={16} />
        </button>
        <div className="w-[30px] h-[30px] rounded-full bg-gold flex items-center justify-center text-[11px] font-semibold text-gold-dark">
          JS
        </div>
      </div>
    </nav>
  )
}
