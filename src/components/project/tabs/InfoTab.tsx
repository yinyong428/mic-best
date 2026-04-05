'use client'

import { useProjectStore } from '@/stores/projectStore'
import { getCategoryLabel, getCategoryColor } from '@/lib/mockData'

export default function InfoTab() {
  const { project } = useProjectStore()

  if (!project) return <div className="p-8 text-[var(--c-g600)]">Loading...</div>

  const electricalParts = project.parts.filter((p) =>
    ['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category)
  )
  const mechanicalParts = project.parts.filter(
    (p) =>
      !['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category)
  )
  const electricalCost = electricalParts.reduce(
    (sum, p) => sum + p.unitCost * p.qty,
    0
  )
  const mechanicalCost = mechanicalParts.reduce(
    (sum, p) => sum + p.unitCost * p.qty,
    0
  )

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Project Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <h1 className="text-3xl font-bold">{project.name}</h1>
        </div>
        <p className="text-[var(--c-g400)] leading-relaxed">{project.description}</p>
        <div className="flex items-center gap-4 text-sm text-[var(--c-g600)]">
          <span>by {project.author}</span>
          <span>|</span>
          <span>Created 2026/4/5</span>
          <span>|</span>
          <span>Updated Today</span>
        </div>
      </div>

      {/* Stats Table */}
      <div className="border border-[var(--c-g700)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--c-g700)]">
              <th className="text-left p-3 font-bold text-[var(--c-g400)]">Category</th>
              <th className="text-right p-3 font-bold text-[var(--c-g400)]">Parts</th>
              <th className="text-right p-3 font-bold text-[var(--c-g400)]">Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--c-g700)]">
              <td className="p-3 flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#3b82f6' }}
                />
                Electrical
              </td>
              <td className="p-3 text-right">{electricalParts.length}</td>
              <td className="p-3 text-right">${electricalCost.toFixed(2)}</td>
            </tr>
            <tr className="border-b border-[var(--c-g700)]">
              <td className="p-3 flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#f59e0b' }}
                />
                Mechanical
              </td>
              <td className="p-3 text-right">{mechanicalParts.length}</td>
              <td className="p-3 text-right">${mechanicalCost.toFixed(2)}</td>
            </tr>
            <tr className="bg-[var(--c-g900)]">
              <td className="p-3 font-bold">TOTAL</td>
              <td className="p-3 text-right font-bold">{project.parts.length}</td>
              <td className="p-3 text-right font-bold">${project.totalCost.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {['机器人', '巡逻', '树莓派', '履带', 'AI'].map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 text-xs border border-[var(--c-g700)] text-[var(--c-g400)] hover:border-[var(--c-g500)] transition-colors"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
