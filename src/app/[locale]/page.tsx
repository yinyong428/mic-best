'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import HeroSection from '@/components/home/HeroSection'
import CommunityProjects from '@/components/home/CommunityProjects'
import MyProjects from '@/components/home/MyProjects'
import PricingModal from '@/components/PricingModal'

export default function HomePage() {
  const t = useTranslations('home')
  const tPro = useTranslations('proBanner')
  const [showIdeas, setShowIdeas] = useState(false)
  const [showPricing, setShowPricing] = useState(false)

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex-1 flex flex-col">
        {/* Pro Banner */}
        <div className="bg-[var(--c-g900)] border-b border-[var(--c-g800)]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
            <span className="text-base">⚡</span>
            <p className="text-sm font-bold text-white">{tPro('title')}</p>
            <button
              onClick={() => setShowPricing(true)}
              className="shrink-0 px-4 py-1.5 bg-black hover:bg-[var(--c-g800)] text-white text-xs font-bold rounded-lg transition-colors border border-[var(--c-g700)]"
            >
              {tPro('getPro')}
            </button>
          </div>
        </div>

        <HeroSection showIdeas={showIdeas} onToggleIdeas={() => setShowIdeas(s => !s)} />
        <CommunityProjects />
        <MyProjects />

        {/* Footer */}
        <footer className="border-t border-[var(--c-g800)] py-6 text-center text-xs text-[var(--c-g600)]">
          {t('footer.madeBy')} · <Link href="/terms" className="hover:text-[var(--c-g400)]">服务条款</Link> · <Link href="/privacy" className="hover:text-[var(--c-g400)]">隐私协议</Link>
        </footer>
      </div>

      {/* Pricing Modal */}
      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  )
}
