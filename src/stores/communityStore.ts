import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CommunityStore {
  favorites: Set<string>
  copiedProjects: Set<string>
  starCounts: Record<string, number>

  toggleFavorite: (projectId: string) => void
  isFavorited: (projectId: string) => boolean
  copyProject: (projectId: string) => Promise<{ success: boolean; newProjectId?: string; error?: string }>
  isCopied: (projectId: string) => boolean
  clearCopiedFlag: (projectId: string) => void
}

export const useCommunityStore = create<CommunityStore>()(
  persist(
    (set, get) => ({
      favorites: new Set<string>(),
      copiedProjects: new Set<string>(),
      starCounts: {
        'community-1': 142,
        'community-2': 89,
        'community-3': 56,
        'community-4': 203,
        'community-5': 78,
        'community-6': 34,
        'community-7': 167,
        'community-8': 91,
      },

      toggleFavorite: (projectId) =>
        set((state) => {
          const newFavorites = new Set(state.favorites)
          if (newFavorites.has(projectId)) {
            newFavorites.delete(projectId)
          } else {
            newFavorites.add(projectId)
          }
          return { favorites: newFavorites }
        }),

      isFavorited: (projectId) => get().favorites.has(projectId),

      copyProject: async (projectId) => {
        // Simulate API call - in real app, this calls the backend to fork the project
        await new Promise((resolve) => setTimeout(resolve, 800))
        const mockNewId = `my-${projectId}-${Date.now()}`
        set((state) => ({
          copiedProjects: new Set([...state.copiedProjects, projectId]),
        }))
        return { success: true, newProjectId: mockNewId }
      },

      isCopied: (projectId) => get().copiedProjects.has(projectId),

      clearCopiedFlag: (projectId) =>
        set((state) => {
          const newCopied = new Set(state.copiedProjects)
          newCopied.delete(projectId)
          return { copiedProjects: newCopied }
        }),
    }),
    {
      name: 'mic-community-storage',
      partialize: (state) => ({
        favorites: Array.from(state.favorites),
      }),
      merge: (persisted: unknown, current) => {
        const persistedState = persisted as { favorites?: string[] } | undefined
        return {
          ...current,
          favorites: new Set(persistedState?.favorites ?? []),
          copiedProjects: new Set<string>(),
        }
      },
    }
  )
)
