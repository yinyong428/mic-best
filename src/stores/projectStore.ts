import { create } from 'zustand'
import type { Project, ProjectTab, Part } from '@/types'

interface ProjectStore {
  // Current project
  project: Project | null
  setProject: (project: Project | null) => void
  setProjectImage: (imageUrl: string) => void

  // Active tab
  activeTab: ProjectTab
  setTab: (tab: ProjectTab) => void

  // Selected part (for highlighting in 3D view)
  selectedPartId: string | null
  selectPart: (id: string | null) => void

  // BOM filter
  bomFilter: 'all' | 'electrical' | 'mechanical'
  setBomFilter: (filter: ProjectStore['bomFilter']) => void

  // BOM view mode
  bomView: 'table' | 'cards'
  setBomView: (view: ProjectStore['bomView']) => void

  // Parts list collapsed
  partsListCollapsed: boolean
  togglePartsList: () => void

  // Update part quantity
  updatePartQty: (partId: string, qty: number) => void

  // Update BOM from AI generation (items without id — id is assigned by the store)
  updateBom: (items: Omit<Part, 'id'>[], totalCost: number, projectName?: string, description?: string) => void

  // Persist to backend
  saveProject: () => Promise<{ success: boolean; error?: string }>
  loadProject: (id: string) => Promise<{ success: boolean; error?: string }>
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  setProject: (project) =>
    set((state) => {
      if (!project) return { project: null }
      return {
        project: {
          ...(state.project ?? {}),
          ...project,
          // Always preserve these from current state
          id: project.id ?? state.project?.id,
          author: project.author ?? state.project?.author,
          createdAt: project.createdAt ?? state.project?.createdAt,
          updatedAt: new Date().toISOString(),
          instructions: project.instructions ?? state.project?.instructions ?? [],
          wiringNodes: project.wiringNodes ?? state.project?.wiringNodes ?? [],
          wiringEdges: project.wiringEdges ?? state.project?.wiringEdges ?? [],
        },
      }
    }),

  setProjectImage: (imageUrl) =>
    set((state) => {
      if (!state.project) return state
      return { project: { ...state.project, imageUrl } }
    }),

  activeTab: 'info',
  setTab: (tab) => set({ activeTab: tab }),

  selectedPartId: null,
  selectPart: (id) => set({ selectedPartId: id }),

  bomFilter: 'all',
  setBomFilter: (filter) => set({ bomFilter: filter }),

  bomView: 'table',
  setBomView: (view) => set({ bomView: view }),

  partsListCollapsed: false,
  togglePartsList: () => set((s) => ({ partsListCollapsed: !s.partsListCollapsed })),

  updatePartQty: (partId, qty) =>
    set((state) => {
      if (!state.project) return state
      const parts = state.project.parts.map((p) =>
        p.id === partId ? { ...p, qty } : p
      )
      const totalCost = parts.reduce((sum, p) => sum + p.unitCost * p.qty, 0)
      return { project: { ...state.project, parts, totalCost } }
    }),

  updateBom: (items, totalCost, projectName, description) =>
    set((state) => {
      if (!state.project) return { project: null }
      const parts = items.map((item, i) => ({
        id: `part-${Date.now()}-${i}`,
        name: item.name,
        category: item.category,
        model: item.model ?? item.name,
        description: item.description ?? '',
        qty: item.qty,
        unitCost: item.unitCost ?? 0,
      }))
      // Preserve existing instructions — only replace when explicitly generated
      const existingInstructions = state.project.instructions ?? []
      return {
        project: {
          id: state.project.id,
          name: projectName ?? state.project.name,
          description: description ?? state.project.description,
          parts,
          totalCost,
          status: state.project.status,
          author: state.project.author,
          createdAt: state.project.createdAt,
          updatedAt: new Date().toISOString(),
          instructions: existingInstructions,
          wiringNodes: state.project.wiringNodes ?? [],
          wiringEdges: state.project.wiringEdges ?? [],
          imageUrl: state.project.imageUrl,
        },
      }
    }),

  saveProject: async () => {
    const { project } = get()
    if (!project) return { success: false, error: 'No project to save' }

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          parts: project.parts,
          wiring_nodes: project.wiringNodes ?? [],
          wiring_edges: project.wiringEdges ?? [],
          instructions: project.instructions ?? [],
          image_url: project.imageUrl,
          total_cost: project.totalCost,
          status: project.status,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        return { success: false, error: err.error ?? 'Save failed' }
      }

      const updated = await res.json()
      // Merge updated fields back (especially updated_at)
      set((state) => ({
        project: state.project
          ? { ...state.project, updatedAt: updated.updated_at ?? new Date().toISOString() }
          : null,
      }))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  loadProject: async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        headers: { 'x-user-id': 'demo-user' },
      })
      if (!res.ok) {
        const err = await res.json()
        return { success: false, error: err.error ?? 'Load failed' }
      }
      const data = await res.json()
      const project: Project = {
        id: data.id,
        name: data.name,
        description: data.description ?? '',
        parts: data.parts ?? [],
        totalCost: data.total_cost ?? 0,
        status: data.status ?? 'draft',
        author: data.author ?? 'unknown',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        wiringNodes: data.wiring_nodes ?? [],
        wiringEdges: data.wiring_edges ?? [],
        instructions: data.instructions ?? [],
        imageUrl: data.image_url ?? undefined,
      }
      set({ project })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },
}))
