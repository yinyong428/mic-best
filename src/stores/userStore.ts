import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface UserStore {
  user: User | null
  isLoading: boolean

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateCredits: (credits: number) => void
  setUser: (user: User) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email: string, _password: string) => {
        set({ isLoading: true })
        await new Promise((r) => setTimeout(r, 600))
        const mockUsers: Record<string, User> = {
          'olly@example.com': {
            id: 'user-1',
            email: 'olly@example.com',
            username: 'olly',
            credits: 8,
            plan: 'pro',
          },
        }
        const user = mockUsers[email.toLowerCase()]
        if (user) {
          set({ user, isLoading: false })
          return { success: true }
        }
        // Auto-create for demo
        const newUser: User = {
          id: `user-${Date.now()}`,
          email,
          username: email.split('@')[0],
          credits: 5,
          plan: 'free',
        }
        set({ user: newUser, isLoading: false })
        return { success: true }
      },

      signup: async (email: string, _password: string, username: string) => {
        set({ isLoading: true })
        await new Promise((r) => setTimeout(r, 800))
        const newUser: User = {
          id: `user-${Date.now()}`,
          email,
          username: username || email.split('@')[0],
          credits: 5,
          plan: 'free',
        }
        set({ user: newUser, isLoading: false })
        return { success: true }
      },

      logout: () => set({ user: null }),

      updateCredits: (credits: number) =>
        set((state) => ({
          user: state.user ? { ...state.user, credits } : null,
        })),

      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'mic-user-storage',
    }
  )
)
