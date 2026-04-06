'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function AccountStarsPage() {
  const t = useTranslations('stars')

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold mb-6">{t('title')}</h1>
      <div className="text-center py-16 text-[var(--c-g500)]">
        <p className="text-lg mb-2">{t('empty')}</p>
        <p className="text-sm mb-4">{t('emptyHint')}</p>
        <Link href="/community" className="btn-primary text-sm">去社区发现</Link>
      </div>
    </div>
  )
}
