'use client'

import { useTranslations } from 'next-intl'
import { mockProject } from '@/lib/mockData'
import dynamic from 'next/dynamic'
const CommunityCard = dynamic(() => import('./CommunityCard'), { ssr: false })

export default function MyProjects() {
  const t = useTranslations('home.myProjects')
  // In real app: fetch user's projects from API
  const myProjects = [mockProject]

  if (myProjects.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white mb-6">{t('title')}</h2>
        <div className="border border-dashed border-[var(--c-g700)] rounded-xl p-16 text-center">
          <p className="text-[var(--c-g500)] mb-4">{t('empty')}</p>
          <button className="btn-primary text-sm">{t('create')}</button>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {myProjects.map((project) => (
          <CommunityCard key={project.id} project={project} showStatus={true} showTags={false} />
        ))}
      </div>
    </section>
  )
}
