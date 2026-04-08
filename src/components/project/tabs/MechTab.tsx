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
  /** Assembled position */
  assembled: [number, number, number]
  /** Exploded offset direction */
  explodeDir: [number, number, number]
}

function build3DParts(projectName: string): MechPart3D[] {
  const lower = projectName.toLowerCase()
  const parts: MechPart3D[] = [
    { id: 'frame-1', name: 'Base Frame', category: 'structural', shape: 'box', size: [4, 0.2, 3], assembled: [0, 0, 0], explodeDir: [0, -1, 0] },
    { id: 'mcu', name: 'Main Controller', category: 'mcu', shape: 'box', size: [0.8, 0.15, 0.6], assembled: [0, 0.25, 0], explodeDir: [-1.5, 1, 0] },
    { id: 'battery', name: 'Battery Pack', category: 'power', shape: 'box', size: [1.2, 0.3, 0.8], assembled: [0, 0.3, 0.8], explodeDir: [0, 0, 2] },
    { id: 'lid', name: 'Lid Enclosure', category: 'enclosure', shape: 'box', size: [2, 0.1, 1.5], assembled: [0, 0.5, 0], explodeDir: [0, 2, 0] },
  ]

  if (lower.includes('motor') || lower.includes('robot') || lower.includes('drone') || lower.includes('car') || lower.includes('garbage')) {
    parts.push(
      { id: 'motor-l', name: 'Left Motor', category: 'actuator', shape: 'cylinder', size: [0.6, 0.6, 0.8], assembled: [-1.5, 0.1, -0.8], explodeDir: [-3, 0, -2] },
      { id: 'motor-r', name: 'Right Motor', category: 'actuator', shape: 'cylinder', size: [0.6, 0.6, 0.8], assembled: [1.5, 0.1, -0.8], explodeDir: [3, 0, -2] },
      { id: 'wheel-l', name: 'Left Wheel', category: 'actuator', shape: 'cylinder', size: [0.8, 0.8, 0.3], assembled: [-1.5, -0.3, -0.8], explodeDir: [-3, -1, -3] },
      { id: 'wheel-r', name: 'Right Wheel', category: 'actuator', shape: 'cylinder', size: [0.8, 0.8, 0.3], assembled: [1.5, -0.3, -0.8], explodeDir: [3, -1, -3] },
    )
  }

  if (lower.includes('sensor') || lower.includes('ultrasonic') || lower.includes('hc-sr')) {
    parts.push({ id: 'sensor-1', name: 'Sensor Module', category: 'sensor', shape: 'cylinder', size: [0.4, 0.4, 0.3], assembled: [0, 0.35, -1.2], explodeDir: [0, 0, -3] })
  }

  if (lower.includes('camera') || lower.includes('vision') || lower.includes('clip') || lower.includes('hair') || lower.includes('pi camera')) {
    parts.push({ id: 'cam', name: 'Camera Module', category: 'sensor', shape: 'box', size: [0.3, 0.2, 0.4], assembled: [0, 0.5, -0.8], explodeDir: [2, 1, -2] })
  }

  if (lower.includes('servo') || lower.includes('lid') || lower.includes('actuator')) {
    parts.push({ id: 'servo-1', name: 'Servo Motor', category: 'actuator', shape: 'cylinder', size: [0.3, 0.3, 0.4], assembled: [1.5, 0.35, 0.5], explodeDir: [3, 1, 1] })
  }

  if (parts.length < 5) {
    parts.push({ id: 'module-1', name: 'IO Module', category: 'module', shape: 'box', size: [0.6, 0.1, 0.4], assembled: [1.2, 0.3, 0], explodeDir: [2.5, 0.5, 0] })
  }

  return parts
}

function PartMesh({
  part,
  onClick,
  selected,
  explodeFactor,
  sequenceNumber,
}: {
  part: MechPart3D
  onClick: () => void
  selected: boolean
  explodeFactor: number
  sequenceNumber: number | null
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const color = getCategoryColor(part.category)

  // Target position = assembled + explodeDir × explodeFactor
  const targetX = part.assembled[0] + part.explodeDir[0] * explodeFactor * 1.8
  const targetY = part.assembled[1] + part.explodeDir[1] * explodeFactor * 1.8
  const targetZ = part.assembled[2] + part.explodeDir[2] * explodeFactor * 1.8

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.x += (targetX - meshRef.current.position.x) * delta * 4
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * delta * 4
    meshRef.current.position.z += (targetZ - meshRef.current.position.z) * delta * 4

    // Slight rotation during explosion
    const targetRotY = explodeFactor * Math.PI * 0.25 * (part.explodeDir[0] > 0 ? 1 : -1)
    meshRef.current.rotation.y += (targetRotY - meshRef.current.rotation.y) * delta * 3

    // Scale pulse on selected
    if (selected) {
      const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.04
      meshRef.current.scale.setScalar(pulse)
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 5)
    }
  })

  const geo = part.shape === 'cylinder'
    ? <cylinderGeometry args={[part.size[0]/2, part.size[0]/2, part.size[1], 16]} />
    : part.shape === 'sphere'
    ? <sphereGeometry args={[part.size[0]/2, 16, 16]} />
    : <boxGeometry args={part.size} />

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        castShadow
        receiveShadow
      >
        {geo}
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={part.category === 'power' ? 0.8 : 0.2}
          emissive={selected ? color : '#000000'}
          emissiveIntensity={selected ? 0.5 : 0}
        />
      </mesh>

      {/* Sequence number badge */}
      {sequenceNumber !== null && explodeFactor > 0.3 && (
        <mesh position={[targetX, targetY + 1.2, targetZ]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  )
}

function Scene({
  parts,
  selectedId,
  onSelect,
  explodeFactor,
}: {
  parts: MechPart3D[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  explodeFactor: number
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[8, 5, 8]} fov={45} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={4}
        maxDistance={25}
        autoRotate={!selectedId && explodeFactor < 0.1}
        autoRotateSpeed={0.6}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 12, 6]} intensity={1.8} castShadow />
      <directionalLight position={[-6, 6, -6]} intensity={0.6} />
      <pointLight position={[0, 10, 0]} intensity={1} color="#22c55e" />

      {/* Ground grid */}
      <gridHelper args={[24, 24, '#1a1a2e', '#1a1a2e']} position={[0, -1.2, 0]} />

      {parts.map((part, idx) => (
        <PartMesh
          key={part.id}
          part={part}
          selected={selectedId === part.id}
          onClick={() => onSelect(selectedId === part.id ? null : part.id)}
          explodeFactor={explodeFactor}
          sequenceNumber={explodeFactor > 0.5 ? idx + 1 : null}
        />
      ))}

      {/* Center origin marker */}
      {explodeFactor < 0.1 && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.12, 32]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1} side={THREE.DoubleSide} />
        </mesh>
      )}

      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
    </>
  )
}

