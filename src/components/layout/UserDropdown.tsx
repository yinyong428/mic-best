'use client'

import { useState, useRef, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { useUserStore } from '@/stores/userStore'
import type { User } from '@/types'

export default function UserDropdown() {
  const t = useTranslations('account')
  const tCommon = useTranslations('common')
  const locale = useLocale() as 'en' | 'zh'
  const { user, logout } = useUserStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 border border-[var(--c-g700)] hover:border-[var(--c-g500)] transition-colors text-xs font-bold uppercase"
      >
        <span className="text-white">{user.username}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${user.plan === 'pro' ? 'bg-amber-500/20 text-amber-400' : 'bg-[var(--c-g800)] text-[var(--c-g500)]'}`}>
          {user.plan === 'pro' ? 'PRO' : 'FREE'}
        </span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--c-g900)] border border-[var(--c-g700)] rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          {/* User info */}
          <div className="px-4 py-3 border-b border-[var(--c-g800)]">
            <p className="text-sm font-bold text-white">{user.username}</p>
            <p className="text-xs text-[var(--c-g500)] mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${user.plan === 'pro' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-[var(--c-g800)] text-[var(--c-g500)]'}`}>
                {user.plan === 'pro' ? 'PRO' : t('freePlan')}
              </span>
              <span className="text-xs text-[var(--c-g500)]">{user.credits} {t('credits')}</span>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href={`/${locale}/account`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--c-g800)] transition-colors"
            >
              <svg className="w-4 h-4 text-[var(--c-g500)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {t('title')}
            </Link>
            <Link
              href={`/${locale}/account/projects`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--c-g800)] transition-colors"
            >
              <svg className="w-4 h-4 text-[var(--c-g500)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
              {t('myProjects')}
            </Link>
            <Link
              href={`/${locale}/account/stars`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--c-g800)] transition-colors"
            >
              <svg className="w-4 h-4 text-[var(--c-g500)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {t('favorites')}
            </Link>
            <Link
              href={`/${locale}/account/settings`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--c-g800)] transition-colors"
            >
              <svg className="w-4 h-4 text-[var(--c-g500)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              {t('settings')}
            </Link>
          </div>

          {/* Sign out */}
          <div className="border-t border-[var(--c-g800)] py-1">
            <button
              onClick={() => { logout(); setOpen(false) }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-[var(--c-g800)] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {tCommon('logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
