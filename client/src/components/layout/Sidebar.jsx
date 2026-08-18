import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit,
  Crown,
  Diamond,
  Flag,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Swords,
  Trophy,
  User,
  X,
  BookOpen,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import QueenChessLogo from '../common/QueenChessLogo'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/play', label: 'Play', icon: Swords },
  { to: '/quiz', label: 'Puzzles', icon: BrainCircuit },
  { to: '/my-games', label: 'My Games', icon: BookOpen },
  { to: '/learning', label: 'Learning', icon: GraduationCap },
  { to: '/challenges', label: 'Challenges', icon: Flag, disabled: true },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, disabled: true },
  { to: '/community', label: 'Community', icon: MessageSquare, disabled: true },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings, disabled: true },
]

function BrandMark({ collapsed = false }) {
  return (
    <div className={`qc-brand-lockup ${collapsed ? 'collapsed' : ''}`}>
      <QueenChessLogo
        className={collapsed ? 'queen-chess-logo--mark' : 'queen-chess-logo--full'}
      />
    </div>
  )
}

function PremiumLink({ collapsed = false, onClose }) {
  return (
    <NavLink
      to="/premium"
      onClick={onClose}
      title={collapsed ? 'Premium' : undefined}
      aria-label={collapsed ? 'Premium' : undefined}
      className={({ isActive }) =>
        ['qc-nav-link qc-premium-link', isActive && 'qc-nav-link-active']
          .filter(Boolean)
          .join(' ')
      }
    >
      <Crown className="h-6 w-6 shrink-0 qc-text-gold" aria-hidden="true" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">Premium</span>
          <span className="qc-pro-badge">PRO</span>
        </>
      )}
    </NavLink>
  )
}

function SidebarContent({ collapsed = false, onClose }) {
  const { user } = useAuth()
  const displayName = user?.displayName || user?.username || 'Player'
  const rating = user?.ratings?.rapid || 1200
  const tier = user?.playerLevel || 'Beginner'

  return (
    <div className="flex flex-col h-full">
      <div className="qc-sidebar-brand-v2">
        <BrandMark collapsed={collapsed} />
      </div>
      <nav className="qc-sidebar-nav-v2 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          if (item.disabled) {
            return (
               <div
                 key={item.to}
                 title={collapsed ? item.label : 'Coming soon'}
                 className="qc-nav-link qc-nav-link-disabled"
                 aria-disabled="true"
               >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
               </div>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                ['qc-nav-link', isActive && 'qc-nav-link-active']
                  .filter(Boolean)
                  .join(' ')
              }
            >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
      <div className="mt-auto shrink-0 flex flex-col gap-2 border-t border-[var(--qc-border)] p-2.5">
        <PremiumLink collapsed={collapsed} onClose={onClose} />
        {!collapsed && (
          <NavLink
            to="/profile"
            onClick={onClose}
            className="qc-sidebar-user-card"
            aria-label="Profile"
          >
            <div className="qc-sidebar-user-avatar">
              <span className="text-sm font-bold qc-text-gold">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold qc-text-primary">{displayName}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold qc-text-secondary">{rating}</span>
                <span className="qc-sidebar-user-tier">
                  <Diamond className="h-4 w-4" aria-hidden="true" />
                  <span>{tier}</span>
                </span>
              </div>
            </div>
          </NavLink>
        )}
      </div>
    </div>
  )
}

function Sidebar({ collapsed = false, open = false, onClose }) {
  const content = (
    <SidebarContent collapsed={collapsed} onClose={onClose} />
  )

  return (
    <>
      <aside
        className={`qc-sidebar-v2 z-30 hidden shrink-0 transition-[width] duration-200 lg:block ${
          collapsed ? 'w-[64px]' : 'w-[200px]'
        }`}
      >
        {content}
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
              <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="qc-sidebar-v2 fixed inset-y-0 left-0 z-50 flex w-[200px] flex-col lg:hidden"
            >
              <div className="flex h-10 shrink-0 items-center justify-end px-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 text-[var(--qc-text-muted)] transition-colors qc-hover-bg-card-hover qc-hover-text-primary"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