export default function MechTab() {
  const { project } = useProjectStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewFilter, setViewFilter] = useState<string>('all')
  const [exploded, setExploded] = useState(false)

  // Lerped explode factor for smooth animation
  const [efTarget, setEfTarget] = useState(0)
  const efRef = useRef(0)

  const toggleExplode = () => {
    const next = !exploded
    setExploded(next)
    setEfTarget(next ? 1 : 0)
  }

  const parts3d = useMemo(() => project ? build3DParts(project.name) : [], [project?.name])

  // Animated explode factor driven by useFrame
  const explodeFactor = efRef.current

  const filteredParts = useMemo(() => {
    if (viewFilter === 'all') return parts3d
    const map: Record<string, string[]> = {
      electrical: ['mcu', 'sensor', 'power', 'module'],
      mechanical: ['actuator'],
      structural: ['structural'],
      enclosure: ['enclosure'],
      mechanism: ['actuator', 'structural'],
      misc: ['misc', 'module'],
      '3dprint': ['enclosure', 'structural'],
    }
    const cats = map[viewFilter] ?? []
    return parts3d.filter(p => cats.includes(p.category))
  }, [parts3d, viewFilter])

  const selected = parts3d.find((p) => p.id === selectedId)

  const dimensions = useMemo(() => ({
    x: 200 + (project?.parts.length ?? 0) * 8,
    y: 100 + (project?.parts.length ?? 0) * 12,
    z: 150 + (project?.parts.length ?? 0) * 6,
  }), [project?.parts.length])

  const viewFilters = [
    { key: 'all', label: 'All' },
    { key: 'electrical', label: 'Electrical' },
    { key: 'mechanical', label: 'Mech' },
    { key: 'structural', label: 'Structure' },
    { key: 'enclosure', label: 'Enclosure' },
    { key: '3dprint', label: '3D Print' },
  ]

  return (
    <div className="h-full relative overflow-hidden flex flex-col">
      {/* 3D Canvas */}
      <Canvas
        shadows
        className="!bg-[#09090b]"
        onCreated={({ gl }) => {
          // Smooth explode factor animation via render loop
          const animate = () => {
            efRef.current += (efTarget - efRef.current) * 0.08
            requestAnimationFrame(animate)
          }
          animate()
        }}
      >
        <Scene
          parts={filteredParts}
          selectedId={selectedId}
          onSelect={setSelectedId}
          explodeFactor={explodeFactor}
        />
      </Canvas>

      {/* Selected part card */}
      {selected && (
        <div className="absolute top-4 left-4 bg-[#0a0a0f]/90 border border-[#2a2a3e] rounded-xl px-4 py-3 min-w-[180px] backdrop-blur">
          <p className="text-[10px] font-bold text-[var(--c-accent)] uppercase tracking-wider mb-1">
            {selected.category}
          </p>
          <p className="text-base font-bold text-white">{selected.name}</p>
          <p className="text-xs text-[var(--c-g500)] mt-1">
            {selected.shape} · {selected.size.join('×')}
          </p>
        </div>
      )}

      {/* Controls overlay top-right */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={toggleExplode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            exploded
              ? 'bg-[var(--c-accent)] text-black shadow-lg shadow-[var(--c-accent)]/20'
              : 'bg-[#1a1a2e] text-white border border-[#2a2a3e] hover:bg-[#2a2a3e]'
          }`}
        >
          {exploded ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              收起 / Assemble
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              爆炸图 / Explode
            </>
          )}
        </button>
      </div>

      {/* Instructions overlay when exploded */}
      {exploded && (
        <div className="absolute top-20 right-4 bg-[#0a0a0f]/90 border border-[#2a2a3e] rounded-xl px-4 py-3 max-w-[200px] backdrop-blur">
          <p className="text-[10px] font-bold text-[var(--c-g500)] uppercase tracking-wider mb-2">
            装配顺序 · Assembly
          </p>
          <div className="space-y-1.5">
            {filteredParts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: getCategoryColor(p.category), color: '#fff' }}
                >
                  {i + 1}
                </div>
                <span className="text-xs text-[var(--c-g300)] leading-tight">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint text bottom-left */}
      <div className="absolute bottom-16 left-4 text-[10px] text-[var(--c-g600)]">
        Drag to rotate · Scroll to zoom · Click to highlight · E to toggle explode
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-[var(--c-g800)] bg-[var(--c-bg)]/95 backdrop-blur px-4 py-2 flex items-center justify-between">
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
          <span className="ml-2 text-[var(--c-accent)] uppercase font-bold tracking-wider text-[10px]">
            3D CAD · {filteredParts.length} parts
          </span>
        </div>

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
