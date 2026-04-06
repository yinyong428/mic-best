'use client'

import { useEffect } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useUserStore } from '@/stores/userStore'

function Icon({ name }: { name: string }) {
  if (name === 'folder') return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
  if (name === 'star') return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
  if (name === 'settings') return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 1 4.6 9a1.65 1.65 0 0 1-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 1 .33 1.82V9a1.65 1.65 0 0 1 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 1-1.51 1z" />
    </svg>
  )
  return null
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('account')
  const { user } = useUserStore()
  const router = useRouter()

  const NAV_ITEMS = [
    { href: '/account', label: t('myProjects'), icon: 'folder' },
    { href: '/account/stars', label: t('favorites'), icon: 'star' },
    { href: '/account/settings', label: t('settings'), icon: 'settings' },
  ]

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  if (!user) return null

  return (
    <div className="min-h-dvh flex">
      <aside className="w-56 border-r border-[var(--c-g800)] shrink-0">
        <div className="p-4 border-b border-[var(--c-g800)]">
          <p className="text-xs font-bold text-[var(--c-g500)] uppercase tracking-wider">{t('title')}</p>
        </div>
        <nav className="py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--c-g800)] transition-colors text-[var(--c-g400)] hover:text-white"
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
