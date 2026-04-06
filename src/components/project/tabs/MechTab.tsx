'use client'

import { useRef, useState, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useProjectStore } from '@/stores/projectStore'
import { getCategoryColor } from '@/lib/mockData'

interface MechPart3D {
  id: string
  name: string
  category: string
  shape: 'box' | 'cylinder' | 'sphere'
  size: [number, number, number]
  position: [number, number, number]
}

function build3DParts(projectName: string): MechPart3D[] {
  const lower = projectName.toLowerCase()
  const parts: MechPart3D[] = [
    { id: 'frame-1', name: 'Base Frame', category: 'structural', shape: 'box', size: [4, 0.2, 3], position: [0, 0, 0] },
    { id: 'mcu', name: 'Main Controller', category: 'mcu', shape: 'box', size: [0.8, 0.15, 0.6], position: [0, 0.25, 0] },
    { id: 'battery', name: 'Battery Pack', category: 'power', shape: 'box', size: [1.2, 0.3, 0.8], position: [0, 0.3, 0.8] },
    { id: 'lid', name: 'Lid Enclosure', category: 'enclosure', shape: 'box', size: [2, 0.1, 1.5], position: [0, 0.5, 0] },
  ]

  if (lower.includes('motor') || lower.includes('robot') || lower.includes('drone') || lower.includes('car')) {
    parts.push(
      { id: 'motor-l', name: 'Left Motor', category: 'actuator', shape: 'cylinder', size: [0.6, 0.6, 0.8], position: [-1.5, 0.1, -0.8] },
      { id: 'motor-r', name: 'Right Motor', category: 'actuator', shape: 'cylinder', size: [0.6, 0.6, 0.8], position: [1.5, 0.1, -0.8] },
      { id: 'wheel-l', name: 'Left Wheel', category: 'actuator', shape: 'cylinder', size: [0.8, 0.8, 0.3], position: [-1.5, -0.3, -0.8] },
      { id: 'wheel-r', name: 'Right Wheel', category: 'actuator', shape: 'cylinder', size: [0.8, 0.8, 0.3], position: [1.5, -0.3, -0.8] },
    )
  }

  if (lower.includes('sensor') || lower.includes('ultrasonic')) {
    parts.push({ id: 'sensor-1', name: 'Sensor Module', category: 'sensor', shape: 'cylinder', size: [0.4, 0.4, 0.3], position: [0, 0.35, -1.2] })
  }

  if (lower.includes('camera') || lower.includes('vision') || lower.includes('clip') || lower.includes('hair')) {
    parts.push({ id: 'cam', name: 'Camera Module', category: 'sensor', shape: 'box', size: [0.3, 0.2, 0.4], position: [0, 0.5, -0.8] })
  }

  if (parts.length < 5) {
    parts.push({ id: 'module-1', name: 'IO Module', category: 'module', shape: 'box', size: [0.6, 0.1, 0.4], position: [1.2, 0.3, 0] })
  }

  return parts
}

function PartMesh({ part, onClick, selected }: {
  part: MechPart3D
  onClick: () => void
  selected: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const color = getCategoryColor(part.category)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.lerp(new THREE.Vector3(...part.position), delta * 5)
  })

  const geo = part.shape === 'cylinder'
    ? <cylinderGeometry args={[part.size[0]/2, part.size[0]/2, part.size[1], 16]} />
    : part.shape === 'sphere'
    ? <sphereGeometry args={[part.size[0]/2, 16, 16]} />
    : <boxGeometry args={part.size} />

  return (
    <mesh
      ref={meshRef}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      {geo}
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={part.category === 'power' ? 0.8 : 0.2}
        emissive={selected ? color : '#000000'}
        emissiveIntensity={selected ? 0.4 : 0}
      />
    </mesh>
  )
}

function Scene({ parts, selectedId, onSelect }: {
  parts: MechPart3D[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[6, 4, 6]} fov={50} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
        autoRotate={!selectedId}
        autoRotateSpeed={0.5}
      />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />
      <pointLight position={[0, 8, 0]} intensity={0.8} color="#22c55e" />
      {parts.map((part) => (
        <PartMesh
          key={part.id}
          part={part}
          selected={selectedId === part.id}
          onClick={() => onSelect(selectedId === part.id ? null : part.id)}
        />
      ))}
      <gridHelper args={[20, 20, '#1a1a2e', '#1a1a2e']} position={[0, -1, 0]} />
      <Environment preset="city" />
    </>
  )
}

