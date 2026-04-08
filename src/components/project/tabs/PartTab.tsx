'use client'

import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { getCategoryColor, getCategoryLabel } from '@/lib/mockData'
import { streamGenerateBOM, type StreamingChunk, type BOMItem } from '@/lib/bailian'
import type { LCSCPart } from '@/lib/lcsc'
import PartViewer3D from '@/components/project/PartViewer3D'
import type { Part } from '@/types'

export default function PartTab() {
  const { project, setProject } = useProjectStore()
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [viewerPart, setViewerPart] = useState<Part | null>(null)

  // Close viewer on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setViewerPart(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Search mode: 'ai' | 'lcsc'
  const [searchMode, setSearchMode] = useState<'ai' | 'lcsc'>('ai')

  // AI search state
  const [aiQuery, setAiQuery] = useState('')
  const [aiPhase, setAiPhase] = useState<StreamingChunk['phase']>('done')
  const [aiThinking, setAiThinking] = useState('')
  const [aiResults, setAiResults] = useState<BOMItem[]>([])
  const [aiError, setAiError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // LCSC search state
  const [lcscQuery, setLcscQuery] = useState('')
  const [lcscCategory, setLcscCategory] = useState('all')
  const [lcscResults, setLcscResults] = useState<LCSCPart[]>([])
  const [lcscLoading, setLcscLoading] = useState(false)
  const [lcscError, setLcscError] = useState('')

  const allParts = project?.parts ?? []
  const searched = search
    ? allParts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    : allParts
  const filtered = filter === 'all' ? searched : searched.filter(p => p.category === filter)

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

  // ─── AI Search ─────────────────────────────────────────────────────────────

  const handleAiSearch = () => {
    if (!aiQuery.trim()) return
    setAiPhase('thinking')
    setAiThinking('')
    setAiResults([])
    setAiError('')

    const apiKey = process.env.NEXT_PUBLIC_BAILIAN_API_KEY ?? ''
    abortRef.current = new AbortController()

    streamGenerateBOM(aiQuery, apiKey, (chunk: StreamingChunk) => {
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

  // ─── LCSC Search ───────────────────────────────────────────────────────────

  const handleLcscSearch = useCallback(async () => {
    if (!lcscQuery.trim() && lcscCategory === 'all') return
    setLcscLoading(true)
    setLcscError('')
    setLcscResults([])

    try {
      const params = new URLSearchParams()
      if (lcscQuery.trim()) params.set('q', lcscQuery)
      if (lcscCategory !== 'all') params.set('category', lcscCategory)

      const res = await fetch(`/api/lcsc?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      setLcscResults(data.parts ?? [])
    } catch (err: any) {
      setLcscError(err.message ?? 'Search failed')
    } finally {
      setLcscLoading(false)
    }
  }, [lcscQuery, lcscCategory])

  // ─── Add to BOM ─────────────────────────────────────────────────────────────

  const addToBom = (item: BOMItem | LCSCPart, source: 'ai' | 'lcsc') => {
    if (!project) return

    const isLCSC = source === 'lcsc'
    const lcscPart = isLCSC ? (item as LCSCPart) : null
    const aiItem = !isLCSC ? (item as BOMItem) : null

    const name = isLCSC ? lcscPart!.description.split(',')[0] : aiItem!.name
    const qty = isLCSC ? 1 : (aiItem!.quantity ?? 1)
    const unitCost = isLCSC ? lcscPart!.price1 : (aiItem!.unitCost ?? 0)
    const cat = isLCSC ? (lcscPart!.category as any) : (aiItem!.category?.toLowerCase() ?? 'misc')

    const newPart = {
      id: `part-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      category: cat,
      model: isLCSC ? lcscPart!.partNumber : (aiItem!.partNumber ?? name),
      description: isLCSC ? lcscPart!.description : (aiItem!.description ?? ''),
      qty,
      unitCost,
      lcscId: isLCSC ? lcscPart!.lcscId : (aiItem!.lcscId ?? undefined),
      hqPartNumber: isLCSC ? undefined : (aiItem!.hqPartNumber ?? undefined),
      imageUrl: isLCSC ? lcscPart!.imageUrl : undefined,
    }

    setProject({
      ...project,
      parts: [...project.parts, newPart],
      totalCost: project.totalCost + unitCost * qty,
    })
  }

  const isAdded = (identifier: string, source: 'ai' | 'lcsc') => {
    return allParts.some(p =>
      source === 'lcsc'
        ? p.lcscId === identifier
        : p.name === identifier || p.model === identifier
    )
  }

  if (!project) return <div className="p-8 text-[var(--c-g600)]">Loading...</div>

  // ─── Render ─────────────────────────────────────────────────────────────────

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

        <div className="flex items-center gap-3 px-6 pb-3">
          <div className="flex-1 max-w-72">
            <input
              type="text"
              placeholder="Search parts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-[var(--c-g900)] border border-[var(--c-g700)] text-xs text-white placeholder-[var(--c-g600)] focus:outline-none focus:border-[var(--c-g500)] rounded"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-1.5 bg-[var(--c-g900)] border border-[var(--c-g700)] text-xs text-[var(--c-g400)] focus:outline-none focus:border-[var(--c-g500)] rounded cursor-pointer"
          >
            {categories.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Find a Part — Search Mode Tabs */}
      <div className="shrink-0 border-b border-[var(--c-g800)] bg-[var(--c-g950)] px-6 pt-4 pb-0">
        <div className="flex items-center gap-1 mb-4">
          <h3 className="text-sm font-bold text-white mr-3">Find a Part</h3>
          {/* Mode toggle */}
          <div className="flex border border-[var(--c-g700)] rounded-lg overflow-hidden">
            <button
              onClick={() => setSearchMode('ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-colors ${
                searchMode === 'ai'
                  ? 'bg-[var(--c-accent)] text-black'
                  : 'text-[var(--c-g500)] hover:text-white hover:bg-[var(--c-g800)]'
              }`}
            >
              <span>🤖</span> AI Search
            </button>
            <button
              onClick={() => setSearchMode('lcsc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-colors ${
                searchMode === 'lcsc'
                  ? 'bg-[#22c55e] text-black'
                  : 'text-[var(--c-g500)] hover:text-white hover:bg-[var(--c-g800)]'
              }`}
            >
              <span>📦</span> LCSC Catalog
            </button>
          </div>
        </div>

        {/* AI Search Panel */}
        {searchMode === 'ai' && (
          <div className="pb-4">
            <p className="text-xs text-[var(--c-g600)] mb-3">
              Describe the component you need and AI will suggest options from the BOM database.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. temperature sensor with I2C, stepper motor NEMA 17..."
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
                className="flex-1 px-4 py-2.5 bg-[var(--c-g900)] border border-[var(--c-g700)] text-sm text-white placeholder-[var(--c-g600)] focus:outline-none focus:border-[var(--c-accent)] rounded-lg"
              />
              <button
                onClick={handleAiSearch}
                disabled={aiPhase === 'thinking' || aiPhase === 'parsing'}
                className="px-5 py-2.5 bg-[var(--c-accent)] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {aiPhase === 'thinking' ? '搜索中…' : aiPhase === 'parsing' ? '解析中…' : '🔍 Search'}
              </button>
            </div>

            {aiPhase === 'thinking' && (
              <div className="mt-3 p-3 border border-[var(--c-g800)] rounded-lg bg-[var(--c-g900)]">
                <p className="text-xs text-[var(--c-g500)] leading-relaxed">
                  {aiThinking}
                  <span className="inline-block w-1 h-3 bg-[var(--c-accent)] ml-1 animate-pulse" />
                </p>
              </div>
            )}

            {(aiPhase === 'done' || aiResults.length > 0) && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold text-[var(--c-g500)] uppercase tracking-wider">
                  🤖 AI Suggestions ({aiResults.length})
                </p>
                {aiResults.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border border-[var(--c-g800)] rounded-lg hover:border-[var(--c-g700)] transition-colors bg-[var(--c-bg)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--c-g800)] text-[var(--c-g500)] rounded">×{item.quantity}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--c-g800)] text-[var(--c-g500)] rounded">
                          ${item.unitCost.toFixed(2)}
                        </span>
                        {item.lcscId && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#22c55e]/20 text-[#22c55e] rounded font-mono">
                            LCSC {item.lcscId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--c-g600)] leading-relaxed">{item.description}</p>
                    </div>
                    <button
                      onClick={() => addToBom(item, 'ai')}
                      disabled={isAdded(item.name, 'ai')}
                      className={`ml-4 shrink-0 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
                        isAdded(item.name, 'ai')
                          ? 'bg-[var(--c-g800)] text-[var(--c-g600)] cursor-default'
                          : 'bg-[var(--c-accent)] text-black hover:opacity-90'
                      }`}
                    >
                      {isAdded(item.name, 'ai') ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {aiPhase === 'error' && (
              <div className="mt-3 p-3 border border-red-900/50 bg-red-950/20 rounded-lg">
                <p className="text-xs text-red-400">{aiError}</p>
              </div>
            )}
          </div>
        )}

        {/* LCSC Search Panel */}
        {searchMode === 'lcsc' && (
          <div className="pb-4">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs text-[var(--c-g600)]">
                Search real-time LCSC inventory. Prices in USD.
              </p>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#22c55e]/20 text-[#22c55e] rounded font-bold">
                LIVE
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. ESP32, STM32, OLED, HC-SR04..."
                value={lcscQuery}
                onChange={e => setLcscQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLcscSearch()}
                className="flex-1 px-4 py-2.5 bg-[var(--c-g900)] border border-[var(--c-g700)] text-sm text-white placeholder-[var(--c-g600)] focus:outline-none focus:border-[#22c55e] rounded-lg"
              />
              <select
                value={lcscCategory}
                onChange={e => setLcscCategory(e.target.value)}
                className="px-3 py-2.5 bg-[var(--c-g900)] border border-[var(--c-g700)] text-xs text-[var(--c-g400)] focus:outline-none focus:border-[#22c55e] rounded cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="mcu">MCU</option>
                <option value="sensor">Sensor</option>
                <option value="actuator">Actuator</option>
                <option value="power">Power</option>
                <option value="module">Module</option>
                <option value="structural">Structural</option>
                <option value="enclosure">Enclosure</option>
              </select>
              <button
                onClick={handleLcscSearch}
                disabled={lcscLoading}
                className="px-5 py-2.5 bg-[#22c55e] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {lcscLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>🔍 Search LCSC</>
                )}
              </button>
            </div>

            {lcscLoading && (
              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--c-g500)]">
                <div className="w-4 h-4 border-2 border-[var(--c-g600)] border-t-[#22c55e] rounded-full animate-spin" />
                Querying LCSC catalog…
              </div>
            )}

            {lcscError && (
              <div className="mt-3 p-3 border border-red-900/50 bg-red-950/20 rounded-lg">
                <p className="text-xs text-red-400">{lcscError}</p>
              </div>
            )}

            {lcscResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-bold text-[#22c55e] uppercase tracking-wider">
                  📦 LCSC Results ({lcscResults.length})
                </p>
                {lcscResults.map(part => (
                  <div
                    key={part.lcscId}
                    className="flex items-center justify-between p-3 border border-[var(--c-g800)] rounded-lg hover:border-[#22c55e]/40 transition-colors bg-[var(--c-bg)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-white">{part.partNumber}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${getCategoryColor(part.category)}20`,
                            color: getCategoryColor(part.category),
                          }}
                        >
                          {getCategoryLabel(part.category)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--c-g800)] text-[var(--c-g500)] rounded font-mono">
                          C{part.lcscId}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          part.stock > 1000
                            ? 'bg-[#22c55e]/20 text-[#22c55e]'
                            : part.stock > 100
                            ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                            : 'bg-[#ef4444]/20 text-[#ef4444]'
                        }`}>
                          {part.stock.toLocaleString()} in stock
                        </span>
                      </div>
                      <p className="text-xs text-[var(--c-g600)] leading-relaxed mb-1">{part.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-[var(--c-g500)]">
                        <span>{part.package}</span>
                        <span>·</span>
                        <span>{part.manufacturer}</span>
                        <span>·</span>
                        <span className="text-[var(--c-g600)]">MOQ: {part.minimumOrder}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-white">
                          ${part.price1.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[var(--c-g600)]">/unit</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--c-g800)] text-[var(--c-g500)] rounded">
                          10+ ${part.price10.toFixed(2)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--c-g800)] text-[var(--c-g500)] rounded">
                          100+ ${part.price100.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
                      <a
                        href={part.datasheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                      >
                        📄 Datasheet
                      </a>
                      <button
                        onClick={() => addToBom(part, 'lcsc')}
                        disabled={isAdded(part.lcscId, 'lcsc')}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
                          isAdded(part.lcscId, 'lcsc')
                            ? 'bg-[var(--c-g800)] text-[var(--c-g600)] cursor-default'
                            : 'bg-[#22c55e] text-black hover:opacity-90'
                        }`}
                      >
                        {isAdded(part.lcscId, 'lcsc') ? '✓ Added' : '+ Add to BOM'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!lcscLoading && lcscResults.length === 0 && !lcscError && (
              <div className="mt-4 text-xs text-[var(--c-g600)] flex items-center gap-2">
                <span>💡</span>
                Try searching for: ESP32, HC-SR04, DHT22, SG90, OLED SSD1306, NEMA 17, LM2596, 18650…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content — Parts Table/Cards */}
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
              {filtered.map(part => (
                <tr
                  key={part.id}
                  onClick={() => setSelectedPartId(part.id === selectedPartId ? null : part.id)}
                  className={`border-b border-[var(--c-g800)] cursor-pointer transition-colors ${
                    selectedPartId === part.id ? 'bg-[var(--c-g800)]' : 'hover:bg-[var(--c-g900)]'
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
                        {part.lcscId && (
                          <span className="inline-block mt-0.5 text-[9px] px-1 py-0.5 bg-[#22c55e]/15 text-[#22c55e] rounded font-mono">
                            LCSC {part.lcscId}
                          </span>
                        )}
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
                    <div className="flex flex-col gap-0.5">
                      {part.lcscId ? (
                        <a
                          href={`https://www.lcsc.com/product-detail/${part.lcscId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#22c55e] hover:text-[#22c55e]/80 underline"
                        >
                          LCSC C{part.lcscId}
                        </a>
                      ) : (
                        <a
                          href={`https://www.amazon.com/s?k=${encodeURIComponent(part.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                        >
                          Search on Amazon
                        </a>
                      )}
                      <button
                        onClick={() => setViewerPart(part)}
                        className="text-[10px] text-[var(--c-accent)] hover:text-[var(--c-accent)]/80 underline text-left"
                      >
                        View 3D
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
            {filtered.map(part => (
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
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewerPart(part)}
                      className="text-[10px] px-2 py-1 bg-[var(--c-g800)] hover:bg-[var(--c-g700)] text-[var(--c-g400)] rounded transition-colors"
                    >
                      View 3D
                    </button>
                    {part.lcscId ? (
                      <a
                        href={`https://www.lcsc.com/product-detail/${part.lcscId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] px-2 py-1 bg-[#22c55e]/15 hover:bg-[#22c55e]/25 text-[#22c55e] rounded transition-colors"
                      >
                        LCSC →
                      </a>
                    ) : (
                      <button className="text-[10px] text-blue-400 hover:text-blue-300">Research →</button>
                    )}
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

      {/* 3D Part Viewer Modal */}
      {viewerPart && (
        <PartViewer3D part={viewerPart} onClose={() => setViewerPart(null)} />
      )}
    </div>
  )
}
