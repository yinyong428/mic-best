import { create } from 'zustand'
import { StreamingChunk, BOMResult } from '@/lib/bailian'
import { useProjectStore } from '@/stores/projectStore'

type Phase = 'idle' | 'thinking' | 'approved' | 'generating' | 'done' | 'error'

interface BOMStore {
  phase: Phase
  result: BOMResult | null
  error: string | null
  thinking: string
  progress: string
  imageUrl: string | null
  imageLoading: boolean

  generate: (description: string) => Promise<void>
  approve: () => void
  reset: () => void
}

export const useBOMStore = create<BOMStore>((set) => ({
  phase: 'idle',
  result: null,
  error: null,
  thinking: '',
  progress: '',
  imageUrl: null,
  imageLoading: false,

  generate: async (description: string, skipImageGen = false) => {
    set({ phase: 'thinking', error: null, thinking: '', progress: '', result: null, imageUrl: null, imageLoading: false })

    try {
      const res = await fetch('/api/bom/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })

      if (!res.ok) {
        const data = await res.json()
        set({ phase: 'error', error: data.error ?? 'Generation failed' })
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (!reader) {
        set({ phase: 'error', error: 'No response body' })
        return
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]' || !data) continue

          try {
            const chunk: StreamingChunk = JSON.parse(data)

            if (chunk.phase === 'thinking') {
              set((state) => ({ thinking: state.thinking + (chunk.thinking ?? '') }))
            } else if (chunk.phase === 'parsing') {
              // BOM JSON is streaming — transition to 'approved' state
              // Store the result for later, don't auto-complete yet
              set({ phase: 'approved', progress: chunk.progress ?? '' })
            } else if (chunk.phase === 'done') {
              const bomResult = chunk.result ?? null
              const { phase } = useBOMStore.getState()
              if (phase === 'approved' && bomResult) {
                // User hasn't approved yet — store result and wait
                // Don't transition to 'done' yet; approve() will handle it
                useBOMStore.setState({ result: bomResult })
                return
              }
              if (bomResult) {
                set({ phase: 'done', result: bomResult, progress: chunk.progress ?? '' })
                triggerImageGen(bomResult.description ?? description, bomResult.projectName ?? '')
              }
            } else if (chunk.phase === 'error') {
              set({ phase: 'error', error: chunk.error ?? 'Unknown error' })
            }
          } catch {
            // Skip
          }
        }
      }
    } catch (err) {
      set({ phase: 'error', error: err instanceof Error ? err.message : 'Network error' })
    }
  },

  approve: () => {
    const { thinking, result } = useBOMStore.getState()
    if (!thinking) return
    if (result) {
      // BOM result already available from first stream — use it directly
      set({ phase: 'generating' })
      set({ phase: 'done', result, progress: '已生成完毕' })
      try {
        localStorage.setItem('mic_best_last_project', JSON.stringify({
          bomResult: result,
          description: result.description ?? '',
          projectName: result.projectName ?? '',
          imageUrl: '',
        }))
      } catch {}
      triggerImageGen(result.description ?? '', result.projectName ?? '')
    } else {
      // Fallback: call API again
      set({ phase: 'generating' })
      triggerBOMGeneration(true)
    }
  },

  reset: () => set({ phase: 'idle', result: null, error: null, thinking: '', progress: '', imageUrl: null, imageLoading: false }),
}))

async function triggerBOMGeneration(skipImageGen = false) {
  const store = useBOMStore.getState()
  const saved = JSON.parse(localStorage.getItem('mic_best_last_project') ?? '{}')
  const description = saved.description ?? ''
  useBOMStore.setState({ phase: 'generating', progress: '正在生成 BOM…', thinking: '', result: null, error: null })
  try {
    const res = await fetch('/api/bom/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    })
    if (!res.ok) {
      const data = await res.json()
      useBOMStore.setState({ phase: 'error', error: data.error ?? 'Generation failed' })
      return
    }
    const reader = res.body?.getReader()
    if (!reader) { useBOMStore.setState({ phase: 'error', error: 'No response body' }); return }
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]' || !data) continue
        try {
          const chunk = JSON.parse(data)
          if (chunk.phase === 'parsing') {
            useBOMStore.setState({ progress: '正在解析 BOM…' })
          } else if (chunk.phase === 'done') {
            const bomResult = chunk.result ?? null
            useBOMStore.setState({ phase: 'done', result: bomResult, progress: chunk.progress ?? '' })
            if (bomResult) {
              try {
                localStorage.setItem('mic_best_last_project', JSON.stringify({
                  bomResult, description: bomResult.description ?? description,
                  projectName: bomResult.projectName ?? '', imageUrl: '',
                }))
              } catch {}
              if (!skipImageGen) {
                triggerImageGen(bomResult.description ?? description, bomResult.projectName ?? '')
              }
            }
          } else if (chunk.phase === 'error') {
            useBOMStore.setState({ phase: 'error', error: chunk.error ?? 'Unknown error' })
          }
        } catch {}
      }
    }
  } catch (err) {
    useBOMStore.setState({ phase: 'error', error: err instanceof Error ? err.message : 'Network error' })
  }
}

async function triggerImageGen(description: string, projectName: string) {
  console.log('[triggerImageGen] starting, description:', description, 'projectName:', projectName)
  useBOMStore.setState({ imageLoading: true })
  try {
    const res = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: description, projectName }),
    })
    const data = await res.json()
    console.log('[triggerImageGen] result:', data)
    if (data.success && data.imageUrl) {
      useBOMStore.setState({ imageUrl: data.imageUrl, imageLoading: false })
      useProjectStore.getState().setProjectImage(data.imageUrl)
      try {
        const saved = JSON.parse(localStorage.getItem('mic_best_last_project') ?? '{}')
        saved.imageUrl = data.imageUrl
        localStorage.setItem('mic_best_last_project', JSON.stringify(saved))
      } catch {}
    } else {
      useBOMStore.setState({ imageLoading: false })
    }
  } catch (err) {
    console.error('[image] generation error:', err)
    useBOMStore.setState({ imageLoading: false })
  }
}
