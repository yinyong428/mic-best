'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import PricingModal from '@/components/PricingModal'

export default function PricingPage() {
  const t = useTranslations('pricing')
  const [open, setOpen] = useState(true)

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-[var(--c-g500)]">{t('subtitle')}</p>
          <button
            onClick={() => setOpen(true)}
            className="px-6 py-3 bg-[var(--c-accent)] text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            {t('viewPlans')}
          </button>
        </div>
      </div>
      <PricingModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
