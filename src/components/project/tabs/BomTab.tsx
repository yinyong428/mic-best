'use client'

import { useState, useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { getCategoryColor, getCategoryLabel } from '@/lib/mockData'
import type { Part } from '@/types'

/** Get LCSC product image URL from part ID */
function getLcscImageUrl(lcscId: string): string {
  if (!lcscId) return ''
  // LCSC image CDN pattern: https://image.lcsc.com/images/lcsc/{category}/{id}_1.jpg
  // Fallback to direct pattern without category
  return `https://image.lcsc.com/images/lcsc/${lcscId}_1.jpg`
}

/** Category-based placeholder icon SVG */
function PartPlaceholderIcon({ category }: { category: string }) {
  const iconMap: Record<string, string> = {
    mcu: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
    sensor: 'M12 22a8 8 0 01-8-8c0-4.314 3.686-8 8-8s8 3.686 8 8-3.686 8-8 8zM12 12v.01',
    actuator: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h4',
    power: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    module: 'M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-14a2 2 0 00-2-2z',
    enclosure: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    structural: 'M4 20L10 4l6 16M7 15h10',
    misc: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  }
  const path = iconMap[category] || iconMap.misc
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[var(--c-g600)]">
      <path d={path} />
    </svg>
  )
}

interface PartImageProps {
  part: Part
}

