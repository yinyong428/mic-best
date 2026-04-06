// Core Types for MIC.BEST

export type PartCategory =
  | 'mcu'
  | 'sensor'
  | 'actuator'
  | 'power'
  | 'module'
  | 'structural'
  | 'enclosure'
  | 'mechanism'
  | 'misc'
  | '3d_print'

export type ProjectTab = 'info' | 'bom' | 'wiring' | 'mech' | 'instructions' | 'part'

export type NodeType = 'mcu' | 'sensor' | 'actuator' | 'power' | 'module' | 'display' | 'data'

export interface Pin {
  name: string
  type: 'power' | 'ground' | 'gpio' | 'signal'
  voltage?: string
}

export interface Part {
  id: string
  name: string
  category: PartCategory
  model: string
  description?: string
  qty: number
  unitCost: number
  imageUrl?: string
  printSpecs?: {
    material: string
    layerHeight: string
    infill: string
  }
  lcscId?: string
  hqPartNumber?: string
  position3d?: { x: number; y: number; z: number }
}

export interface WiringConnection {
  from: string
  to: string
  voltage: string
  interface: string
}

export interface WiringNode {
  id: string
  type: NodeType
  label: string
  model: string
  position: { x: number; y: number }
  pins: Pin[]
  imageUrl?: string
}

export interface WiringEdge {
  id: string
  source: string
  target: string
  voltage: string
  label?: string
}

export interface Instruction {
  step: number
  title: string
  description: string
  partIds: string[]
  tools?: string[]
  tips?: string
}

export interface Project {
  id: string
  name: string
  description: string
  parts: Part[]
  totalCost: number
  status: 'draft' | 'published'
  author: string
  createdAt: string
  updatedAt: string
  instructions?: Instruction[]
  wiringNodes?: WiringNode[]
  wiringEdges?: WiringEdge[]
  imageUrl?: string
  tags?: string[]
  starCount?: number
  copyCount?: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  username: string
  avatarUrl?: string
  credits: number
  plan: 'free' | 'pro'
}
