'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useProjectStore } from '@/stores/projectStore'
import { useUserStore } from '@/stores/userStore'
import type { StreamingChunk, BOMItem } from '@/lib/bailian'
import type { LCSCPart } from '@/lib/lcsc'
import PartViewer3D from '@/components/project/PartViewer3D'
import type { Part } from '@/types'

// ─── Keyword detection ─────────────────────────────────────────────────────────

const BOM_MODIFY_KEYWORDS = [
  '加', '添加', '增加', '加上', '加一个',
  '替换', '换成', '把', '改成', '改为', '换掉',
  '删除', '移除', '不要', '删掉',
  '修改', '调整', '更新', '增加数量', '减少数量', '改变数量',
]

function detectMode(text: string, hasParts: boolean): 'generate' | 'modify' {
  const lower = text.toLowerCase()
  const isGenerate = ['生成', '帮我', '设计', '创建', '新项目', '重新生成', '重新设计', 'build', 'create', 'generate'].some(
    (kw) => lower.includes(kw)
  )
  if (!hasParts) return 'generate'
  const isModify = BOM_MODIFY_KEYWORDS.some((kw) => lower.includes(kw))
  return isModify ? 'modify' : 'generate'
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

function bomItemToPart(item: BOMItem) {
  return {
    name: item.name,
    category: mapCategory(item.category) as any,
    model: item.partNumber || item.name,
    description: item.description ?? '',
    qty: item.quantity ?? 1,
    unitCost: item.unitCost ?? 0,
    lcscId: item.lcscId ?? '',
    hqPartNumber: item.hqPartNumber ?? '',
  }
}

// ─── Unified stream handler ───────────────────────────────────────────────────

async function handleBomStream(
  mode: 'generate' | 'modify',
  payload: { description?: string; instruction?: string; context?: object },
  onChunk: (chunk: StreamingChunk) => void,
  signal?: AbortSignal
) {
  const res = await fetch('/api/bom/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, ...payload }),
    signal,
  })
  if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`)

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
      if (data === '[DONE]') continue
      try {
        const chunk: StreamingChunk = JSON.parse(data)
        onChunk(chunk)
      } catch { /* skip */ }
    }
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ChatPanel() {
  const { messages, isLoading, addMessage, setLoading } = useChatStore()
  const { project, updateBom, setTab } = useProjectStore()
  const { user } = useUserStore()
  const [inputValue, setInputValue] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [thinking, setThinking] = useState('')
  const [thinkingMsgId, setThinkingMsgId] = useState<string | null>(null)
  const [parsingMsgId, setParsingMsgId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // ─── Core handler ──────────────────────────────────────────────────────────

  const runBomGeneration = async (userMessage: string, mode: 'generate' | 'modify') => {
    const hasParts = (project?.parts.length ?? 0) > 0
    const resultMsgId = `ai-${Date.now()}`

    const historyMessages = messages.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.slice(0, 500),
    }))

    const currentParts: BOMItem[] = hasParts
      ? project!.parts.map((p) => ({
          name: p.name, quantity: p.qty,
          description: p.description ?? '', category: p.category,
          unitCost: p.unitCost, supplier: '',
          partNumber: p.model,
          lcscId: (p as any).lcscId ?? '',
          hqPartNumber: (p as any).hqPartNumber ?? '',
        }))
      : []

    const context = {
      projectName: project?.name ?? '未命名项目',
      currentParts,
      history: historyMessages,
    }

    // Start with empty message that will be updated
    addMessage({ role: 'assistant', content: '⏳ 正在启动 AI…' })
    setThinking('')
    setThinkingMsgId(resultMsgId)
    setParsingMsgId(null)
    setLoading(true)

    let fullThinking = ''

    try {
      abortRef.current = new AbortController()

      await handleBomStream(
        mode,
        mode === 'generate'
          ? { description: userMessage }
          : { instruction: userMessage, context },
        (chunk: StreamingChunk) => {
          // ── Thinking: stream tokens into thinking state ──────────────────────
          if (chunk.phase === 'thinking') {
            fullThinking += chunk.thinking ?? ''
            setThinking(fullThinking)

            // Update the message with streamed thinking — persists until done
            useChatStore.setState((state) => ({
              messages: state.messages.map((m) =>
                m.id === resultMsgId
                  ? {
                      ...m,
                      content: `💭 **设计思路**\n\n${fullThinking}\n\n_正在思考更多细节…_`,
                    }
                  : m
              ),
            }))
          }

          // ── Parsing: add a SECOND message for parsing status ──────────────
          if (chunk.phase === 'parsing') {
            if (!parsingMsgId) {
              const pid = `parse-${Date.now()}`
              setParsingMsgId(pid)
              addMessage({ role: 'assistant', content: '⏳ 正在解析 BOM…' })
            } else {
              useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                  m.id === parsingMsgId
                    ? { ...m, content: `⏳ 正在解析 BOM…` }
                    : m
                ),
              }))
            }
          }

          // ── Done: replace parsing message with result ────────────────────
          if (chunk.phase === 'done' && chunk.result) {
            const { result } = chunk
            const items = (result.items ?? []).map(bomItemToPart)
            const projectName = result.projectName ?? project?.name ?? '项目'

            try {
              localStorage.setItem('mic_best_last_project', JSON.stringify({
                bomResult: result, projectName,
                description: result.description ?? '', imageUrl: '',
                savedAt: Date.now(),
              }))
            } catch {}

            updateBom(items, result.totalCost ?? 0, projectName, result.description ?? '')

            const reasoning = result.reasoning?.trim() || fullThinking || ''
            const isModify = mode === 'modify'

            // Final result message — clean, structured, reasoning clearly visible
            const summaryLines: string[] = []
            if (reasoning) {
              summaryLines.push(`💡 **设计思路**\n${reasoning}`)
            }
            summaryLines.push(
              `${isModify ? '🔧' : '✅'} **${projectName}** ${isModify ? 'BOM 已更新' : '已生成'}`,
              result.description ? `${result.description}\n` : '',
              `📦 ${items.length} 个元件 · 合计 ¥${result.totalCost}`,
              isModify
                ? '✅ 变更已保存到当前项目'
                : '切换到 **BOM 标签页** 查看完整清单'
            )
            if (!isModify) {
              summaryLines.push('支持直接链接到 LCSC / 1688 / 京东 / 华强北 采购。')
            }
            summaryLines.push('', '可以说「加一个 OLED 屏幕」「把 ESP32 换成树莓派」来继续调整。')

            const summary = summaryLines.join('\n')

            // Replace parsing message with final result
            if (parsingMsgId) {
              useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                  m.id === parsingMsgId ? { ...m, content: summary } : m
                ),
              }))
            } else {
              // No parsing message was shown — replace the thinking message
              useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                  m.id === resultMsgId ? { ...m, content: summary } : m
                ),
              }))
            }

            setThinking('')
            setThinkingMsgId(null)
            setParsingMsgId(null)
            setTab('bom')
          }

          // ── Error ─────────────────────────────────────────────────────────
          if (chunk.phase === 'error') {
            const errMsg = `❌ 错误: ${chunk.error ?? '未知错误'}`
            useChatStore.setState((state) => ({
              messages: state.messages.map((m) =>
                m.id === resultMsgId ? { ...m, content: errMsg } : m
              ),
            }))
            setThinking('')
            setThinkingMsgId(null)
            setParsingMsgId(null)
          }
        },
        abortRef.current.signal
      )
    } catch (err: any) {
      if (err.name === 'AbortError') {
        useChatStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.id === resultMsgId ? { ...m, content: '已取消生成。' } : m
          ),
        }))
      } else {
        useChatStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.id === resultMsgId ? { ...m, content: `❌ 请求失败: ${err.message}` } : m
          ),
        }))
      }
      setThinking('')
      setThinkingMsgId(null)
      setParsingMsgId(null)
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading || !project) return
    const userMessage = inputValue.trim()
    setInputValue('')
    addMessage({ role: 'user', content: userMessage })
    const mode = detectMode(userMessage, (project.parts.length ?? 0) > 0)
    await runBomGeneration(userMessage, mode)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

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
          {project && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--c-g800)] text-[var(--c-g500)] rounded font-mono">
              {project.name.length > 12 ? project.name.slice(0, 12) + '…' : project.name}
            </span>
          )}
        </div>
        {isLoading && (
          <button onClick={() => abortRef.current?.abort()} className="text-[10px] text-red-400 hover:text-red-300 font-bold">
            停止
          </button>
        )}
        <button onClick={() => setCollapsed(true)} className="p-1 hover:bg-[var(--c-g800)] rounded transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--c-g500)]">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-[var(--c-g600)] text-center mt-8 space-y-2">
            <p>描述你的项目，我来帮你生成 BOM</p>
            <p className="text-[10px]">支持多轮对话，可以说「加一个…」来扩展清单</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm whitespace-pre-wrap ${
              msg.role === 'user' ? 'text-[var(--c-text)]' : 'text-[var(--c-g300)]'
            }`}
          >
            {msg.content}
          </div>
        ))}

        {/* Thinking indicator — only shown when thinking is actively streaming */}
        {isLoading && thinking && (
          <div className="text-sm text-[var(--c-g500)] italic animate-pulse">
            {thinking.length > 300 ? '…' + thinking.slice(-300) : thinking}
            <span className="inline-block w-1 h-3 bg-[var(--c-accent)] ml-1 animate-pulse" />
          </div>
        )}
        {isLoading && !thinking && (
          <div className="text-sm text-[var(--c-g600)] animate-pulse">⚡ 正在处理…</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Credits */}
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
            placeholder={project ? '> 加一个温度传感器…' : '> 先创建一个项目'}
            className="flex-1 bg-transparent px-3 py-2 text-sm placeholder-[var(--c-g600)] focus:outline-none"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            disabled={isLoading || !project}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading || !project}
            className="m-1 p-2 hover:bg-[var(--c-g800)] transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--c-g400)]">
              <path d="m22 2-7 20-4-9-4Z" /><path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