export default function MechTab() {
  const { project } = useProjectStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewFilter, setViewFilter] = useState<string>('all')

  const parts3d = useMemo(() => project ? build3DParts(project.name) : [], [project?.name])

  const filteredParts = useMemo(() => {
    if (viewFilter === 'all') return parts3d
    if (viewFilter === 'electrical') return parts3d.filter(p => ['mcu', 'sensor', 'power', 'module'].includes(p.category))
    if (viewFilter === 'mechanical') return parts3d.filter(p => ['actuator'].includes(p.category))
    if (viewFilter === 'structural') return parts3d.filter(p => ['structural'].includes(p.category))
    if (viewFilter === 'enclosure') return parts3d.filter(p => ['enclosure'].includes(p.category))
    if (viewFilter === 'mechanism') return parts3d.filter(p => ['actuator', 'structural'].includes(p.category))
    if (viewFilter === 'misc') return parts3d.filter(p => ['misc', 'module'].includes(p.category))
    if (viewFilter === '3dprint') return parts3d.filter(p => ['enclosure', 'structural'].includes(p.category))
    return parts3d
  }, [parts3d, viewFilter])

  const selected = parts3d.find((p) => p.id === selectedId)

  // Dimensions based on part count
  const dimensions = useMemo(() => ({
    x: 200 + (project?.parts.length ?? 0) * 8,
    y: 100 + (project?.parts.length ?? 0) * 12,
    z: 150 + (project?.parts.length ?? 0) * 6,
  }), [project?.parts.length])

  const viewFilters = [
    { key: 'all', label: 'Parts' },
    { key: 'electrical', label: 'Electrical' },
    { key: 'mechanical', label: 'Mechanical' },
    { key: 'structural', label: 'Structural' },
    { key: 'enclosure', label: 'Enclosure' },
    { key: 'mechanism', label: 'Mechanism' },
    { key: 'misc', label: 'Misc' },
    { key: '3dprint', label: '3D Print' },
  ]

  return (
    <div className="h-full relative overflow-hidden flex flex-col">
      {/* Full-screen 3D Canvas */}
      <div className="flex-1 relative">
        {project?.imageUrl && (
          <img src={project.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
        )}
        <Canvas shadows className="!bg-[#09090b]">
          <Suspense fallback={null}>
            <Scene parts={filteredParts} selectedId={selectedId} onSelect={setSelectedId} />
          </Suspense>
        </Canvas>

        {/* Hint text bottom-left */}
        <div className="absolute bottom-16 left-4 text-[10px] text-[var(--c-g600)]">
          Drag to rotate · Scroll to zoom · Click to highlight
        </div>

        {/* Click hint top-left */}
        {selected && (
          <div className="absolute top-4 left-4 bg-[#0a0a0f]/90 border border-[#2a2a3e] rounded-lg px-3 py-2">
            <p className="text-[10px] font-bold text-[var(--c-accent)] uppercase">{selected.category}</p>
            <p className="text-sm font-bold text-white">{selected.name}</p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-[var(--c-g800)] bg-[var(--c-bg)] px-4 py-2 flex items-center justify-between">
        {/* Dimensions */}
        <div className="flex items-center gap-4 text-[10px] text-[var(--c-g500)]">
          <span className="font-mono">
            <span className="text-[var(--c-g700)]">X</span>{' '}
            <span className="text-white font-medium">{dimensions.x}mm</span>
          </span>
          <span className="font-mono">
            <span className="text-[var(--c-g700)]">Y</span>{' '}
            <span className="text-white font-medium">{dimensions.y}mm</span>
          </span>
          <span className="font-mono">
            <span className="text-[var(--c-g700)]">Z</span>{' '}
            <span className="text-white font-medium">{dimensions.z}mm</span>
          </span>
          <span className="ml-2 text-[var(--c-g700)] uppercase font-bold tracking-wider">3D CAD</span>
        </div>

        {/* View filters */}
        <div className="flex items-center gap-1">
          {viewFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewFilter(key)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                viewFilter === key
                  ? 'bg-[var(--c-g200)] text-black'
                  : 'text-[var(--c-g500)] hover:text-white hover:bg-[var(--c-g800)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
