'use client'

import { useState, useRef, useCallback } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { getCategoryColor } from '@/lib/mockData'
import type { StreamingChunk, InstructionResult } from '@/lib/instructions'
import type { Instruction } from '@/types'

interface Phase {
  id: string
  name: string
  icon: string
  steps: {
    id: string
    step: number
    title: string
    description: string
    partIds: string[]
    tools: string[]
    tips?: string
  }[]
}

const DEFAULT_TOOLS = [
  '3D printer (PETG and PLA)',
  'M4 hex key / Allen wrench',
  'M3 hex key',
  'Wire strippers',
  'Phillips screwdriver',
  'Multimeter',
  'Soldering iron (optional)',
]

const DEFAULT_ASSUMPTIONS = [
  'Basic knowledge of microcontroller GPIO',
  'Raspberry Pi OS can be flashed to SD card',
  'Familiarity with 3D printing processes',
  'Safe handling of LiPo batteries',
]

function autoGeneratePhases(
  projectName: string,
  parts: { id: string; name: string; category: string; qty: number }[]
): Phase[] {
  const electrical = parts.filter(p =>
    ['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category)
  )
  const structural = parts.filter(
    (p) => !['mcu', 'sensor', 'actuator', 'power', 'module'].includes(p.category)
  )
  const mcuParts = electrical.filter((p) => p.category === 'mcu')
  const sensorParts = electrical.filter((p) => p.category === 'sensor')
  const actuatorParts = electrical.filter((p) => p.category === 'actuator')
  const powerParts = electrical.filter((p) => p.category === 'power')
  const moduleParts = electrical.filter((p) => p.category === 'module')

  const byIds = (ids: string[]) => ids.map((id) => parts.find((p) => p.id === id)).filter(Boolean)

  return [
    {
      id: 'fabricate',
      name: 'Fabricate',
      icon: '🖨️',
      steps: [
        {
          id: '1.1',
          step: 1,
          title: 'Print all 3D printable parts',
          description: `Print structural parts including mounts, brackets, and enclosure. Recommended: PETG for load-bearing parts, PLA for decorative panels.`,
          partIds: structural.map((p) => p.id),
          tools: ['3D printer', 'PLA filament', 'PETG filament'],
        },
      ],
    },
    {
      id: 'wire',
      name: 'Wire',
      icon: '⚡',
      steps: [
        {
          id: '2.1',
          step: 1,
          title: 'Connect power bus and voltage regulation',
          description: `Route power from ${powerParts[0]?.name ?? 'battery'} to the buck converter and motor driver. Verify voltage levels before connecting sensitive components.`,
          partIds: [
            ...powerParts.slice(0, 1).map((p) => p.id),
            ...moduleParts
              .filter((p) => p.name.toLowerCase().includes('driver') || p.name.toLowerCase().includes('buck') || p.name.toLowerCase().includes('regulator'))
              .map((p) => p.id),
          ],
          tools: ['Wire strippers', 'Soldering iron', 'Multimeter', 'Heat shrink tubing'],
        },
        {
          id: '2.2',
          step: 2,
          title: `Connect ${mcuParts[0]?.name ?? 'MCU'} to peripherals`,
          description: `Wire GPIO pins from the ${mcuParts[0]?.name ?? 'MCU'} to sensors and modules. Use appropriate logic voltage levels.`,
          partIds: [
            ...mcuParts.map((p) => p.id),
            ...sensorParts.map((p) => p.id),
            ...moduleParts.map((p) => p.id),
          ],
          tools: ['Jumper wires', 'Breadboard', 'Multimeter'],
        },
        {
          id: '2.3',
          step: 3,
          title: 'Connect actuators to motor driver outputs',
          description: `Wire ${actuatorParts.map((p) => p.name).join(' and ')} to the motor driver output terminals. Observe correct polarity and phase wiring.`,
          partIds: [
            ...moduleParts.filter((p) => p.name.toLowerCase().includes('driver')).map((p) => p.id),
            ...actuatorParts.map((p) => p.id),
          ],
          tools: ['Wire strippers', 'Screwdriver', 'Multimeter'],
        },
      ],
    },
    {
      id: 'assemble',
      name: 'Assemble',
      icon: '🔧',
      steps: [
        {
          id: '3.1',
          step: 1,
          title: 'Assemble main chassis and structural frame',
          description: `Build the frame using ${structural.find((p) => p.name.toLowerCase().includes('extrusion'))?.name ?? 'aluminum extrusions'}. Ensure the frame is square before final tightening.`,
          partIds: structural.filter(
            (p) =>
              p.name.toLowerCase().includes('extrusion') ||
              p.name.toLowerCase().includes('bracket') ||
              p.name.toLowerCase().includes('frame') ||
              p.name.toLowerCase().includes('plate')
          ).map((p) => p.id),
          tools: ['M4 hex key', 'M4 T-nut', 'Torque wrench', 'Square ruler'],
        },
        {
          id: '3.2',
          step: 2,
          title: 'Mount electronics to chassis',
          description: `Install ${mcuParts.map((p) => p.name).join(', ')} and other electronics. Route cables cleanly and avoid interference with moving parts.`,
          partIds: [...mcuParts.map((p) => p.id), ...moduleParts.map((p) => p.id), ...powerParts.map((p) => p.id)],
          tools: ['M3 bolts', 'Standoffs', 'Cable ties', 'Double-sided tape'],
        },
        {
          id: '3.3',
          step: 3,
          title: 'Install sensors and actuators',
          description: `Mount ${[...sensorParts, ...actuatorParts].map((p) => p.name).join(', ')} to designated positions. Check alignment before securing.`,
          partIds: [...sensorParts.map((p) => p.id), ...actuatorParts.map((p) => p.id)],
          tools: ['M3 bolts', 'Screwdriver', 'Hot glue (optional)'],
        },
      ],
    },
    {
      id: 'bringup',
      name: 'Bring-up',
      icon: '🚀',
      steps: [
        {
          id: '4.1',
          step: 1,
          title: 'Power on and verify boot',
          description: `Insert SD card with OS, connect power, and verify ${mcuParts[0]?.name ?? 'MCU'} boots correctly. Check for any initialization errors.`,
          partIds: mcuParts.map((p) => p.id),
          tools: ['HDMI monitor', 'USB keyboard', 'SD card reader'],
        },
        {
          id: '4.2',
          step: 2,
          title: 'Test each subsystem independently',
          description: `Test ${sensorParts.map((p) => p.name).join(', ')} individually, then ${actuatorParts.map((p) => p.name).join(', ')}. Verify correct operation before integration.`,
          partIds: [...sensorParts.map((p) => p.id), ...actuatorParts.map((p) => p.id)],
          tools: ['Python test scripts', 'Multimeter', 'Oscilloscope (optional)'],
        },
        {
          id: '4.3',
          step: 3,
          title: 'Full system integration test',
          description: `Run full project test covering all ${parts.length} components. Verify ${projectName} operates as specified.`,
          partIds: parts.map((p) => p.id),
          tools: ['Test scripts', 'Power supply', 'Reference schematic'],
        },
      ],
    },
  ]
}

export default function InstructionsTab() {
  const { project, setProject } = useProjectStore()
  const [doneSteps, setDoneSteps] = useState<Record<string, boolean>>({})
  const [generating, setGenerating] = useState(false)
  const [genPhase, setGenPhase] = useState('')
  const [genThinking, setGenThinking] = useState('')
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  if (!project) {
    return <div className="p-8 text-[var(--c-g600)]">Loading...</div>
  }

  // Merge stored instructions with auto-generated fallback
  const storedPhases = project.instructions?.length
    ? parseStoredInstructions(project.instructions)
    : null

  const phases = storedPhases ?? autoGeneratePhases(project.name, project.parts)
  const totalSteps = phases.reduce((sum, p) => sum + p.steps.length, 0)
  const doneCount = phases.reduce(
    (sum, p) => sum + p.steps.filter((s) => doneSteps[s.id]).length,
    0
  )

  const toggleStep = (stepId: string) => {
    setDoneSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }))
  }

  const handleGenerate = useCallback(async () => {
    if (!project || generating) return
    setGenerating(true)
    setError('')
    setGenThinking('')

    const aiMsgId = `gen-${Date.now()}`

    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/instructions/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          parts: project.parts.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            qty: p.qty,
            description: p.description ?? '',
            model: p.model,
          })),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullThinking = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const chunk: StreamingChunk = JSON.parse(data)

            if (chunk.phase === 'thinking') {
              fullThinking += chunk.thinking ?? ''
              setGenThinking(fullThinking.slice(-300))
            }

            if (chunk.phase === 'parsing') {
              setGenPhase(chunk.progress ?? '正在生成…')
            }

            if (chunk.phase === 'done' && chunk.result) {
              const { result } = chunk
              const newPhases = result.phases.map((phase) => ({
                ...phase,
                steps: phase.steps.map((s) => ({
                  ...s,
                  id: `${phase.id}-${s.step}`,
                })),
              }))

              // Persist to project store
              const flatInstructions: Instruction[] = newPhases.flatMap((phase) =>
                phase.steps.map((s) => ({
                  step: s.step,
                  title: s.title,
                  description: s.description,
                  partIds: s.partIds,
                  tools: s.tools,
                  tips: s.tips,
                }))
              )

              setProject({
                ...project,
                instructions: flatInstructions,
              })

              setGenPhase(`✅ 已生成 ${newPhases.reduce((s, p) => s + p.steps.length, 0)} 个步骤`)
              setTimeout(() => {
                setGenerating(false)
                setGenPhase('')
                setGenThinking('')
              }, 2000)
              return
            }

            if (chunk.phase === 'error') {
              throw new Error(chunk.error ?? '生成失败')
            }
          } catch (err) {
            if ((err as Error).name === 'AbortError') {
              setGenerating(false)
              setGenPhase('')
              return
            }
            // skip parse errors
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? '生成失败，请重试')
      }
    } finally {
      setGenerating(false)
      abortRef.current = null
    }
  }, [project, generating, setProject])

  const handleRegenerate = () => {
    if (generating) abortRef.current?.abort()
    handleGenerate()
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--c-bg)] border-b border-[var(--c-g800)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Instructions</h2>
          <span className="text-xs px-2 py-0.5 bg-[var(--c-g800)] text-[var(--c-g400)] rounded-full font-mono">
            {doneCount}/{totalSteps} Done
          </span>
          {project?.instructions?.length ? (
            <span className="text-[10px] px-1.5 py-0.5 bg-[#22c55e]/15 text-[#22c55e] rounded font-bold">
              AI 生成
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--c-g800)] text-[var(--c-g600)] rounded">
              模板
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="px-3 py-1.5 text-[10px] font-bold border border-[var(--c-g700)] text-[var(--c-g400)] rounded-lg hover:border-[var(--c-g500)] hover:text-white transition-colors disabled:opacity-50"
          >
            🔄 Regenerate
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !project.parts.length}
            className="px-3 py-1.5 text-[10px] font-bold bg-[var(--c-accent)] text-black rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
          >
            {generating ? (
              <>
                <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                生成中…
              </>
            ) : (
              <>🤖 Generate All ({totalSteps})</>
            )}
          </button>
        </div>
      </div>

      {/* Generation status */}
      {generating && (
        <div className="mx-6 mt-4 p-4 border border-[var(--c-accent)]/30 bg-[var(--c-accent)]/5 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[var(--c-accent)] animate-pulse" />
            <span className="text-xs font-bold text-[var(--c-accent)]">{genPhase || '正在生成…'}</span>
          </div>
          {genThinking && (
            <p className="text-xs text-[var(--c-g500)] leading-relaxed">
              {genThinking}
              <span className="inline-block w-1 h-3 bg-[var(--c-accent)] ml-1 animate-pulse align-middle" />
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 p-3 border border-red-900/30 bg-red-950/10 rounded-xl">
          <p className="text-xs text-red-400">❌ {error}</p>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* AI generation progress: percentage + phase */}
        {generating && (
          <div className="mx-6 mt-4 p-4 border border-[var(--c-accent)]/30 bg-[var(--c-accent)]/5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[var(--c-accent)] animate-pulse" />
              <span className="text-xs font-bold text-[var(--c-accent)]">{genPhase || '正在生成…'}</span>
            </div>
            {genThinking && (
              <p className="text-xs text-[var(--c-g500)] leading-relaxed">
                {genThinking}
                <span className="inline-block w-1 h-3 bg-[var(--c-accent)] ml-1 animate-pulse align-middle" />
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 border border-red-900/30 bg-red-950/10 rounded-xl">
            <p className="text-xs text-red-400">❌ {error}</p>
          </div>
        )}

        {/* Tools & Assumptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-[var(--c-g800)] rounded-xl p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>🔧</span> Tools
            </h3>
            <ul className="space-y-1.5">
              {DEFAULT_TOOLS.map((tool) => (
                <li key={tool} className="flex items-start gap-2 text-xs text-[var(--c-g400)]">
                  <span className="text-[var(--c-g600)] mt-0.5">•</span>
                  {tool}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-[var(--c-g800)] rounded-xl p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>📋</span> Assumptions
            </h3>
            <ul className="space-y-1.5">
              {DEFAULT_ASSUMPTIONS.map((a) => (
                <li key={a} className="flex items-start gap-2 text-xs text-[var(--c-g400)]">
                  <span className="text-[var(--c-g600)] mt-0.5">-</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Phases */}
        {phases.map((phase) => {
          const phaseDone = phase.steps.filter((s) => doneSteps[s.id]).length
          return (
            <div key={phase.id} className="space-y-3">
              {/* Phase header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{phase.icon}</span>
                  <h3 className="text-base font-bold text-white">{phase.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-[var(--c-g800)] text-[var(--c-g500)] rounded-full font-mono">
                    {phaseDone}/{phase.steps.length}
                  </span>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !project.parts.length}
                  className="px-3 py-1 text-[10px] font-bold border border-[var(--c-g700)] text-[var(--c-g500)] rounded-lg hover:border-[var(--c-g500)] hover:text-white transition-colors disabled:opacity-50"
                >
                  🤖 Generate ({phase.steps.length})
                </button>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {phase.steps.map((step) => {
                  const isDone = doneSteps[step.id]
                  const partObjs = step.partIds
                    .map((id) => project.parts.find((p) => p.id === id))
                    .filter(Boolean)

                  return (
                    <div
                      key={step.id}
                      className={`border rounded-xl p-4 transition-colors ${
                        isDone
                          ? 'border-[var(--c-g700)] bg-[var(--c-g950)] opacity-60'
                          : 'border-[var(--c-g800)] hover:border-[var(--c-g700)] bg-[var(--c-bg)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleStep(step.id)}
                          className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isDone
                              ? 'bg-[var(--c-accent)] border-[var(--c-accent)]'
                              : 'border-[var(--c-g600)] hover:border-[var(--c-g400)]'
                          }`}
                        >
                          {isDone && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2 2 4-4" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h4
                              className={`text-sm font-semibold leading-tight ${
                                isDone ? 'line-through text-[var(--c-g600)]' : 'text-white'
                              }`}
                            >
                              {step.step}. {step.title}
                            </h4>
                            {partObjs.length > 0 && (
                              <span className="text-[10px] text-[var(--c-g600)] shrink-0 mt-0.5 font-mono">
                                {partObjs.length} parts
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs leading-relaxed ${
                              isDone ? 'text-[var(--c-g700)]' : 'text-[var(--c-g500)]'
                            }`}
                          >
                            {step.description}
                          </p>
                          {step.tools.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {step.tools.map((tool) => (
                                <span
                                  key={tool}
                                  className="text-[10px] px-1.5 py-0.5 bg-[var(--c-g800)] text-[var(--c-g500)] rounded"
                                >
                                  🔧 {tool}
                                </span>
                              ))}
                            </div>
                          )}
                          {step.tips && !isDone && (
                            <p className="text-[10px] text-[var(--c-accent)] mt-1.5 italic">
                              💡 {step.tips}
                            </p>
                          )}
                          {partObjs.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {partObjs.slice(0, 6).map((part) =>
                                part ? (
                                  <span
                                    key={part.id}
                                    className="text-[10px] px-1.5 py-0.5 rounded"
                                    style={{
                                      backgroundColor: `${getCategoryColor(part.category)}15`,
                                      color: getCategoryColor(part.category),
                                    }}
                                  >
                                    {part.name}
                                  </span>
                                ) : null
                              )}
                              {partObjs.length > 6 && (
                                <span className="text-[10px] text-[var(--c-g600)] px-1.5 py-0.5">
                                  +{partObjs.length - 6} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Parse flat instruction list into phases
function parseStoredInstructions(
  instructions: Instruction[]
): Phase[] {
  const phaseMap: Record<string, Phase> = {}

  // Heuristic phase assignment
  instructions.forEach((inst) => {
    const title = inst.title.toLowerCase()
    let phaseId = 'assemble'
    let phaseName = 'Assemble'
    let phaseIcon = '🔧'

    if (title.includes('print') || title.includes('fabricat') || title.includes('3d')) {
      phaseId = 'fabricate'; phaseName = 'Fabricate'; phaseIcon = '🖨️'
    } else if (title.includes('wire') || title.includes('connect') || title.includes('power') || title.includes('solder')) {
      phaseId = 'wire'; phaseName = 'Wire'; phaseIcon = '⚡'
    } else if (title.includes('boot') || title.includes('test') || title.includes('software') || title.includes('program')) {
      phaseId = 'bringup'; phaseName = 'Bring-up'; phaseIcon = '🚀'
    }

    if (!phaseMap[phaseId]) {
      phaseMap[phaseId] = { id: phaseId, name: phaseName, icon: phaseIcon, steps: [] }
    }

    phaseMap[phaseId].steps.push({
      id: `${phaseId}-${inst.step}`,
      step: inst.step,
      title: inst.title,
      description: inst.description,
      partIds: inst.partIds ?? [],
      tools: inst.tools ?? [],
      tips: inst.tips,
    })
  })

  return Object.values(phaseMap)
}
