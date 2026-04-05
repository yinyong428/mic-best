'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { communityProjects } from '@/lib/mockData'
import { useCommunityStore } from '@/stores/communityStore'

// Inline SVG icons to match Blueprint's minimal aesthetic
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      className="w-4 h-4"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-4 h-4"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="w-4 h-4"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function CommunityProjects() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Community Projects</h2>
        <button className="btn-secondary text-xs">More</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {communityProjects.map((project) => (
          <CommunityCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  )
}

function CommunityCard({ project }: { project: (typeof communityProjects)[0] }) {
  const [mounted, setMounted] = useState(false)
  const [copying, setCopying] = useState(false)
  const [justCopied, setJustCopied] = useState(false)

  // Wait for client-side hydration before reading persisted state
  useEffect(() => {
    setMounted(true)
  }, [])

  const { toggleFavorite, isFavorited, starCounts, copyProject } =
    useCommunityStore()

  const favorited = mounted ? isFavorited(project.id) : false
  const starCount = starCounts[project.id] ?? 0
  const effectiveCount = favorited ? starCount + 1 : starCount

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(project.id)
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (copying || justCopied) return

    setCopying(true)
    try {
      const result = await copyProject(project.id)
      if (result.success) {
        setJustCopied(true)
        setTimeout(() => {
          setJustCopied(false)
        }, 2500)
      }
    } finally {
      setCopying(false)
    }
  }

  return (
    <Link
      href={`/project/${project.id}`}
      className="group block border border-[var(--c-g700)] hover:border-[var(--c-g500)] transition-all"
    >
      {/* Preview placeholder */}
      <div className="relative aspect-video bg-[var(--c-g900)] flex items-center justify-center overflow-hidden">
        <div className="text-4xl opacity-30 group-hover:opacity-50 transition-opacity">
          ⚙️
        </div>

        {/* Action buttons overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Star / Favorite button */}
          <button
            onClick={handleFavorite}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border transition-all ${
              favorited
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30'
                : 'bg-black/60 border-white/20 text-white/70 hover:bg-black/80 hover:border-white/40'
            }`}
          >
            <StarIcon filled={favorited} />
            <span>{effectiveCount}</span>
          </button>

          {/* Copy / Fork button */}
          <button
            onClick={handleCopy}
            disabled={copying || justCopied}
            title={justCopied ? 'Copied!' : 'Copy to my projects'}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border transition-all ${
              justCopied
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'bg-black/60 border-white/20 text-white/70 hover:bg-black/80 hover:border-white/40'
            }`}
          >
            {copying ? (
              <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
            ) : justCopied ? (
              <CheckIcon />
            ) : (
              <CopyIcon />
            )}
            <span>{justCopied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Mobile: always show buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 sm:hidden">
          <button
            onClick={handleFavorite}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${
              favorited
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-black/60 border-white/20 text-white/70'
            }`}
          >
            <StarIcon filled={favorited} />
            <span>{effectiveCount}</span>
          </button>
          <button
            onClick={handleCopy}
            disabled={copying || justCopied}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${
              justCopied
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'bg-black/60 border-white/20 text-white/70'
            }`}
          >
            {copying ? (
              <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
            ) : justCopied ? (
              <CheckIcon />
            ) : (
              <CopyIcon />
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-bold text-sm truncate">{project.name}</h3>
        <p className="text-xs text-[var(--c-g500)] line-clamp-2">
          {project.description}
        </p>
        <div className="flex items-center justify-between text-xs text-[var(--c-g600)]">
          <span>{project.parts?.length || 'Multiple'} parts</span>
          <span>${project.totalCost.toFixed(0)}</span>
        </div>
        <p className="text-xs text-[var(--c-g600)]">by {project.author}</p>
      </div>
    </Link>
  )
}
