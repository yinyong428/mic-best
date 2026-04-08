'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'
import { getCategoryColor } from '@/lib/mockData'

interface Part {
  id: string
  name: string
  category: string
  model: string
  description?: string
}

interface Viewer3DProps {
  part: Part | null
  onClose: () => void
}

function getShapeGeometry(category: string, model: string) {
  const m = model.toLowerCase()
  const lowerName = `${category}-${m}`

  // MCU — chip/board shape
  if (category === 'mcu') {
    return { type: 'chip' as const, color: getCategoryColor('mcu') }
  }
  // Sensor
  if (category === 'sensor') {
    if (m.includes('ultrasonic') || m.includes('hc-sr')) {
      return { type: 'ultrasonic' as const, color: getCategoryColor('sensor') }
    }
    if (m.includes('camera') || m.includes('pi cam')) {
      return { type: 'camera' as const, color: getCategoryColor('sensor') }
    }
    if (m.includes('temp') || m.includes('dht')) {
      return { type: 'dht' as const, color: getCategoryColor('sensor') }
    }
    return { type: 'sensor' as const, color: getCategoryColor('sensor') }
  }
  // Actuator
  if (category === 'actuator') {
    if (m.includes('servo') || m.includes('sg90') || m.includes('mg')) {
      return { type: 'servo' as const, color: getCategoryColor('actuator') }
    }
    if (m.includes('motor') || m.includes('nema') || m.includes('stepper')) {
      return { type: 'motor' as const, color: getCategoryColor('actuator') }
    }
    return { type: 'actuator' as const, color: getCategoryColor('actuator') }
  }
  // Power
  if (category === 'power') {
    if (m.includes('battery') || m.includes('18650')) {
      return { type: 'battery' as const, color: getCategoryColor('power') }
    }
    return { type: 'power' as const, color: getCategoryColor('power') }
  }
  // Module
  if (category === 'module') {
    if (m.includes('oled') || m.includes('ssd')) {
      return { type: 'oled' as const, color: getCategoryColor('module') }
    }
    if (m.includes('motor') || m.includes('driver') || m.includes('l298') || m.includes('drv')) {
      return { type: 'driver' as const, color: getCategoryColor('module') }
    }
    return { type: 'module' as const, color: getCategoryColor('module') }
  }
  // Structural
  if (category === 'structural') {
    return { type: 'extrusion' as const, color: getCategoryColor('structural') }
  }
  // Enclosure
  if (category === 'enclosure') {
    return { type: 'enclosure' as const, color: getCategoryColor('enclosure') }
  }
  // 3D Print
  if (category === '3d_print') {
    return { type: 'print' as const, color: getCategoryColor('3d_print') }
  }
  return { type: 'generic' as const, color: getCategoryColor('misc') }
}

function ChipMesh({ color }: { color: string }) {
  return (
    <group>
      {/* Main PCB */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.08, 1.0]} />
        <meshStandardMaterial color="#1a5f3c" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Main chip */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.7, 0.18, 0.7]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} emissive="#0a2a1a" emissiveIntensity={0.3} />
      </mesh>
      {/* Pin row left */}
      {[-0.55, -0.35, -0.15, 0.05, 0.25, 0.45].map((x, i) => (
        <mesh key={`pl${i}`} position={[x, 0, 0.52]} castShadow>
          <boxGeometry args={[0.06, 0.08, 0.12]} />
          <meshStandardMaterial color="#c0a060" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}
      {/* Pin row right */}
      {[-0.55, -0.35, -0.15, 0.05, 0.25, 0.45].map((x, i) => (
        <mesh key={`pr${i}`} position={[x, 0, -0.52]} castShadow>
          <boxGeometry args={[0.06, 0.08, 0.12]} />
          <meshStandardMaterial color="#c0a060" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function UltrasonicMesh({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.25, 16]} />
        <meshStandardMaterial color="#c8c8c8" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* transducer caps */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.08, 16]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0, -0.12, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.08, 16]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.3} metalness={0.3} />
      </mesh>
    </group>
  )
}

function ServoMesh({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.3
  })
  return (
    <group ref={ref}>
      {/* body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.42, 0.22]} />
        <meshStandardMaterial color="#c0a030" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* top cap */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.55, 0.04, 0.22]} />
        <meshStandardMaterial color="#a08020" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* servo arm */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.9, 0.05, 0.08]} />
        <meshStandardMaterial color="#d0b040" roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  )
}

function MotorMesh({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.5
  })
  return (
    <group ref={ref}>
      {/* body cylinder */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 1.0, 16]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* shaft */}
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.35, 8]} />
        <meshStandardMaterial color="#888" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* mounting flange */}
      <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.06, 16]} />
        <meshStandardMaterial color="#333" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  )
}

