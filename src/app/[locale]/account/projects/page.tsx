'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function AccountProjectsPage() {
  const t = useTranslations('projects')

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <button className="btn-primary text-sm">{t('createFirst')}</button>
      </div>
      <div className="text-center py-16 text-[var(--c-g500)]">
        <p className="text-lg mb-2">{t('empty')}</p>
        <p className="text-sm mb-4">从首页描述你的想法，创建第一个硬件项目</p>
        <Link href="/" className="mt-4 inline-block btn-primary text-sm">开始创建</Link>
      </div>
    </div>
  )
}
