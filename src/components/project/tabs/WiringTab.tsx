'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useProjectStore } from '@/stores/projectStore'
import { getCategoryColor, getCategoryLabel } from '@/lib/mockData'

interface WiringPart {
  id: string
  name: string
  category: string
  pins: string[]
}

const WIRING_CATEGORIES = ['mcu', 'sensor', 'actuator', 'power', 'module']

function inferPins(name: string, category: string): string[] {
  const lower = name.toLowerCase()
  if (category === 'mcu') return ['5V', 'GND', 'GPIO×8', 'I2C', 'SPI']
  if (category === 'sensor') {
    if (lower.includes('ultrasonic') || lower.includes('hc-sr')) return ['VCC', 'GND', 'Trig', 'Echo']
    if (lower.includes('camera') || lower.includes('cam')) return ['CSI', '5V', 'GND']
    if (lower.includes('temp') || lower.includes('dht')) return ['VCC', 'GND', 'DATA']
    return ['VCC', 'GND', 'DATA']
  }
  if (category === 'actuator') {
    if (lower.includes('motor') || lower.includes('nema')) return ['A+', 'A-', 'B+', 'B-']
    if (lower.includes('servo') || lower.includes('sg90')) return ['VCC', 'GND', 'SIG']
    return ['VCC', 'GND', 'SIG']
  }
  if (category === 'power') return ['+', '-', '5V', '3V3']
  if (category === 'module') {
    if (lower.includes('l298') || lower.includes('motor driver')) return ['IN1-4', 'ENA', '5V', 'GND', 'OUT1-4']
    if (lower.includes('i2s') || lower.includes('speaker')) return ['VIN', 'GND', 'BCLK', 'DIN', 'LRC']
    return ['VCC', 'GND', 'SDA', 'SCL']
  }
  return ['VCC', 'GND']
}

function buildWiringParts(projectParts: { id: string; name: string; category: string }[]): WiringPart[] {
  return projectParts
    .filter((p) => WIRING_CATEGORIES.includes(p.category))
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      pins: inferPins(p.name, p.category),
    }))
}

