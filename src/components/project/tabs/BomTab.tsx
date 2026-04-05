'use client'

import { useProjectStore } from '@/stores/projectStore'
import { getCategoryLabel, getCategoryColor } from '@/lib/mockData'

export default function BomTab() {
  const { project, bomFilter, setBomFilter, bomView, setBomView, updatePartQty } =
    useProjectStore()

  if (!project) return <div className="p-8 text-[var(--c-g600)]">Loading...</div>

  const electricalParts = project.parts.filter((p) =>
    ['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category)
  )
  const mechanicalParts = project.parts.filter(
    (p) =>
      !['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category)
  )

  const filteredParts =
    bomFilter === 'all'
      ? project.parts
      : bomFilter === 'electrical'
      ? electricalParts
      : mechanicalParts

  const filterCounts = {
    all: project.parts.length,
    electrical: electricalParts.length,
    mechanical: mechanicalParts.length,
  }

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Filter buttons */}
          {(['all', 'electrical', 'mechanical'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setBomFilter(filter)}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                bomFilter === filter
                  ? 'bg-white text-black'
                  : 'border border-[var(--c-g700)] text-[var(--c-g500)] hover:border-[var(--c-g500)]'
              }`}
            >
              {filter === 'all' ? `All ${filterCounts.all}` : filter} {filterCounts[filter]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <button
            onClick={() => setBomView('table')}
            className={`p-2 ${bomView === 'table' ? 'bg-[var(--c-g800)]' : ''}`}
          >
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
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
          <button
            onClick={() => setBomView('cards')}
            className={`p-2 ${bomView === 'cards' ? 'bg-[var(--c-g800)]' : ''}`}
          >
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
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table View */}
      {bomView === 'table' && (
        <div className="border border-[var(--c-g700)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--c-g700)] bg-[var(--c-g900)]">
                <th className="text-left p-3 font-bold text-[var(--c-g400)]">Part</th>
                <th className="text-left p-3 font-bold text-[var(--c-g400)]">Type</th>
                <th className="text-right p-3 font-bold text-[var(--c-g400)]">Qty</th>
                <th className="text-right p-3 font-bold text-[var(--c-g400)]">Unit</th>
                <th className="text-left p-3 font-bold text-[var(--c-g400)]">Source</th>
                <th className="text-right p-3 font-bold text-[var(--c-g400)]">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((part) => (
                <tr
                  key={part.id}
                  className="border-b border-[var(--c-g800)] hover:bg-[var(--c-g900)] transition-colors"
                >
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{part.name}</p>
                      {part.printSpecs && (
                        <p className="text-xs text-[var(--c-g600)]">
                          {part.printSpecs.material} · {part.printSpecs.layerHeight} ·{' '}
                          {part.printSpecs.infill}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className="px-2 py-0.5 text-xs font-bold rounded"
                      style={{
                        backgroundColor: `${getCategoryColor(part.category)}20`,
                        color: getCategoryColor(part.category),
                      }}
                    >
                      {getCategoryLabel(part.category)}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      min="1"
                      value={part.qty}
                      onChange={(e) =>
                        updatePartQty(part.id, parseInt(e.target.value) || 1)
                      }
                      className="w-16 bg-transparent text-right border border-[var(--c-g700)] p-1 text-center"
                    />
                  </td>
                  <td className="p-3 text-right text-[var(--c-g400)]">
                    ${part.unitCost.toFixed(2)}
                  </td>
                  <td className="p-3">
                    {part.amazonAsin ? (
                      <a
                        href={`https://www.amazon.com/s?k=${encodeURIComponent(part.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Amazon ↗
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--c-g600)]">N/A</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-medium">
                    ${(part.unitCost * part.qty).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--c-g900)]">
                <td colSpan={5} className="p-3 font-bold">
                  Total ({filteredParts.length} items)
                </td>
                <td className="p-3 text-right font-bold">
                  $
                  {filteredParts
                    .reduce((sum, p) => sum + p.unitCost * p.qty, 0)
                    .toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Cards View */}
      {bomView === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParts.map((part) => (
            <div
              key={part.id}
              className="part-card bg-[var(--c-bg)] rounded-lg overflow-hidden"
            >
              {/* Preview */}
              <div className="aspect-video bg-[var(--c-g900)] flex items-center justify-center">
                <span className="text-4xl opacity-30">⚙️</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 text-xs font-bold rounded"
                    style={{
                      backgroundColor: `${getCategoryColor(part.category)}20`,
                      color: getCategoryColor(part.category),
                    }}
                  >
                    {getCategoryLabel(part.category)}
                  </span>
                  <span className="text-xs text-[var(--c-g600)]">×{part.qty}</span>
                </div>
                <h3 className="font-medium text-sm">{part.name}</h3>
                <p className="text-xs text-[var(--c-g500)] line-clamp-2">
                  {part.description}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--c-g700)]">
                  <span className="text-sm font-bold">${(part.unitCost * part.qty).toFixed(2)}</span>
                  {part.amazonAsin && (
                    <a
                      href="#"
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Amazon ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
