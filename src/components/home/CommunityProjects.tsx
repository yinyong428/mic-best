'use client'

import { useTranslations } from 'next-intl'
import { communityProjects } from '@/lib/mockData'
import dynamic from 'next/dynamic'
import { Link } from '@/i18n/navigation'
const CommunityCard = dynamic(() => import('./CommunityCard'), { ssr: false })

const HOMEPAGE_COUNT = 4

export default function CommunityProjects() {
  const t = useTranslations('home.community')

  return (
    <section id="community" className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
        <Link href="/community" className="btn-secondary text-xs">{t('more')}</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {communityProjects.slice(0, HOMEPAGE_COUNT).map((project) => (
          <CommunityCard key={project.id} project={project} showTags={false} />
        ))}
      </div>
    </section>
  )
}
