'use client'

import { useState, useRef, useMemo } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { getCategoryColor, getCategoryLabel } from '@/lib/mockData'
import { streamGenerateBOM, type StreamingChunk, type BOMItem } from '@/lib/bailian'

export default function PartTab() {
  const { project, setProject } = useProjectStore()
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)

  // AI search state
  const [query, setQuery] = useState('')
  const [aiPhase, setAiPhase] = useState<StreamingChunk['phase']>('done')
  const [aiThinking, setAiThinking] = useState('')
  const [aiResults, setAiResults] = useState<BOMItem[]>([])
  const [aiError, setAiError] = useState('')
  const [addedParts, setAddedParts] = useState<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)

  if (!project) return <div className="p-8 text-[var(--c-g600)]">Loading...</div>

  const allParts = project.parts
  const searched = search
    ? allParts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
    : allParts
  const filtered = filter === 'all'
    ? searched
    : searched.filter(p => p.category === filter)

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'mcu', label: 'MCU' },
    { key: 'sensor', label: 'Sensor' },
    { key: 'actuator', label: 'Actuator' },
    { key: 'power', label: 'Power' },
    { key: 'module', label: 'Module' },
    { key: 'structural', label: 'Structural' },
    { key: 'enclosure', label: 'Enclosure' },
    { key: 'misc', label: 'Misc' },
  ]

  const handleSearch = () => {
    if (!query.trim()) return
    setAiPhase('thinking')
    setAiThinking('')
    setAiResults([])
    setAiError('')

    const apiKey = process.env.NEXT_PUBLIC_BAILIAN_API_KEY ?? ''
    abortRef.current = new AbortController()

    streamGenerateBOM(query, apiKey, (chunk: StreamingChunk) => {
      if (chunk.phase === 'thinking') {
        setAiPhase('thinking')
        setAiThinking(prev => prev + (chunk.thinking ?? ''))
      } else if (chunk.phase === 'parsing') {
        setAiPhase('parsing')
      } else if (chunk.phase === 'done') {
        setAiPhase('done')
        setAiResults(chunk.result?.items ?? [])
      } else if (chunk.phase === 'error') {
        setAiPhase('error')
        setAiError(chunk.error ?? 'Unknown error')
      }
    })
  }

  const addPartToProject = (item: BOMItem) => {
    if (!project) return
    const newPart = {
      id: `part-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: item.name,
      category: (item.category?.toLowerCase() ?? 'misc') as any,
      model: item.partNumber ?? item.name,
      description: item.description ?? '',
      qty: item.quantity ?? 1,
      unitCost: item.unitCost ?? 0,
    }
    setProject({
      ...project,
      parts: [...project.parts, newPart],
      totalCost: project.totalCost + (item.unitCost ?? 0) * (item.quantity ?? 1),
    })
    setAddedParts(prev => new Set([...prev, item.name]))
  }

  const isAdded = (name: string) => addedParts.has(name)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--c-g800)] bg-[var(--c-bg)]">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">PART</h2>
            <span className="text-xs px-2 py-0.5 bg-[var(--c-g800)] text-[var(--c-g400)] rounded-full">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-[var(--c-g700)] rounded-lg overflow-hidden">
              <button
                onClick={() => setView('table')}
                className={`px-3 py-1.5 text-[10px] font-bold transition-colors ${
                  view === 'table' ? 'bg-[var(--c-g200)] text-black' : 'text-[var(--c-g500)] hover:text-white'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setView('cards')}
                className={`px-3 py-1.5 text-[10px] font-bold transition-colors ${
                  view === 'cards' ? 'bg-[var(--c-g200)] text-black' : 'text-[var(--c-g500)] hover:text-white'
                }`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 px-6 pb-3">
          <div className="flex-1 max-w-72">
            <input
              type="text"
              placeholder="Search parts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-[var(--c-g900)] border border-[var(--c-g700)] text-xs text-white placeholder-[var(--c-g600)] focus:outline-none focus:border-[var(--c-g500)] rounded"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 bg-[var(--c-g900)] border border-[var(--c-g700)] text-xs text-[var(--c-g400)] focus:outline-none focus:border-[var(--c-g500)] rounded cursor-pointer"
          >
            {categories.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Find a Part — Hero search box */}
      <div className="shrink-0 border-b border-[var(--c-g800)] bg-[var(--c-g950)] px-6 py-5">
        <h3 className="text-sm font-bold text-white mb-1">Find a Part</h3>
        <p className="text-xs text-[var(--c-g600)] mb-4">
          Describe the component you need and we&apos;ll suggest options to add to your design.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. temperature sensor, stepper motor, M3 screws..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2.5 bg-[var(--c-g900)] border border-[var(--c-g700)] text-sm text-white placeholder-[var(--c-g600)] focus:outline-none focus:border-[var(--c-accent)] rounded-lg"
          />
          <button
            onClick={handleSearch}
            disabled={aiPhase === 'thinking' || aiPhase === 'parsing'}
            className="px-5 py-2.5 bg-[var(--c-accent)] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {aiPhase === 'thinking' ? '搜索中...' : aiPhase === 'parsing' ? '解析中...' : 'Search'}
          </button>
        </div>

        {/* AI thinking output */}
        {aiPhase === 'thinking' && (
          <div className="mt-3 p-3 border border-[var(--c-g800)] rounded-lg bg-[var(--c-g900)]">
            <p className="text-xs text-[var(--c-g500)] leading-relaxed">
              {aiThinking}
              <span className="inline-block w-1 h-3 bg-[var(--c-accent)] ml-1 animate-pulse" />
            </p>
          </div>
        )}

        {/* AI results */}
        {(aiPhase === 'done' || aiResults.length > 0) && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-bold text-[var(--c-g500)] uppercase tracking-wider">
              Suggested Parts ({aiResults.length})
            </p>
            {aiResults.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border border-[var(--c-g800)] rounded-lg hover:border-[var(--c-g700)] transition-colors bg-[var(--c-bg)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[var(--c-g800)] text-[var(--c-g500)] rounded">
                      ×{item.quantity}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[var(--c-g800)] text-[var(--c-g500)] rounded">
                      ${item.unitCost.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--c-g600)] leading-relaxed">{item.description}</p>
                  {item.supplier && (
                    <p className="text-[10px] text-[var(--c-g700)] mt-0.5">
                      {item.supplier} · {item.partNumber}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => addPartToProject(item)}
                  disabled={isAdded(item.name)}
                  className={`ml-4 shrink-0 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
                    isAdded(item.name)
                      ? 'bg-[var(--c-g800)] text-[var(--c-g600)] cursor-default'
                      : 'bg-[var(--c-accent)] text-black hover:opacity-90'
                  }`}
                >
                  {isAdded(item.name) ? 'Added' : '+ Add'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* AI error */}
        {aiPhase === 'error' && (
          <div className="mt-3 p-3 border border-red-900/50 bg-red-950/20 rounded-lg">
            <p className="text-xs text-red-400">{aiError}</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === 'table' ? (
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[var(--c-bg)]">
              <tr className="border-b border-[var(--c-g800)]">
                <th className="text-left p-3 font-bold text-[var(--c-g500)] w-1/3">Part</th>
                <th className="text-left p-3 font-bold text-[var(--c-g500)] w-20">Type</th>
                <th className="text-right p-3 font-bold text-[var(--c-g500)] w-12">Qty</th>
                <th className="text-right p-3 font-bold text-[var(--c-g500)] w-20">Unit</th>
                <th className="text-left p-3 font-bold text-[var(--c-g500)]">Source</th>
                <th className="text-right p-3 font-bold text-[var(--c-g500)] w-24">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((part) => (
                <tr
                  key={part.id}
                  onClick={() => setSelectedPartId(part.id === selectedPartId ? null : part.id)}
                  className={`border-b border-[var(--c-g800)] cursor-pointer transition-colors ${
                    selectedPartId === part.id
                      ? 'bg-[var(--c-g800)]'
                      : 'hover:bg-[var(--c-g900)]'
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-start gap-2.5">
                      <span
                        className="mt-1 shrink-0 w-2 h-2 rounded-full"
                        style={{ backgroundColor: getCategoryColor(part.category) }}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-white leading-tight">{part.name}</p>
                        <p className="text-[10px] text-[var(--c-g600)] mt-0.5 leading-tight">{part.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${getCategoryColor(part.category)}20`,
                        color: getCategoryColor(part.category),
                      }}
                    >
                      {getCategoryLabel(part.category)}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium text-[var(--c-g300)]">×{part.qty}</td>
                  <td className="p-3 text-right text-[var(--c-g500)]">${part.unitCost.toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.amazon.com/s?k=${encodeURIComponent(part.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                      >
                        Search on Amazon
                      </a>
                      <button className="text-[10px] text-[var(--c-accent)] hover:text-[var(--c-accent)]/80 underline">
                        Research part
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold text-white">${(part.unitCost * part.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((part) => (
              <div
                key={part.id}
                onClick={() => setSelectedPartId(part.id === selectedPartId ? null : part.id)}
                className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                  selectedPartId === part.id
                    ? 'border-[var(--c-accent)] bg-[var(--c-g900)]'
                    : 'border-[var(--c-g800)] hover:border-[var(--c-g700)] bg-[var(--c-g950)]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: getCategoryColor(part.category) }}
                    />
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${getCategoryColor(part.category)}20`,
                        color: getCategoryColor(part.category),
                      }}
                    >
                      {getCategoryLabel(part.category)}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--c-g600)]">×{part.qty}</span>
                </div>
                <p className="font-semibold text-white text-sm mb-1">{part.name}</p>
                <p className="text-[11px] text-[var(--c-g600)] mb-3 leading-relaxed">{part.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-[var(--c-g500)]">${part.unitCost.toFixed(2)}</span>
                    <span className="text-[var(--c-g700)] mx-1">·</span>
                    <span className="font-bold text-white">${(part.unitCost * part.qty).toFixed(2)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button className="text-[10px] text-blue-400 hover:text-blue-300">Amazon</button>
                    <button className="text-[10px] text-[var(--c-accent)] hover:text-[var(--c-accent)]/80">Research</button>
                  </div>
                </div>
                {part.printSpecs && (
                  <div className="mt-2 pt-2 border-t border-[var(--c-g800)] text-[10px] text-[var(--c-g600)]">
                    🖨️ {part.printSpecs.material} · {part.printSpecs.layerHeight} · {part.printSpecs.infill}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
