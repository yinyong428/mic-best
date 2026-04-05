import { create } from 'zustand'
import type { User } from '@/types'

interface UserStore {
  user: User | null
  isAuthenticated: boolean

  setUser: (user: User | null) => void
  deductCredits: (amount: number) => void
  addCredits: (amount: number) => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  deductCredits: (amount) =>
    set((state) => {
      if (!state.user) return state
      return {
        user: {
          ...state.user,
          credits: Math.max(0, state.user.credits - amount),
        },
      }
    }),

  addCredits: (amount) =>
    set((state) => {
      if (!state.user) return state
      return {
        user: {
          ...state.user,
          credits: state.user.credits + amount,
        },
      }
    }),
}))
