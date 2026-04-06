'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useProjectStore } from '@/stores/projectStore'
import { useUserStore } from '@/stores/userStore'
import type { StreamingChunk } from '@/lib/bailian'

const BOM_TRIGGER_KEYWORDS = [
  '生成', '帮我', '设计', '创建', '给我', '我想', 'build', 'create', 'generate', 'design',
]

function isBomRequest(text: string): boolean {
  const lower = text.toLowerCase()
  return BOM_TRIGGER_KEYWORDS.some((kw) => lower.includes(kw))
}

function mapCategory(raw: string): string {
  const l = raw.toLowerCase()
  if (l.includes('mcu') || l.includes('micro') || l.includes('controller')) return 'mcu'
  if (l.includes('sensor')) return 'sensor'
  if (l.includes('actuator') || l.includes('motor') || l.includes('servo')) return 'actuator'
  if (l.includes('power') || l.includes('battery') || l.includes('adapter')) return 'power'
  if (l.includes('module') || l.includes('board')) return 'module'
  if (l.includes('enclosure') || l.includes('外壳')) return 'enclosure'
  if (l.includes('structural') || l.includes('frame') || l.includes('3d')) return 'structural'
  return 'misc'
}

export default function ChatPanel() {
  const { messages, isLoading, addMessage, setLoading } = useChatStore()
  const { project, updateBom, setTab } = useProjectStore()
  const { user } = useUserStore()
  const [inputValue, setInputValue] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [thinking, setThinking] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleBOMGeneration = async (description: string) => {
    // Save current project description to localStorage first
    try {
      const saved = JSON.parse(localStorage.getItem('mic_best_last_project') ?? '{}')
      localStorage.setItem('mic_best_last_project', JSON.stringify({
        ...saved,
        projectName: description,
        bomResult: null, // clear old result
      }))
    } catch {}

    const aiMsgId = `ai-${Date.now()}`
    addMessage({ role: 'assistant', content: '' })
    setThinking('')
    setLoading(true)

    let fullThinking = ''

    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/bom/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || `HTTP ${res.status}`)
      }

      const reader = res.body!.getReader()
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
          if (data === '[DONE]' || data === '[DONE]\n') continue

          try {
            const chunk: StreamingChunk = JSON.parse(data)

            if (chunk.phase === 'thinking') {
              fullThinking += chunk.thinking ?? ''
              setThinking(fullThinking)
              // Update the message content live
              useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, content: `💡 思考中：${fullThinking.slice(-400)}` }
                    : m
                ),
              }))
            }

            if (chunk.phase === 'parsing') {
              setThinking(chunk.progress ?? '正在解析…')
              useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                  m.id === aiMsgId ? { ...m, content: chunk.progress ?? '正在解析…' } : m
                ),
              }))
            }

            if (chunk.phase === 'done' && chunk.result) {
              const { result } = chunk
              const items = (result.items ?? []).map((item) => ({
                name: item.name,
                category: mapCategory(item.category) as any,
                model: item.partNumber || item.name,
                description: item.description ?? '',
                qty: item.quantity ?? 1,
                unitCost: item.unitCost ?? 0,
                lcscId: item.lcscId ?? '',
                hqPartNumber: item.hqPartNumber ?? '',
              }))

              // Persist to localStorage
              try {
                const saved = JSON.parse(localStorage.getItem('mic_best_last_project') ?? '{}')
                localStorage.setItem('mic_best_last_project', JSON.stringify({
                  ...saved,
                  bomResult: result,
                  projectName: result.projectName ?? description,
                }))
              } catch {}

              // Update store (live)
              updateBom(items, result.totalCost ?? 0, result.projectName, result.description)

              const summary = `💡 **设计思路**
${result.reasoning}

✅ **${result.projectName}**
${result.description}

📦 ${items.length} 个元件 · 合计 ¥${result.totalCost}

切换到 **BOM 标签页** 查看完整清单，可直接链接到 LCSC/1688/京东/华强北 采购。`

              useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                  m.id === aiMsgId ? { ...m, content: summary } : m
                ),
              }))

              setThinking('')
              // Switch to BOM tab
              setTab('bom')
            }

            if (chunk.phase === 'error') {
              useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                  m.id === aiMsgId ? { ...m, content: `❌ 错误: ${chunk.error}` } : m
                ),
              }))
              setThinking('')
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        useChatStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.id === aiMsgId ? { ...m, content: '已取消生成。' } : m
          ),
        }))
      } else {
        useChatStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.id === aiMsgId ? { ...m, content: `❌ 请求失败: ${err.message}` } : m
          ),
        }))
      }
      setThinking('')
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    addMessage({ role: 'user', content: userMessage })

    if (isBomRequest(userMessage) && project) {
      await handleBOMGeneration(userMessage)
    } else {
      // Generic chat fallback
      setLoading(true)
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: `我已收到: "${userMessage}"\n\n当前项目有 ${project?.parts.length ?? 0} 个元件。告诉我你想要什么，我会尽力帮你修改！`,
        })
        setLoading(false)
      }, 1000)
    }
  }

  if (collapsed) {
    return (
      <aside className="w-12 border-l border-[var(--c-g800)] bg-[var(--c-bg)] flex flex-col">
        <button
          onClick={() => setCollapsed(false)}
          className="h-12 flex items-center justify-center border-b border-[var(--c-g800)] hover:bg-[var(--c-g800)] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--c-g500)]">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-80 border-l border-[var(--c-g800)] bg-[var(--c-bg)] flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-[var(--c-g800)] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--c-g400)]">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--c-g400)]">Chat</span>
        </div>
        {isLoading && (
          <button
            onClick={() => abortRef.current?.abort()}
            className="text-[10px] text-red-400 hover:text-red-300 font-bold"
          >
            停止
          </button>
        )}
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 hover:bg-[var(--c-g800)] rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--c-g500)]">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-[var(--c-g600)] text-center mt-8">
            描述你的项目，我来帮你生成 BOM
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm whitespace-pre-wrap ${
              msg.role === 'system'
                ? 'text-[var(--c-g600)] italic'
                : msg.role === 'user'
                ? 'text-[var(--c-text)]'
                : 'text-[var(--c-g300)]'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && thinking && (
          <div className="text-sm text-[var(--c-g500)] italic animate-pulse">
            {thinking.length > 150 ? '…' + thinking.slice(-150) : thinking}
          </div>
        )}
        {isLoading && !thinking && (
          <div className="text-sm text-[var(--c-g600)] animate-pulse">
            ⚡ 正在生成…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Credits indicator */}
      {user && (
        <div className="px-3 py-1.5 border-t border-[var(--c-g800)] flex items-center gap-2 text-[10px] text-[var(--c-g600)]">
          <span>⚡</span>
          <span>{user.credits} credits</span>
          {user.plan === 'pro' && <span className="text-[var(--c-accent)]">· PRO</span>}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[var(--c-g800)]">
        <div className="robot-border rounded-lg flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="> 描述你的项目…"
            className="flex-1 bg-transparent px-3 py-2 text-sm placeholder-[var(--c-g600)] focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            className="m-1 p-2 hover:bg-[var(--c-g800)] transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--c-g400)]">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
