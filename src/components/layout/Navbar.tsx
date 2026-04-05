'use client'

import type { User } from '@/types'

interface NavbarProps {
  user: User | null
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="h-14 border-b border-[var(--c-g800)] bg-black flex items-center px-4 shrink-0 z-30">
      <div className="flex flex-1 items-center min-w-0">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--c-accent)]"
          >
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            <line x1="12" y1="22" x2="12" y2="15.5" />
            <polyline points="22 8.5 12 15.5 2 8.5" />
          </svg>
          <h1 className="font-bold text-white text-sm tracking-widest uppercase">
            MIC.BEST
          </h1>
        </a>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-3">
        {user ? (
          <>
            {/* Credits badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--c-g700)] text-xs font-bold">
              <span className="text-[var(--c-g400)]">{user.credits}</span>
            </div>

            {/* User menu */}
            <button className="flex items-center gap-2 px-3 py-1.5 border border-[var(--c-g700)] hover:border-[var(--c-g500)] transition-colors text-xs font-bold uppercase">
              {user.username}
            </button>
          </>
        ) : (
          <>
            <button className="btn-secondary text-xs">Login</button>
            <button className="btn-primary text-xs">Sign Up</button>
          </>
        )}
      </div>
    </header>
  )
}
