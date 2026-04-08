'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

// PCB-style grid lines floating in 3D space
function PCBRGrid({ position }: { position: [number, number, number] }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    // Horizontal lines
    for (let i = -5; i <= 5; i++) {
      pts.push(new THREE.Vector3(-6, i * 0.6, 0))
      pts.push(new THREE.Vector3(6, i * 0.6, 0))
    }
    // Vertical lines
    for (let i = -10; i <= 10; i++) {
      pts.push(new THREE.Vector3(i * 0.6, -3, 0))
      pts.push(new THREE.Vector3(i * 0.6, 3, 0))
    }
    return pts
  }, [])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points)
    return g
  }, [points])

  return (
    <lineSegments geometry={geometry} position={position}>
      <lineBasicMaterial color="#1a4731" transparent opacity={0.4} />
    </lineSegments>
  )
}

// Single PCB trace line
function TraceLine({ start, end, color = '#22c55e' }: {
  start: [number, number, number]
  end: [number, number, number]
  color?: string
}) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ], [start, end])

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [points])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.5} />
    </lineSegments>
  )
}

// Floating chip component
function Chip({ position, size = [1, 0.1, 0.6], color = '#22c55e' }: {
  position: [number, number, number]
  size?: [number, number, number]
  color?: string
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + position[0]) * 0.15
  })

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <mesh ref={ref} position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  )
}

// Floating capacitor
function Capacitor({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + position[1]) * 0.2
  })

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
      <group ref={ref} position={position}>
        {/* Body */}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.25, 8]} />
          <meshStandardMaterial color="#22c55e" metalness={0.7} roughness={0.4} transparent opacity={0.7} />
        </mesh>
        {/* Top cap */}
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#16a34a" metalness={0.9} roughness={0.2} transparent opacity={0.8} />
        </mesh>
      </group>
    </Float>
  )
}

// Floating connector/pin row
function PinRow({ position }: { position: [number, number, number] }) {
  const pins = 6
  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
      <group position={position}>
        {Array.from({ length: pins }).map((_, i) => (
          <mesh key={i} position={[(i - pins / 2) * 0.15, 0, 0]}>
            <boxGeometry args={[0.04, 0.04, 0.2]} />
            <meshStandardMaterial color="#4ade80" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
    </Float>
  )
}

// Glowing dot / LED
function LED({ position, color = '#22c55e' }: { position: [number, number, number]; color?: string }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    const s = 0.8 + Math.sin(state.clock.elapsedTime * 2 + position[0] * 5) * 0.2
    ref.current.scale.setScalar(s)
  })

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

// Background scene content
function Scene() {
  return (
    <>
      {/* Ambient + directional lights */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#22c55e" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#3b82f6" />

      {/* PCB Grids at different depths */}
      <PCBRGrid position={[0, 0, -8]} />
      <PCBRGrid position={[3, -2, -12]} />
      <PCBRGrid position={[-4, 2, -10]} />

      {/* Trace lines */}
      <TraceLine start={[-3, -1.5, -6]} end={[2, -1.5, -6]} color="#166534" />
      <TraceLine start={[1, 0.5, -7]} end={[4, 2, -7]} color="#15803d" />
      <TraceLine start={[-4, 1, -9]} end={[-1, 1, -9]} color="#22c55e" />
      <TraceLine start={[-2, -2, -8]} end={[1, 0, -8]} color="#4ade80" />
      <TraceLine start={[2, 1.5, -6]} end={[3.5, 3, -6]} color="#166534" />

      {/* Chips / ICs */}
      <Chip position={[-2.5, 1.5, -5]} size={[1.2, 0.1, 0.8]} color="#166534" />
      <Chip position={[2, -1, -6]} size={[0.8, 0.1, 0.5]} color="#22c55e" />
      <Chip position={[0.5, 2.5, -7]} size={[0.6, 0.08, 0.4]} color="#15803d" />
      <Chip position={[-1, -2, -5.5]} size={[1.0, 0.1, 0.6]} color="#14532d" />

      {/* Capacitors */}
      <Capacitor position={[-1.5, -1, -5]} />
      <Capacitor position={[1.5, 1, -6]} />
      <Capacitor position={[3, -0.5, -7.5]} />
      <Capacitor position={[-3, 0.5, -6.5]} />

      {/* Pin rows */}
      <PinRow position={[-2, 2, -5.5]} />
      <PinRow position={[1, -2.5, -6]} />

      {/* LEDs */}
      <LED position={[-3.5, -0.5, -5]} color="#22c55e" />
      <LED position={[2.5, 2, -6.5]} color="#4ade80" />
      <LED position={[0, -2.5, -5]} color="#16a34a" />
      <LED position={[-1.5, 2.5, -7]} color="#22c55e" />
      <LED position={[3.5, 0, -8]} color="#4ade80" />
    </>
  )
}

export default function ThreeBackground() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <Scene />
    </Canvas>
  )
}
