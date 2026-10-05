import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { containerClass } from './ui'

// Full-width site frame: sticky header (with a menu button on mobile), page content, footer.
// Pages get a padded, centered content area by default; pass `bare` to draw full-width sections yourself.
export default function Layout({ children, bare = false }) {
  const { memberToken } = useAuth()
  const { pathname } = useLocation()
  // Remember which page the mobile menu was opened on, so it closes by itself after navigating
  const [menuOpenedOn, setMenuOpenedOn] = useState(null)
  const menuOpen = menuOpenedOn === pathname

  const links = [
    { to: '/', label: 'Home', end: true },
    memberToken ? { to: '/dashboard', label: 'My Dashboard' } : { to: '/login', label: 'Member Login' },
  ]

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
    }`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className={`${containerClass} flex h-16 items-center justify-between`}>
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-400">
            <img src="/title.png" alt="ALEOS" className="h-7 w-auto sm:h-8" />
            <span className="hidden sm:inline">Rewards</span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.label} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
            {!memberToken && (
              <Link
                to="/join/member"
                className="ml-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Join now
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpenedOn(menuOpen ? null : pathname)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile links */}
        {menuOpen && (
          <nav className="border-t border-slate-200 bg-white md:hidden">
            <div className={`${containerClass} flex flex-col py-2`}>
              {links.map((l) => (
                <NavLink key={l.label} to={l.to} end={l.end} className={linkClass}>
                  {l.label}
                </NavLink>
              ))}
              {!memberToken && (
                <Link
                  to="/join/member"
                  className="my-2 rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Join now
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        {bare ? children : <div className={`${containerClass} py-8 sm:py-12`}>{children}</div>}
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div
          className={`${containerClass} flex flex-col items-center justify-between gap-3 py-6 text-[13px] text-slate-500 sm:flex-row`}
        >
          <span>© {new Date().getFullYear()} ALEOS Rewards Network</span>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link to="/join/member" className="hover:text-slate-800">
              Become a member
            </Link>
            <Link to="/join/merchant" className="hover:text-slate-800">
              For merchants
            </Link>
            <Link to="/terms/member" className="hover:text-slate-800">
              Member Terms
            </Link>
            <Link to="/terms/merchant" className="hover:text-slate-800">
              Merchant Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
