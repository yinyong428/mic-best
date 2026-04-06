'use client'

import Link from 'next/link'
import { useProjectStore } from '@/stores/projectStore'

function generateInstructions(projectName: string, parts: { id: string; name: string; description?: string; category: string }[]) {
  const lower = projectName.toLowerCase()
  const steps = []
  const electrical = parts.filter(p => ['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category))
  const mechanical = parts.filter(p => !['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category))

  if (mechanical.length > 0) {
    steps.push({ step: 1, title: 'Assemble Frame', description: `Connect structural parts to form the base frame. Ensure alignment before tightening.` })
  }
  if (electrical.filter(p => p.category === 'actuator').length > 0) {
    steps.push({ step: 2, title: 'Install Motors', description: 'Mount actuators and connect to motor driver modules.' })
  }
  if (electrical.filter(p => p.category === 'mcu').length > 0) {
    steps.push({ step: 3, title: 'Install Controller', description: 'Mount the main controller and connect all signal cables.' })
  }
  if (electrical.filter(p => p.category === 'sensor').length > 0) {
    steps.push({ step: 4, title: 'Install Sensors', description: 'Mount sensors at designated positions and connect to controller.' })
  }
  if (electrical.filter(p => p.category === 'module').length > 0) {
    steps.push({ step: 5, title: 'Install Modules', description: 'Connect all module boards according to the wiring diagram.' })
  }
  if (electrical.filter(p => p.category === 'power').length > 0) {
    steps.push({ step: 6, title: 'Connect Power', description: 'Install power supply and verify voltage levels before powering on.' })
  }
  steps.push({ step: steps.length + 1, title: 'Final Check', description: 'Upload firmware, test all functions, and perform final assembly.' })
  return steps
}

export default function InfoTab() {
  const { project } = useProjectStore()

  if (!project) return <div className="p-8 text-[var(--c-g600)]">Loading...</div>

  const electricalParts = project.parts.filter(p =>
    ['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category)
  )
  const mechanicalParts = project.parts.filter(p =>
    !['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category)
  )

  const instructions = project.instructions?.length
    ? project.instructions
    : generateInstructions(project.name, project.parts)

  const tags = project.name.includes('太阳能')
    ? ['机器人', '太阳能', '自动追踪', 'AI', '树莓派']
    : ['机器人', '巡逻', 'AI', '电子']

  return (
    <div className="h-full overflow-y-auto">
      {/* Full-width project image */}
      {project.imageUrl && (
        <div className="relative w-full" style={{ height: '56vh' }}>
          <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
          {/* Project name on image */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
            <h1 className="text-3xl font-bold text-white mb-1">{project.name}</h1>
            <div className="flex items-center gap-3 text-xs text-[var(--c-g400)]">
              <span>{project.parts.length} parts</span>
              <span>·</span>
              <span>${project.totalCost.toFixed(2)} total</span>
              <span>·</span>
              <span>by {project.author}</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-5 space-y-5">
        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-[var(--c-g500)]">
          <span>Created Today</span>
          <span>·</span>
          <span>Updated Today</span>
          <span className="ml-2 px-2 py-0.5 border border-[var(--c-g700)] text-[10px] font-bold uppercase tracking-wider">Published</span>
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--c-g400)] leading-relaxed max-w-2xl">{project.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 text-[10px] border border-[var(--c-g700)] text-[var(--c-g500)] rounded-full">{tag}</span>
          ))}
        </div>

        {/* Section: Bill of Materials + Steps */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-white">
              Bill of Materials · <span className="text-[var(--c-accent)]">{instructions.length} Steps</span>
            </h2>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="border border-[var(--c-g800)] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-[var(--c-g500)]">Electrical</span>
              </div>
              <p className="text-lg font-bold text-white">{electricalParts.length}</p>
              <p className="text-xs text-[var(--c-g500)]">${electricalParts.reduce((s, p) => s + p.unitCost * p.qty, 0).toFixed(2)}</p>
            </div>
            <div className="border border-[var(--c-g800)] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs text-[var(--c-g500)]">Mechanical</span>
              </div>
              <p className="text-lg font-bold text-white">{mechanicalParts.length}</p>
              <p className="text-xs text-[var(--c-g500)]">${mechanicalParts.reduce((s, p) => s + p.unitCost * p.qty, 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Instructions steps preview — horizontal scroll */}
          {instructions.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-bold text-[var(--c-g500)] uppercase tracking-wider mb-2">Instructions</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {instructions.map((inst) => (
                  <div
                    key={inst.step}
                    className="shrink-0 w-36 border border-[var(--c-g800)] rounded-lg p-3 hover:border-[var(--c-g700)] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-[var(--c-g800)] flex items-center justify-center text-[10px] font-bold text-white group-hover:bg-[var(--c-accent)] group-hover:text-black transition-colors">
                        {inst.step}
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold text-white leading-tight">{inst.title}</p>
                    <p className="text-[9px] text-[var(--c-g600)] mt-0.5 line-clamp-2">{inst.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOM table */}
          <p className="text-[10px] font-bold text-[var(--c-g500)] uppercase tracking-wider mb-2">Parts</p>
          <div className="border border-[var(--c-g800)] rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--c-g800)] bg-[var(--c-g900)]">
                  <th className="text-left p-2.5 font-bold text-[var(--c-g500)]">Part</th>
                  <th className="text-right p-2.5 font-bold text-[var(--c-g500)] w-16">Qty</th>
                  <th className="text-right p-2.5 font-bold text-[var(--c-g500)] w-20">Unit</th>
                  <th className="text-right p-2.5 font-bold text-[var(--c-g500)] w-20">Total</th>
                </tr>
              </thead>
              <tbody>
                {project.parts.slice(0, 10).map((part) => (
                  <tr key={part.id} className="border-b border-[var(--c-g800)] last:border-0 hover:bg-[var(--c-g900)] transition-colors">
                    <td className="p-2.5">
                      <p className="font-medium text-white">{part.name}</p>
                      <p className="text-[10px] text-[var(--c-g600)]">{part.description?.slice(0, 50)}</p>
                    </td>
                    <td className="p-2.5 text-right text-[var(--c-g500)]">×{part.qty}</td>
                    <td className="p-2.5 text-right text-[var(--c-g500)]">${part.unitCost.toFixed(2)}</td>
                    <td className="p-2.5 text-right font-medium text-white">${(part.unitCost * part.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {project.parts.length > 10 && (
            <p className="text-[10px] text-[var(--c-g600)] mt-2 text-center">
              + {project.parts.length - 10} more parts
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