function BatteryMesh({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.7, 1.8, 0.7]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* top cap */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.1, 16]} />
        <meshStandardMaterial color="#cc3300" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* label stripe */}
      <mesh position={[0, 0, 0.36]} castShadow>
        <boxGeometry args={[0.6, 1.4, 0.02]} />
        <meshStandardMaterial color="#cc3300" roughness={0.6} metalness={0.1} />
      </mesh>
    </group>
  )
}

function OledMesh({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.08, 0.45]} />
        <meshStandardMaterial color="#0a3040" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* display area */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[0.65, 0.04, 0.32]} />
        <meshStandardMaterial color="#001133" roughness={0.1} metalness={0.0} emissive="#002266" emissiveIntensity={0.8} />
      </mesh>
      {/* PCB traces */}
      {[-0.25, 0, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 0.06, 0]} castShadow>
          <boxGeometry args={[0.04, 0.01, 0.35]} />
          <meshStandardMaterial color="#c0a000" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function DriverMesh({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.12, 0.75]} />
        <meshStandardMaterial color="#1a5c3a" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* big chip */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.45, 0.15, 0.45]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* heatsink fins */}
      {[-0.35, -0.15, 0.05, 0.25, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0]} castShadow>
          <boxGeometry args={[0.04, 0.12, 0.6]} />
          <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function ExtrusionMesh({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.35, 2.0, 0.35]} />
        <meshStandardMaterial color="#888" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* T-slot groove */}
      <mesh position={[0, 0, 0.14]} castShadow>
        <boxGeometry args={[0.18, 1.9, 0.06]} />
        <meshStandardMaterial color="#aaa" roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  )
}

function GenericMesh({ color }: { color: string }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1, 0.4, 0.6]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} emissive={color} emissiveIntensity={0.15} />
    </mesh>
  )
}

function PartGeometry({ category, model }: { category: string; model: string }) {
  const { type, color } = getShapeGeometry(category, model)

  switch (type) {
    case 'chip': return <ChipMesh color={color} />
    case 'ultrasonic': return <UltrasonicMesh color={color} />
    case 'servo': return <ServoMesh color={color} />
    case 'motor': return <MotorMesh color={color} />
    case 'battery': return <BatteryMesh color={color} />
    case 'oled': return <OledMesh color={color} />
    case 'driver': return <DriverMesh color={color} />
    case 'extrusion': return <ExtrusionMesh color={color} />
    default: return <GenericMesh color={color} />
  }
}

function PartScene({ part }: { part: Part }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[2.5, 1.5, 2.5]} fov={45} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={1.5}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={1.5}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-3, 4, -3]} intensity={0.5} />
      <pointLight position={[0, 3, 0]} intensity={0.8} color={getCategoryColor(part.category)} />
      <gridHelper args={[8, 8, '#1a1a2e', '#1a1a2e']} position={[0, -1.2, 0]} />
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <PartGeometry category={part.category} model={part.model} />
      </Float>
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
    </>
  )
}

export default function PartViewer3D({ part, onClose }: Viewer3DProps) {
  if (!part) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-[560px] max-w-[90vw] rounded-2xl border border-[#2a2a3e] bg-[#0a0a0f] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getCategoryColor(part.category) }}
            />
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{part.name}</h3>
              <p className="text-[11px] text-[var(--c-g500)] font-mono">{part.model}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] px-2 py-0.5 rounded font-bold"
              style={{
                backgroundColor: `${getCategoryColor(part.category)}20`,
                color: getCategoryColor(part.category),
              }}
            >
              3D VIEWER
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1e1e2e] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--c-g500)]">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="h-[380px] relative">
          <Canvas
            shadows
            className="!bg-[#09090b]"
          >
            <PartScene part={part} />
          </Canvas>

          {/* Hint */}
          <div className="absolute bottom-3 left-4 text-[10px] text-[var(--c-g600)]">
            Drag to rotate · Scroll to zoom · ESC to close
          </div>

          {/* Category badge overlay */}
          <div className="absolute top-3 left-4">
            <span
              className="text-[10px] px-2 py-1 rounded-lg font-bold"
              style={{
                backgroundColor: `${getCategoryColor(part.category)}25`,
                color: getCategoryColor(part.category),
                border: `1px solid ${getCategoryColor(part.category)}40`,
              }}
            >
              {part.category.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Part info */}
        <div className="px-5 py-4 border-t border-[#1e1e2e]">
          {part.description && (
            <p className="text-xs text-[var(--c-g500)] leading-relaxed mb-3">
              {part.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-[11px] text-[var(--c-g600)]">
            <span className="font-mono">ID: {part.id.slice(0, 16)}…</span>
            <span>·</span>
            <span>Model: {part.model}</span>
            <span>·</span>
            <span
              className="capitalize"
              style={{ color: getCategoryColor(part.category) }}
            >
              {part.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
