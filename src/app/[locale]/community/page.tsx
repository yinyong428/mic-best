'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import CommunityCard from '@/components/home/CommunityCard'
import type { Project } from '@/types'

const PAGE_SIZE = 8

export default function CommunityPage() {
  const t = useTranslations('community')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'trending' | 'recent' | 'starred'>('trending')
  const [filter, setFilter] = useState<'all' | 'electronics' | 'mechanical'>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch('/api/community')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Normalize from API or mock
          const normalized: Project[] = data.map((p: any) => ({
            id: p.id ?? p.name,
            name: p.name ?? 'Untitled',
            description: p.description ?? '',
            parts: p.parts ?? [],
            totalCost: p.total_cost ?? p.totalCost ?? 0,
            status: p.status ?? 'published',
            author: p.author ?? p.author_nickname ?? 'anonymous',
            createdAt: p.created_at ?? p.createdAt ?? new Date().toISOString(),
            updatedAt: p.updated_at ?? p.updatedAt ?? new Date().toISOString(),
            imageUrl: p.image_url ?? p.imageUrl,
            tags: p.tags ?? [],
            starCount: p.star_count ?? p.starCount ?? 0,
            copyCount: p.copy_count ?? p.copyCount ?? 0,
          }))
          setProjects(normalized)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const electronicsCount = projects.filter((p) => p.tags?.includes('Electronics')).length
  const mechanicalCount = projects.filter((p) => p.tags?.includes('Mechanical')).length

  const filtered = useMemo(() => {
    let list = [...projects]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.author ?? '').toLowerCase().includes(q)
      )
    }

    if (filter === 'electronics') {
      list = list.filter((p) => p.tags?.includes('Electronics'))
    } else if (filter === 'mechanical') {
      list = list.filter(
        (p) =>
          p.tags?.includes('Mechanical') && !p.tags?.includes('Electronics')
      )
    }

    if (sort === 'recent') {
      list.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime()
      )
    } else if (sort === 'starred') {
      list.sort((a, b) => (b.starCount ?? 0) - (a.starCount ?? 0))
    } else {
      // trending: starCount + copyCount
      list.sort(
        (a, b) =>
          (b.starCount ?? 0) +
          (b.copyCount ?? 0) -
          ((a.starCount ?? 0) + (a.copyCount ?? 0))
      )
    }

    return list
  }, [projects, search, sort, filter])

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < filtered.length

  const filterCounts: Record<string, number> = {
    all: projects.length,
    electronics: electronicsCount,
    mechanical: mechanicalCount,
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top search bar */}
      <div className="border-b border-[var(--c-g800)] bg-black px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-g600)]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--c-g900)] border border-[var(--c-g700)] rounded-lg text-sm text-white placeholder-[var(--c-g600)] focus:outline-none focus:border-[var(--c-g500)] transition-colors"
            />
          </div>
          <span className="text-xs text-[var(--c-g500)] shrink-0">
            {filtered.length} {t('blueprints')}
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{t('title')}</h1>
          <p className="text-sm text-[var(--c-g500)]">{t('subtitle')}</p>
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1">
          {(['trending', 'recent', 'starred'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                sort === s
                  ? 'bg-white text-black'
                  : 'text-[var(--c-g500)] hover:text-white hover:bg-[var(--c-g800)]'
              }`}
            >
              {t(`sort.${s}`)}
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--c-g800)] pb-0">
          {[
            { key: 'all', label: t('filter.all') },
            { key: 'electronics', label: t('filter.electronics') },
            { key: 'mechanical', label: t('filter.mechanical') },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key as typeof filter)
                setPage(1)
              }}
              className={`px-1 pb-3 text-xs font-bold border-b-2 transition-colors ${
                filter === key
                  ? 'border-white text-white'
                  : 'border-transparent text-[var(--c-g600)] hover:text-[var(--c-g400)]'
              }`}
            >
              {label}
              <span className="ml-1.5 text-[var(--c-g700)]">({filterCounts[key] ?? 0})</span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-[var(--c-g900)] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((project) => (
              <CommunityCard key={project.id} project={project} showTags />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-[var(--c-g600)]">
            <p className="text-sm">{t('noResults')}</p>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-6 py-2.5 border border-[var(--c-g700)] text-xs font-bold text-[var(--c-g400)] rounded-lg hover:border-[var(--c-g500)] hover:text-white transition-colors"
            >
              {t('loadMore')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
