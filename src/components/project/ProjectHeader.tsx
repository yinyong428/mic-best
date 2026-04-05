'use client'

import Link from 'next/link'
import { useProjectStore } from '@/stores/projectStore'
import type { ProjectTab } from '@/types'

const tabs: { id: ProjectTab; label: string }[] = [
  { id: 'info', label: 'INFO' },
  { id: 'bom', label: 'BOM' },
  { id: 'wiring', label: 'WIRING' },
  { id: 'mech', label: 'MECH' },
  { id: 'instructions', label: 'INSTRUCTIONS' },
  { id: 'part', label: 'PART' },
]

export default function ProjectHeader() {
  const { project, activeTab, setTab } = useProjectStore()

  if (!project) {
    return (
      <header className="h-14 border-b border-[var(--c-g800)] bg-black flex items-center px-4 shrink-0">
        <div className="animate-pulse text-[var(--c-g600)]">Loading...</div>
      </header>
    )
  }

  return (
    <header className="h-14 border-b border-[var(--c-g800)] bg-black flex items-center px-4 shrink-0 z-20">
      {/* Left - Back + Project name */}
      <div className="flex flex-1 items-center min-w-0">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        </Link>
        <h2 className="font-bold text-white text-sm tracking-widest uppercase truncate max-w-[320px]">
          {project.name}
        </h2>
      </div>

      {/* Center - Tab buttons */}
      <div className="flex shrink-0 items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            style={{ marginLeft: '-1px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right - Actions */}
      <div className="flex flex-1 items-center justify-end gap-2 shrink-0">
        {/* Status badge */}
        <span className="text-xs font-bold uppercase bg-[var(--c-accent)] text-black px-2 py-1">
          {project.status}
        </span>

        {/* Download */}
        <button className="btn-secondary text-xs flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          ZIP
        </button>
      </div>
    </header>
  )
}
