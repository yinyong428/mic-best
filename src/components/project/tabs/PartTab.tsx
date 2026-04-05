'use client'

import { useProjectStore } from '@/stores/projectStore'
import { getCategoryColor } from '@/lib/mockData'

export default function PartTab() {
  const { project, selectedPartId, selectPart } = useProjectStore()

  if (!project) return <div className="p-8 text-[var(--c-g600)]">Loading...</div>

  const selectedPart = project.parts.find((p) => p.id === selectedPartId)
  const partsWith3DPrint = project.parts.filter((p) => p.printSpecs)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--c-g800)]">
        <h2 className="font-bold">PART DETAILS</h2>
      </div>

      {/* 3D Viewer placeholder */}
      <div className="aspect-video bg-[var(--c-g950)] flex items-center justify-center">
        {selectedPart ? (
          <div className="text-center">
            <div className="w-32 h-32 mx-auto bg-[var(--c-g800)] rounded-2xl flex items-center justify-center mb-4">
              <span className="text-5xl opacity-50">⚙️</span>
            </div>
            <p className="text-sm text-[var(--c-g500)]">3D Model: {selectedPart.name}</p>
          </div>
        ) : (
          <div className="text-center text-[var(--c-g600)]">
            <p>Select a part from the list to view its 3D model</p>
          </div>
        )}
      </div>

      {/* Part selector */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* 3D Printed parts section */}
          {partsWith3DPrint.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--c-g500)] mb-3">
                3D 打印件
              </h3>
              <div className="space-y-2">
                {partsWith3DPrint.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => selectPart(part.id)}
                    className={`w-full text-left p-3 border transition-colors ${
                      selectedPartId === part.id
                        ? 'border-[var(--c-accent)] bg-[var(--c-g900)]'
                        : 'border-[var(--c-g700)] hover:border-[var(--c-g500)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{part.name}</span>
                      <span
                        className="px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: `${getCategoryColor(part.category)}20`,
                          color: getCategoryColor(part.category),
                        }}
                      >
                        3D Print
                      </span>
                    </div>
                    {part.printSpecs && (
                      <div className="text-xs text-[var(--c-g500)] space-x-2">
                        <span>{part.printSpecs.material}</span>
                        <span>·</span>
                        <span>{part.printSpecs.layerHeight}</span>
                        <span>·</span>
                        <span>{part.printSpecs.infill}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected part details */}
          {selectedPart && (
            <div className="border border-[var(--c-g700)] p-4 rounded-lg mt-6">
              <h3 className="font-bold mb-4">{selectedPart.name}</h3>

              {/* Specs */}
              {selectedPart.printSpecs && (
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-[var(--c-g500)]">材料</div>
                    <div>{selectedPart.printSpecs.material}</div>
                    <div className="text-[var(--c-g500)]">层高</div>
                    <div>{selectedPart.printSpecs.layerHeight}</div>
                    <div className="text-[var(--c-g500)]">填充</div>
                    <div>{selectedPart.printSpecs.infill}</div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedPart.description && (
                <p className="text-sm text-[var(--c-g400)] mb-4">
                  {selectedPart.description}
                </p>
              )}

              {/* Download buttons */}
              <div className="flex gap-2 pt-4 border-t border-[var(--c-g700)]">
                <button className="btn-secondary text-xs flex-1">STL 下载</button>
                <button className="btn-secondary text-xs flex-1">STEP 下载</button>
                <button className="btn-secondary text-xs flex-1">3MF 下载</button>
              </div>
            </div>
          )}

          {/* All parts quick access */}
          <div className="pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--c-g500)] mb-3">
              所有零件
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {project.parts.map((part) => (
                <button
                  key={part.id}
                  onClick={() => selectPart(part.id)}
                  className={`text-left p-2 border text-xs transition-colors ${
                    selectedPartId === part.id
                      ? 'border-[var(--c-accent)] bg-[var(--c-g900)]'
                      : 'border-[var(--c-g700)] hover:border-[var(--c-g500)]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block mr-2"
                    style={{ backgroundColor: getCategoryColor(part.category) }}
                  />
                  {part.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
