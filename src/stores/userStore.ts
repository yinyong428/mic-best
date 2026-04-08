import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { supabase } from '@/lib/supabase'

interface UserStore {
  user: User | null
  isLoading: boolean

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateCredits: (credits: number) => void
  setUser: (user: User) => void
  fetchProfile: (userId: string) => Promise<void>
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        const client = supabase.client
        if (!client) {
          set({ isLoading: false })
          return { success: false, error: 'Supabase not configured' }
        }

        const { data, error } = await client.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }

        if (data.user) {
          // Fetch profile
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          const user: User = {
            id: data.user.id,
            email: data.user.email ?? email,
            username: profile?.nickname ?? email.split('@')[0],
            credits: profile?.credits ?? 5,
            plan: profile?.plan ?? 'free',
          }
          set({ user, isLoading: false })
          return { success: true }
        }

        set({ isLoading: false })
        return { success: false, error: 'Login failed' }
      },

      signup: async (email: string, password: string, username: string) => {
        set({ isLoading: true })
        const client = supabase.client
        if (!client) {
          set({ isLoading: false })
          return { success: false, error: 'Supabase not configured' }
        }

        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { nickname: username },
          },
        })

        if (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }

        if (data.user) {
          const user: User = {
            id: data.user.id,
            email: data.user.email ?? email,
            username: username || email.split('@')[0],
            credits: 5,
            plan: 'free',
          }
          set({ user, isLoading: false })
          return { success: true }
        }

        set({ isLoading: false })
        return { success: false, error: 'Signup failed' }
      },

      logout: async () => {
        const client = supabase.client
        if (client) {
          await client.auth.signOut()
        }
        set({ user: null })
      },

      updateCredits: (credits: number) =>
        set((state) => ({
          user: state.user ? { ...state.user, credits } : null,
        })),

      setUser: (user: User) => set({ user }),

      fetchProfile: async (userId: string) => {
        const client = supabase.client
        if (!client) return

        const { data: profile } = await client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profile) {
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  username: profile.nickname ?? state.user.username,
                  credits: profile.credits ?? state.user.credits,
                  plan: profile.plan ?? state.user.plan,
                }
              : null,
          }))
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true })
        const client = supabase.client
        if (!client) {
          set({ isLoading: false })
          return { success: false, error: 'Supabase not configured' }
        }

        const { error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }

        // Redirect happens automatically
        return { success: true }
      },
    }),
    {
      name: 'mic-user-storage',
    }
  )
)