function PartNode({ data }: { data: { label: string; category: string; pins: string[] } }) {
  const color = getCategoryColor(data.category)
  const label = getCategoryLabel(data.category)

  return (
    <div
      className="rounded-xl border-2 px-4 py-3 min-w-[140px] shadow-lg"
      style={{ borderColor: color, background: '#0a0a0f' }}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !rounded-full !border-2" style={{ borderColor: color }} />
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${color}25`, color }}
        >
          {label}
        </span>
      </div>
      <p className="text-xs font-semibold text-white leading-tight">{data.label}</p>
      {data.pins.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.pins.map((pin) => (
            <span key={pin} className="text-[9px] px-1 py-0.5 bg-[#1a1a2e] rounded text-[var(--c-g500)]">
              {pin}
            </span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !rounded-full !border-2" style={{ borderColor: color }} />
    </div>
  )
}

const nodeTypes = { partNode: PartNode }

function generateWiring(parts: WiringPart[]): { nodes: Node[]; edges: Edge[] } {
  if (parts.length === 0) return { nodes: [], edges: [] }

  const cols: Record<string, number> = { power: 0, mcu: 1, module: 2, sensor: 3, actuator: 4 }
  const nodes: Node[] = []
  const edges: Edge[] = []
  const edgeSet = new Set<string>()

  parts.forEach((part, i) => {
    const col = cols[part.category] ?? 1
    const row = i % 5
    nodes.push({
      id: part.id,
      type: 'partNode',
      position: { x: col * 280, y: row * 160 },
      data: { label: part.name, category: part.category, pins: part.pins, description: '' },
    })
  })

  const mcuNodes = parts.filter((p) => p.category === 'mcu')
  const sensorNodes = parts.filter((p) => p.category === 'sensor')
  const actuatorNodes = parts.filter((p) => p.category === 'actuator')
  const powerNodes = parts.filter((p) => p.category === 'power')
  const moduleNodes = parts.filter((p) => p.category === 'module')

  const addAutoEdge = (source: string, target: string) => {
    const key = `${source}→${target}`
    if (edgeSet.has(key)) return
    edgeSet.add(key)
    const sourcePart = parts.find((p) => p.id === source)
    edges.push({
      id: `e-${source}-${target}`,
      source,
      target,
      animated: true,
      style: { stroke: getCategoryColor(sourcePart?.category ?? 'misc'), strokeWidth: 2, opacity: 0.7 },
    })
  }

  mcuNodes.forEach((mcu) => {
    sensorNodes.forEach((s) => addAutoEdge(s.id, mcu.id))
    moduleNodes.forEach((m) => {
      addAutoEdge(mcu.id, m.id)
      actuatorNodes.forEach((a) => addAutoEdge(m.id, a.id))
    })
  })

  powerNodes.forEach((pwr) => {
    mcuNodes.forEach((mcu) => addAutoEdge(pwr.id, mcu.id))
    moduleNodes.forEach((m) => addAutoEdge(pwr.id, m.id))
    actuatorNodes.forEach((a) => addAutoEdge(pwr.id, a.id))
  })

  return { nodes, edges }
}

export default function WiringTab() {
  const { project, saveProject } = useProjectStore()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const wiringParts = useMemo(
    () => buildWiringParts(project?.parts ?? []),
    [project?.parts]
  )

  // Use saved wiring nodes/edges if available, otherwise auto-generate
  const initial = useMemo(() => {
    if (project?.wiringNodes && project.wiringNodes.length > 0) {
      return {
        nodes: project.wiringNodes as unknown as Node[],
        edges: (project.wiringEdges ?? []) as unknown as Edge[],
      }
    }
    return generateWiring(wiringParts)
  }, [project?.wiringNodes, project?.wiringEdges, wiringParts])

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes as unknown as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, style: { strokeWidth: 2, opacity: 0.7 } },
          eds
        )
      ),
    [setEdges]
  )

  const handleSave = async () => {
    setSaveStatus('saving')
    // Update project store with current wiring state
    const currentNodes = nodes as unknown as import('@/types').WiringNode[]
    const currentEdges = edges as unknown as import('@/types').WiringEdge[]
    useProjectStore.setState((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          wiringNodes: currentNodes,
          wiringEdges: currentEdges,
        },
      }
    })
    const result = await saveProject()
    setSaveStatus(result.success ? 'saved' : 'error')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  return (
    <div className="h-full w-full relative">
      {/* Save toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--c-g800)] hover:bg-[var(--c-g700)] border border-[var(--c-g700)] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {saveStatus === 'saving' ? (
            <>
              <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
              保存中…
            </>
          ) : saveStatus === 'saved' ? (
            <>✅ 已保存</>
          ) : saveStatus === 'error' ? (
            <>❌ 保存失败</>
          ) : (
            <>💾 保存接线图</>
          )}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        className="!bg-[#09090b]"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} className="!bg-[#09090b]" />
        <Controls className="!bg-[#1a1a2e] !border-[#2a2a3e] !rounded-lg [&>button]:!bg-[#1a1a2e] [&>button]:!border-[#2a2a3e] [&>button]:!text-[#9ca3af] [&>button:hover]:!bg-[#2a2a3e]" />
        <MiniMap
          className="!bg-[#0a0a0f] !border !border-[#2a2a3e] !rounded-lg"
          nodeColor={(n) => {
            const cat = (n.data as { category: string })?.category
            return cat ? getCategoryColor(cat) : '#6b7280'
          }}
          maskColor="rgba(0,0,0,0.7)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#0a0a0f]/90 border border-[#2a2a3e] rounded-lg px-3 py-2 space-y-1">
        <p className="text-[10px] font-bold text-[var(--c-g500)] uppercase mb-1">图例</p>
        {[
          { cat: 'power', label: '电源' },
          { cat: 'mcu', label: 'MCU' },
          { cat: 'module', label: '模块' },
          { cat: 'sensor', label: '传感器' },
          { cat: 'actuator', label: '执行器' },
        ].map(({ cat, label }) => (
          <div key={cat} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }} />
            <span className="text-xs text-[var(--c-g400)]">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#2a2a3e]">
          <div className="w-8 h-0.5 bg-[var(--c-g500)] rounded" />
          <span className="text-xs text-[var(--c-g500)]">接线连接</span>
        </div>
      </div>
    </div>
  )
}
