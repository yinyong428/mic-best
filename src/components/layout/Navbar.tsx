'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useUserStore } from '@/stores/userStore'
import UserDropdown from './UserDropdown'
import CreditsPurchaseModal from '@/components/CreditsPurchaseModal'

export default function Navbar() {
  const locale = useLocale() as 'en' | 'zh'
  const router = useRouter()
  const t = useTranslations('common')
  const tNav = useTranslations('navbar')
  const { user, fetchProfile } = useUserStore()
  const [showCredits, setShowCredits] = useState(false)

  // Refresh credits when modal closes
  const handleCreditsClose = () => {
    setShowCredits(false)
    if (user) fetchProfile(user.id)
  }

  const switchLocale = (newLocale: 'en' | 'zh') => {
    // Use window.location to force absolute path navigation
    window.location.href = `/${newLocale}/`
  }

  return (
    <header className="h-14 border-b border-[var(--c-g800)] bg-black flex items-center px-4 shrink-0 z-30">
      <div className="flex flex-1 items-center min-w-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
          <span className="font-bold text-white text-sm tracking-widest uppercase">MIC.BEST</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 ml-10">
          <Link href="/" className="text-xs text-[var(--c-g400)] hover:text-white transition-colors">
            {t('home')}
          </Link>
          <Link href="/community" className="text-xs text-[var(--c-g400)] hover:text-white transition-colors">
            {tNav('community')}
          </Link>
          <Link href="/pricing" className="text-xs text-[var(--c-g400)] hover:text-white transition-colors">
            {t('pricing')}
          </Link>
        </nav>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Language switcher */}
        <div className="flex items-center border border-[var(--c-g700)] rounded-lg overflow-hidden">
          <button
            onClick={() => switchLocale('en')}
            className={`px-2 py-1 text-[10px] font-bold transition-colors ${
              locale === 'en' ? 'bg-white text-black' : 'text-[var(--c-g500)] hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => switchLocale('zh')}
            className={`px-2 py-1 text-[10px] font-bold transition-colors ${
              locale === 'zh' ? 'bg-white text-black' : 'text-[var(--c-g500)] hover:text-white'
            }`}
          >
            中文
          </button>
        </div>

        {user ? (
          <>
            {/* Credits badge — click to buy more */}
            <button
              onClick={() => setShowCredits(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-[var(--c-g700)] text-xs font-bold hover:border-[var(--c-accent)] transition-colors cursor-pointer"
              title="购买更多 Credits"
            >
              <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="text-white">{user.credits}</span>
            </button>
            <UserDropdown />
          </>
        ) : (
          <>
            <Link href="/login" className="btn-secondary text-xs">{t('login')}</Link>
            <Link href="/signup" className="btn-primary text-xs">{t('signup')}</Link>
          </>
        )}
      </div>
      <CreditsPurchaseModal open={showCredits} onClose={handleCreditsClose} />
    </header>
  )
}
