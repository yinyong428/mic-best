'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { getCategoryColor } from '@/lib/mockData'

export default function PartsList() {
  const { project, selectedPartId, selectPart, partsListCollapsed, togglePartsList } =
    useProjectStore()
  const [searchQuery, setSearchQuery] = useState('')

  if (!project) return null

  const filteredParts = project.parts.filter((part) =>
    part.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside
      className={`border-r border-[var(--c-g800)] bg-[var(--c-bg)] flex flex-col transition-all ${
        partsListCollapsed ? 'w-12' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="h-12 border-b border-[var(--c-g800)] flex items-center px-3 shrink-0">
        {!partsListCollapsed && (
          <div className="flex-1 flex items-center gap-2">
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
              className="text-[var(--c-g400)]"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--c-g400)]">
              Parts List
            </span>
          </div>
        )}
        <button
          onClick={togglePartsList}
          className="p-1 hover:bg-[var(--c-g800)] rounded transition-colors"
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
            className={`text-[var(--c-g500)] transition-transform ${
              partsListCollapsed ? 'rotate-180' : ''
            }`}
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>

      {!partsListCollapsed && (
        <>
          {/* Search */}
          <div className="p-2 border-b border-[var(--c-g800)]">
            <input
              type="text"
              placeholder="Search parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--c-input-bg)] border border-[var(--c-g700)] text-sm placeholder-[var(--c-g600)] focus:border-[var(--c-text)] focus:outline-none"
            />
          </div>

          {/* Parts list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-1">
              {filteredParts.map((part) => (
                <button
                  key={part.id}
                  onClick={() => selectPart(part.id === selectedPartId ? null : part.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    selectedPartId === part.id
                      ? 'bg-[var(--c-g800)] border-l-2 border-[var(--c-accent)]'
                      : 'hover:bg-[var(--c-g800)]'
                  }`}
                >
                  {/* Category dot */}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryColor(part.category) }}
                  />
                  <span className="text-sm truncate">{part.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer - part count */}
          <div className="p-3 border-t border-[var(--c-g800)] text-xs text-[var(--c-g600)]">
            {filteredParts.length} parts
          </div>
        </>
      )}
    </aside>
  )
}
