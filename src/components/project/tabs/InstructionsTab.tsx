'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'

export default function InstructionsTab() {
  const { project } = useProjectStore()
  const [currentStep, setCurrentStep] = useState(0)

  if (!project?.instructions?.length) {
    return (
      <div className="p-8 text-center text-[var(--c-g600)]">
        No assembly instructions available yet.
      </div>
    )
  }

  const totalSteps = project.instructions.length
  const step = project.instructions[currentStep]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--c-g800)] flex items-center justify-between">
        <h2 className="font-bold">INSTRUCTIONS</h2>
        <span className="text-sm text-[var(--c-g500)]">
          共 {totalSteps} 步
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 border-b border-[var(--c-g800)]">
        <div className="flex gap-1">
          {project.instructions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i === currentStep
                  ? 'bg-white'
                  : i < currentStep
                  ? 'bg-[var(--c-accent)]'
                  : 'bg-[var(--c-g700)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Step indicator */}
          <div className="text-sm text-[var(--c-g500)] font-bold uppercase tracking-wider">
            Step {currentStep + 1} of {totalSteps}
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold">{step.title}</h3>

          {/* Description */}
          <p className="text-[var(--c-g300)] leading-relaxed">{step.description}</p>

          {/* Required parts */}
          {step.partIds.length > 0 && (
            <div className="bg-[var(--c-g900)] p-4 rounded-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-g500)] mb-3">
                所需零件
              </p>
              <ul className="space-y-2">
                {step.partIds.map((partId) => {
                  const part = project.parts.find((p) => p.id === partId)
                  return part ? (
                    <li key={partId} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-[var(--c-accent)]" />
                      {part.name}
                    </li>
                  ) : null
                })}
              </ul>
            </div>
          )}

          {/* Tools */}
          {step.tools && step.tools.length > 0 && (
            <div className="bg-[var(--c-g900)] p-4 rounded-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-g500)] mb-3">
                所需工具
              </p>
              <div className="flex flex-wrap gap-2">
                {step.tools.map((tool) => (
                  <span
                    key={tool}
                    className="px-3 py-1 text-xs border border-[var(--c-g700)]"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {step.tips && (
            <div className="bg-amber-950/30 border border-amber-800/60 p-4 rounded-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                💡 小贴士
              </p>
              <p className="text-sm text-amber-300/80">{step.tips}</p>
            </div>
          )}

          {/* 3D Preview placeholder */}
          <div className="aspect-video bg-[var(--c-g900)] rounded-lg flex items-center justify-center">
            <span className="text-4xl opacity-30">3D Preview</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-[var(--c-g800)] flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="btn-secondary text-sm disabled:opacity-50"
        >
          ← 上一步
        </button>
        <button
          onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
          disabled={currentStep === totalSteps - 1}
          className="btn-primary text-sm disabled:opacity-50"
        >
          下一条 →
        </button>
      </div>
    </div>
  )
}
