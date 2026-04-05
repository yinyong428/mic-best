import { create } from 'zustand'
import type { Project, ProjectTab, Part } from '@/types'

interface ProjectStore {
  // Current project
  project: Project | null
  setProject: (project: Project | null) => void

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
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: null,
  setProject: (project) => set({ project }),

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
}))
