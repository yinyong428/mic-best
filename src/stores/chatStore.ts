import { create } from 'zustand'
import type { Message } from '@/types'

interface ChatStore {
  messages: Message[]
  isLoading: boolean

  addMessage: (msg: Omit<Message, 'id' | 'createdAt'>) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [
    {
      id: 'sys-init',
      role: 'system',
      content: '[SYSTEM] Loaded project: Garbage Robot',
      createdAt: '2026-04-05T00:00:00.000Z',
    },
  ],
  isLoading: false,

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...msg,
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: () =>
    set({
      messages: [
        {
          id: 'sys-cleared',
          role: 'system',
          content: '[SYSTEM] Chat cleared',
          createdAt: '2026-04-05T00:00:00.000Z',
        },
      ],
    }),
}))
