'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { getCategoryColor, getCategoryLabel } from '@/lib/mockData'

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
                          href={`https://www.lcsc.com/search?keyword=${encodeURIComponent(part.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-lcsc hover:text-lcsc/80 underline"
                        >
                          LCSC {part.lcscId ? `· ${part.lcscId}` : ''}
                        </a>
                        <a
                          href={`https://www.1688.com/chanpin/-${encodeURIComponent(part.name)}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-ali hover:text-ali/80 underline"
                        >
                          1688 批发
                        </a>
                        <a
                          href={`https://www.jd.com/search?keyword=${encodeURIComponent(part.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-jd hover:text-jd/80 underline"
                        >
                          京东
                        </a>
                        <a
                          href={`https://www.hqbuy.com/search?keyword=${encodeURIComponent(part.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-hqbuy hover:text-hqbuy/80 underline"
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
                  <td className="p-3 font-bold text-white" colSpan={5}>
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
                  className="border border-[var(--c-g800)] rounded-xl p-4 hover:border-[var(--c-g700)] transition-colors bg-[var(--c-g950)]"
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
                      {part.printSpecs.material} · {part.printSpecs.layerHeight} · {part.printSpecs.infill}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar - Parts List (same as main PartsList but filtered) */}
      <div className="w-56 border-l border-[var(--c-g800)] flex flex-col overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-[var(--c-g800)]">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-g500)]">Parts List</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Category groups */}
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