function PartImage({ part }: PartImageProps) {
  const [imgSrc, setImgSrc] = useState('')
  const [imgError, setImgError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setImgError(false)
    setLoaded(false)
    if (part.lcscId) {
      setImgSrc(getLcscImageUrl(part.lcscId))
    } else if (part.imageUrl) {
      setImgSrc(part.imageUrl)
    } else {
      setImgSrc('')
    }
  }, [part.lcscId, part.imageUrl])

  if (!imgSrc || imgError) {
    return (
      <div className="w-12 h-12 rounded-lg bg-[var(--c-g900)] flex items-center justify-center shrink-0">
        <PartPlaceholderIcon category={part.category} />
      </div>
    )
  }

  return (
    <div className="w-12 h-12 rounded-lg bg-[var(--c-g900)] flex items-center justify-center shrink-0 overflow-hidden">
      {!loaded && <PartPlaceholderIcon category={part.category} />}
      <img
        src={imgSrc}
        alt={part.name}
        className={`w-full h-full object-contain p-1 transition-opacity ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setImgError(true)}
      />
    </div>
  )
}

export default function BomTab() {
  const { project, bomFilter, setBomFilter, bomView, setBomView } = useProjectStore()
  const [partSearch, setPartSearch] = useState('')

  if (!project) return <div className="p-8 text-[var(--c-g600)]">Loading...</div>

  const electricalParts = project.parts.filter((p) =>
    ['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category)
  )
  const mechanicalParts = project.parts.filter((p) =>
    !['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category)
  )

  const filterCounts = {
    all: project.parts.length,
    electrical: electricalParts.length,
    mechanical: mechanicalParts.length,
  }

  const filteredParts =
    bomFilter === 'all'
      ? project.parts
      : bomFilter === 'electrical'
      ? electricalParts
      : mechanicalParts

  const searchedParts = partSearch
    ? filteredParts.filter((p) => p.name.toLowerCase().includes(partSearch.toLowerCase()))
    : filteredParts

  const electricalCost = electricalParts.reduce((sum, p) => sum + p.unitCost * p.qty, 0)
  const mechanicalCost = mechanicalParts.reduce((sum, p) => sum + p.unitCost * p.qty, 0)
  const totalCost = searchedParts.reduce((sum, p) => sum + p.unitCost * p.qty, 0)

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky header */}
        <div className="shrink-0 border-b border-[var(--c-g800)] bg-[var(--c-bg)]">
          {/* Title row */}
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-white">Bill of Materials</h2>
              <span className="text-xs px-2 py-0.5 bg-[var(--c-g800)] text-[var(--c-g400)] rounded-full">
                {searchedParts.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center border border-[var(--c-g700)] rounded-lg overflow-hidden mr-2">
                <button
                  onClick={() => setBomView('table')}
                  className={`px-3 py-1.5 text-[10px] font-bold transition-colors ${
                    bomView === 'table'
                      ? 'bg-[var(--c-g200)] text-black'
                      : 'text-[var(--c-g500)] hover:text-white'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setBomView('cards')}
                  className={`px-3 py-1.5 text-[10px] font-bold transition-colors ${
                    bomView === 'cards'
                      ? 'bg-[var(--c-g200)] text-black'
                      : 'text-[var(--c-g500)] hover:text-white'
                  }`}
                >
                  Cards
                </button>
              </div>
              <span className="text-xs text-[var(--c-g500)]">
                <span className="font-medium text-white">{project.parts.length} items</span>
                <span className="mx-1">·</span>
                <span className="font-medium text-white">${project.totalCost.toFixed(2)}</span>
                <span className="ml-1">total</span>
              </span>
            </div>
          </div>

          {/* Search + Category filters */}
          <div className="flex items-center gap-3 px-6 pb-3">
            <div className="flex-1 max-w-64">
              <input
                type="text"
                placeholder="Search parts..."
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-[var(--c-g900)] border border-[var(--c-g700)] text-xs text-white placeholder-[var(--c-g600)] focus:outline-none focus:border-[var(--c-g500)] rounded"
              />
            </div>
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'All', count: filterCounts.all },
                { key: 'electrical', label: 'Electrical', count: electricalParts.length, cost: electricalCost },
                { key: 'mechanical', label: 'Mechanical', count: mechanicalParts.length, cost: mechanicalCost },
              ].map(({ key, label, count, cost }) => (
                <button
                  key={key}
                  onClick={() => setBomFilter(key as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap ${
                    bomFilter === key
                      ? 'bg-white text-black border-white'
                      : 'border-[var(--c-g700)] text-[var(--c-g500)] hover:border-[var(--c-g500)]'
                  }`}
                >
                  <span>{label}</span>
                  <span className={bomFilter === key ? 'text-black/60' : 'text-[var(--c-g600)]'}>{count}</span>
                  {cost !== undefined && (
                    <span className={bomFilter === key ? 'text-black/60' : 'text-[var(--c-g600)]'}>${cost.toFixed(0)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto">
          {bomView === 'table' ? (
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-[var(--c-bg)]">
                <tr className="border-b border-[var(--c-g800)]">
                  <th className="text-left p-3 font-bold text-[var(--c-g500)] w-12">Img</th>
                  <th className="text-left p-3 font-bold text-[var(--c-g500)] w-1/3">Part</th>
                  <th className="text-left p-3 font-bold text-[var(--c-g500)] w-20">Type</th>
                  <th className="text-right p-3 font-bold text-[var(--c-g500)] w-12">Qty</th>
                  <th className="text-right p-3 font-bold text-[var(--c-g500)] w-20">Unit</th>
                  <th className="text-left p-3 font-bold text-[var(--c-g500)]">Source</th>
                  <th className="text-right p-3 font-bold text-[var(--c-g500)] w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {searchedParts.map((part) => (
                  <tr
                    key={part.id}
                    className="border-b border-[var(--c-g800)] hover:bg-[var(--c-g900)] transition-colors group"
                  >
                    <td className="p-3">
                      <PartImage part={part} />
                    </td>
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
                      <div className="flex flex-col gap-1">
                        <a
                          href={`https://www.lcsc.com/search?keyword=${encodeURIComponent(part.lcscId || part.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[var(--c-lcsc)] hover:text-[var(--c-lcsc)]/80 underline"
                        >
                          LCSC {part.lcscId ? `· ${part.lcscId}` : ''}
                        </a>
                        <a
                          href={`https://www.1688.com/chanpin/-${encodeURIComponent(part.name)}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[var(--c-ali)] hover:text-[var(--c-ali)]/80 underline"
                        >
                          1688 批发
                        </a>
                        <a
                          href={`https://www.jd.com/search?keyword=${encodeURIComponent(part.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[var(--c-jd)] hover:text-[var(--c-jd)]/80 underline"
                        >
                          京东
                        </a>
                        <a
                          href={`https://www.hqbuy.com/search?keyword=${encodeURIComponent(part.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[var(--c-hqbuy)] hover:text-[var(--c-hqbuy)]/80 underline"
                        >
                          华强北
                        </a>
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-white">${(part.unitCost * part.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-[var(--c-bg)] border-t border-[var(--c-g700)]">
                <tr>
                  <td className="p-3 font-bold text-white" colSpan={6}>
                    Total ({searchedParts.length} items)
                  </td>
                  <td className="p-3 text-right font-bold text-[var(--c-accent)] text-sm">
                    ${totalCost.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            /* Cards view */
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchedParts.map((part) => (
                <div
                  key={part.id}
                  className="border border-[var(--c-g800)] rounded-xl p-4 hover:border-[var(--c-g700)] transition-colors bg-[var(--c-g950)] flex flex-col"
                >
                  {/* Image + meta row */}
                  <div className="flex items-start gap-3 mb-3">
                    <PartImage part={part} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2 h-2 rounded-full"
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
                        <span className="text-[10px] text-[var(--c-g600)] ml-auto">×{part.qty}</span>
                      </div>
                      <p className="font-semibold text-white text-sm leading-tight">{part.name}</p>
                      {part.lcscId && (
                        <p className="text-[9px] text-[var(--c-lcsc)] mt-0.5">LCSC {part.lcscId}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--c-g600)] mb-3 leading-relaxed line-clamp-2">{part.description}</p>

                  <div className="mt-auto flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-[var(--c-g500)]">${part.unitCost.toFixed(2)}</span>
                        <span className="text-[var(--c-g700)] mx-1">·</span>
                        <span className="font-bold text-white">${(part.unitCost * part.qty).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <a
                        href={`https://www.lcsc.com/search?keyword=${encodeURIComponent(part.lcscId || part.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-center px-1 py-0.5 rounded bg-[var(--c-lcsc)]/10 text-[var(--c-lcsc)] hover:bg-[var(--c-lcsc)]/20 border border-[var(--c-lcsc)]/20"
                      >
                        LCSC {part.lcscId ? part.lcscId.slice(0, 8) : ''}
                      </a>
                      <a
                        href={`https://www.1688.com/chanpin/-${encodeURIComponent(part.name)}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-center px-1 py-0.5 rounded bg-[var(--c-ali)]/10 text-[var(--c-ali)] hover:bg-[var(--c-ali)]/20 border border-[var(--c-ali)]/20"
                      >
                        1688
                      </a>
                      <a
                        href={`https://www.jd.com/search?keyword=${encodeURIComponent(part.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-center px-1 py-0.5 rounded bg-[var(--c-jd)]/10 text-[var(--c-jd)] hover:bg-[var(--c-jd)]/20 border border-[var(--c-jd)]/20"
                      >
                        京东
                      </a>
                      <a
                        href={`https://www.hqbuy.com/search?keyword=${encodeURIComponent(part.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-center px-1 py-0.5 rounded bg-[var(--c-hqbuy)]/10 text-[var(--c-hqbuy)] hover:bg-[var(--c-hqbuy)]/20 border border-[var(--c-hqbuy)]/20"
                      >
                        华强北
                      </a>
                    </div>
                  </div>

                  {part.printSpecs && (
                    <div className="mt-2 pt-2 border-t border-[var(--c-g800)] text-[10px] text-[var(--c-g600)]">
                      {part.printSpecs.material} · {part.printSpecs.layerHeight} · {part.printSpecs.infill}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar - Parts List */}
      <div className="w-56 border-l border-[var(--c-g800)] flex flex-col overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-[var(--c-g800)]">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-g500)]">Parts List</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {['mcu', 'sensor', 'actuator', 'power', 'module', 'structural', 'enclosure', 'misc'].map((cat) => {
            const catParts = searchedParts.filter((p) => p.category === cat)
            if (!catParts.length) return null
            return (
              <div key={cat} className="border-b border-[var(--c-g900)]">
                <div className="px-3 py-2 flex items-center gap-2 bg-[var(--c-g950)]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }} />
                  <span className="text-[10px] font-bold text-[var(--c-g600)] uppercase">
                    {getCategoryLabel(cat)}
                  </span>
                  <span className="text-[10px] text-[var(--c-g700)] ml-auto">{catParts.length}</span>
                </div>
                {catParts.map((part) => (
                  <button
                    key={part.id}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--c-g900)] transition-colors"
                  >
                    <span className="text-[10px] text-[var(--c-g600)] truncate">{part.name}</span>
                    <span className="text-[10px] text-[var(--c-g700)] ml-auto shrink-0">×{part.qty}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
        <div className="px-4 py-2 border-t border-[var(--c-g800)] text-[10px] text-[var(--c-g600)]">
          {searchedParts.length} parts · ${totalCost.toFixed(2)}
        </div>
      </div>
    </div>
  )
}
