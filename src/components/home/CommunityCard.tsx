'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { useCommunityStore } from '@/stores/communityStore'
import type { Project } from '@/types'

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-3 h-3">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

interface Props {
  project: Project
  showTags?: boolean
  showStatus?: boolean
}

export default function CommunityCard({ project, showTags = false, showStatus = false }: Props) {
  const [mounted, setMounted] = useState(false)
  const [copying, setCopying] = useState(false)
  const [justCopied, setJustCopied] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const { toggleFavorite, isFavorited, copyProject } = useCommunityStore()
  const favorited = mounted ? isFavorited(project.id) : false
  const baseStars = project.starCount ?? 0
  const effectiveStars = favorited ? baseStars + 1 : baseStars
  const copyCount = project.copyCount ?? 0

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
      if (result.success) setJustCopied(true)
      setTimeout(() => setJustCopied(false), 2500)
    } finally {
      setCopying(false)
    }
  }

  return (
    <Link
      href={`/project/${project.id}`}
      className="group block rounded-xl overflow-hidden border border-[var(--c-g800)] hover:border-[var(--c-g500)] transition-all bg-[var(--c-g950)]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-[var(--c-g900)] overflow-hidden">
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-15">⚙️</span>
          </div>
        )}

        {!imgLoaded && project.imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--c-g900)]">
            <span className="w-5 h-5 border-2 border-[var(--c-g600)] border-t-[var(--c-accent)] rounded-full animate-spin" />
          </div>
        )}

        {/* Tags */}
        {showTags && project.tags && project.tags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {project.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white/90 rounded font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Status badge */}
        {showStatus && project.status === 'published' && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-[9px] px-1.5 py-0.5 bg-green-500/95 text-black rounded font-bold">
              Published
            </span>
          </div>
        )}

        {/* Hover overlay buttons */}
        <div className="absolute top-2 right-2 hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFavorite}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border backdrop-blur-sm transition-all ${
              favorited
                ? 'bg-amber-500/95 border-amber-400 text-black'
                : 'bg-black/70 border-white/30 text-white/80 hover:bg-black/90 hover:border-white/50'
            }`}
          >
            <StarIcon filled={favorited} />
            <span>{effectiveStars}</span>
          </button>
          <button
            onClick={handleCopy}
            disabled={copying || justCopied}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border backdrop-blur-sm transition-all ${
              justCopied
                ? 'bg-green-500/95 border-green-400 text-black'
                : 'bg-black/70 border-white/30 text-white/80 hover:bg-black/90 hover:border-white/50'
            }`}
          >
            {copying ? (
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : justCopied ? (
              <CheckIcon />
            ) : (
              <CopyIcon />
            )}
            <span>{justCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-bold text-white truncate leading-tight">{project.name}</h3>
        <p className="text-[11px] text-[var(--c-g500)] line-clamp-2 leading-relaxed">{project.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-[var(--c-g600)]">
          <span>{project.parts?.length ?? 0} parts</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-3.5 h-3.5 rounded-full bg-[var(--c-g700)] flex items-center justify-center text-[8px] font-bold text-[var(--c-g400)] shrink-0">
              {(project.author ?? 'A')[0].toUpperCase()}
            </div>
            <span className="truncate max-w-[70px]">{project.author ?? 'Anonymous'}</span>
            <span>·</span>
            <span className="shrink-0">{timeAgo(project.createdAt ?? new Date().toISOString())}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
