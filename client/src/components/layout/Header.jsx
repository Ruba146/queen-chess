import { NavLink } from 'react-router-dom'
import { Bell, ChevronsLeft, ChevronsRight, Crown, Menu, Search } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

function Header({ collapsed = false, onMenuClick, onToggleCollapse }) {
  return (
    <header className="qc-header-v2 sticky top-0 z-20">
      <div className="flex h-[44px] items-center gap-2 px-3 sm:px-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-1 text-[var(--qc-text-muted)] transition-colors qc-hover-bg-card-hover qc-hover-text-primary lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden rounded-md p-1 text-[var(--qc-text-muted)] transition-colors qc-hover-bg-card-hover qc-hover-text-primary lg:inline-flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronsRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronsLeft className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="hidden flex-1 items-center md:flex">
          <div className="relative w-full max-w-[220px]">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--qc-text-muted)]"
              aria-hidden="true"
            />
            <input type="search" placeholder="Search games, players, puzzles..." className="qc-search-v2" />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={Crown}
            className="hidden h-7 rounded-[7px] px-2.5 text-[10px] text-[var(--qc-text-secondary)] sm:inline-flex"
          >
            Upgrade
          </Button>
          <button
            type="button"
            className="relative rounded-md p-1 text-[var(--qc-text-muted)] transition-colors qc-hover-bg-card-hover qc-hover-text-primary"
            aria-label="Notifications"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--qc-gold)] shadow-[0_0_6px_rgba(201,164,81,0.35)]" />
          </button>
          <NavLink
            to="/profile"
            className="rounded-md ring-2 ring-transparent transition-all qc-hover-ring-accent"
            aria-label="Profile"
          >
            <Avatar name="Queen Chess" size="xs" />
          </NavLink>
        </div>
      </div>
    </header>
  )
}

export default Header
