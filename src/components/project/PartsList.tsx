'use client'

import { useState, useRef } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useUserStore } from '@/stores/userStore'
import { getCategoryColor, getCategoryLabel } from '@/lib/mockData'
import type { Part, PartCategory } from '@/types'

interface AISuggestion {
  name: string
  category: PartCategory
  model: string
  description: string
  unitCost: number
  supplier: string
  reason: string
}

function mapCategory(raw: string): PartCategory {
  const l = raw.toLowerCase()
  if (l.includes('mcu') || l.includes('micro') || l.includes('raspberry') || l.includes('esp')) return 'mcu'
  if (l.includes('sensor')) return 'sensor'
  if (l.includes('actuator') || l.includes('motor') || l.includes('servo')) return 'actuator'
  if (l.includes('power') || l.includes('battery') || l.includes('adapter') || l.includes('supply')) return 'power'
  if (l.includes('module') || l.includes('board') || l.includes('driver')) return 'module'
  if (l.includes('enclosure') || l.includes('case') || l.includes('外壳')) return 'enclosure'
  if (l.includes('structural') || l.includes('frame') || l.includes('extrusion') || l.includes('3d')) return 'structural'
  if (l.includes('mechanism') || l.includes('gear')) return 'mechanism'
  return 'misc'
}

export default function PartsList() {
  const { project, selectedPartId, selectPart, partsListCollapsed, togglePartsList, updateBom } =
    useProjectStore()
  const { user } = useUserStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[] | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<PartCategory | 'all'>('all')
  const abortRef = useRef<AbortController | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!project) return null

  const filteredParts = project.parts.filter((part) => {
    const matchSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = selectedCategory === 'all' || part.category === selectedCategory
    return matchSearch && matchCat
  })

  const categories: PartCategory[] = ['mcu', 'sensor', 'actuator', 'power', 'module', 'structural', 'enclosure', 'mechanism', 'misc']

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setAiSuggestions(null)
    setAiError(null)

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    if (value.trim().length < 3) return

    searchTimeoutRef.current = setTimeout(() => {
      fetchAISuggestions(value.trim())
    }, 600)
  }

  const fetchAISuggestions = async (query: string) => {
    if (!project) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setAiLoading(true)
    setAiSuggestions(null)
    setAiError(null)

    try {
      const res = await fetch('/api/bom/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `为项目"${project.name}"推荐适合"${query}"的电子元件。只需返回JSON数组，不需要解释。每个元素格式：{"name":"元件名称","category":"分类(mcu/sensor/actuator/power/module/structural/enclosure/mechanism/misc)","model":"型号","description":"简短描述","unitCost":数字,"supplier":"供应商","reason":"选型理由"}。只返回数组，不要其他内容。`
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error('API error')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

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
            if (chunk.thinking) fullText += chunk.thinking
            if (chunk.phase === 'done' && chunk.result?.reasoning) {
              fullText += chunk.result.reasoning
            }
          } catch {}
        }
      }

      // Parse JSON array from response
      const jsonMatch = fullText.indexOf('[')
      const jsonEnd = fullText.lastIndexOf(']')
      if (jsonMatch !== -1 && jsonEnd !== -1) {
        const jsonStr = fullText.slice(jsonMatch, jsonEnd + 1)
        const suggestions = JSON.parse(jsonStr) as AISuggestion[]
        setAiSuggestions(suggestions.slice(0, 5))
      } else {
        setAiError('未能解析推荐结果')
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setAiError('推荐暂时不可用')
      }
    } finally {
      setAiLoading(false)
    }
  }

  const handleAddSuggestion = (suggestion: AISuggestion) => {
    if (!project) return
    const newPart: Omit<Part, 'id'> = {
      name: suggestion.name,
      category: suggestion.category,
      model: suggestion.model,
      description: suggestion.description,
      qty: 1,
      unitCost: suggestion.unitCost,
    }
    updateBom([...project.parts.map(p => ({ ...p })), newPart], project.totalCost + suggestion.unitCost)
    setAiSuggestions(null)
    setSearchQuery('')
  }

  return (
    <aside
      className={`border-r border-[var(--c-g800)] bg-[var(--c-bg)] flex flex-col transition-all ${
        partsListCollapsed ? 'w-12' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="h-12 border-b border-[var(--c-g800)] flex items-center px-3 shrink-0">
        {!partsListCollapsed && (
          <div className="flex-1 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--c-g400)]"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--c-g400)]">
              Parts
            </span>
          </div>
        )}
        <button
          onClick={togglePartsList}
          className="p-1 hover:bg-[var(--c-g800)] rounded transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-[var(--c-g500)] transition-transform ${
              partsListCollapsed ? 'rotate-180' : ''
            }`}
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>

      {!partsListCollapsed && (
        <>
          {/* AI Search */}
          <div className="p-2 border-b border-[var(--c-g800)]">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 搜索 / AI 推荐…"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--c-input-bg)] border border-[var(--c-g700)] text-sm placeholder-[var(--c-g600)] focus:border-[var(--c-text)] focus:outline-none"
              />
              {aiLoading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="w-3.5 h-3.5 border-1.5 border-[var(--c-g600)] border-t-[var(--c-accent)] rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* AI Suggestions */}
            {aiLoading && (
              <div className="mt-2 text-xs text-[var(--c-g500)] animate-pulse">
                ⚡ AI 推荐中…
              </div>
            )}
            {aiError && (
              <div className="mt-2 text-xs text-red-400">{aiError}</div>
            )}
            {aiSuggestions && aiSuggestions.length > 0 && (
              <div className="mt-2 border border-[var(--c-g700)] rounded-lg overflow-hidden bg-[var(--c-g900)]">
                <div className="px-2 py-1.5 bg-[var(--c-g800)]">
                  <p className="text-[10px] font-bold text-[var(--c-accent)] uppercase tracking-wider">⚡ AI 推荐</p>
                </div>
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="px-2 py-2 border-t border-[var(--c-g800)] hover:bg-[var(--c-g800)] transition-colors">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: getCategoryColor(s.category) }}
                      />
                      <span className="text-xs font-semibold text-white truncate">{s.name}</span>
                    </div>
                    <p className="text-[10px] text-[var(--c-g500)] mb-1.5 truncate">{s.model}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--c-g600)]">¥{s.unitCost.toFixed(0)}</span>
                      <button
                        onClick={() => handleAddSuggestion(s)}
                        className="text-[10px] text-[var(--c-accent)] hover:underline font-bold"
                      >
                        + 添加
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category filter */}
          <div className="px-2 py-1.5 border-b border-[var(--c-g800)] flex gap-1 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-white text-black'
                  : 'text-[var(--c-g500)] hover:text-white'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-white text-black'
                    : 'text-[var(--c-g500)] hover:text-white'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Parts list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-1">
              {filteredParts.map((part) => (
                <button
                  key={part.id}
                  onClick={() => selectPart(part.id === selectedPartId ? null : part.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    selectedPartId === part.id
                      ? 'bg-[var(--c-g800)] border-l-2 border-[var(--c-accent)]'
                      : 'hover:bg-[var(--c-g800)]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryColor(part.category) }}
                  />
                  <span className="text-sm truncate">{part.name}</span>
                </button>
              ))}
              {filteredParts.length === 0 && (
                <div className="px-3 py-4 text-xs text-[var(--c-g600)] text-center">
                  {searchQuery ? '没有找到匹配的零件' : '暂无零件'}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[var(--c-g800)] flex items-center justify-between">
            <span className="text-xs text-[var(--c-g600)]">{filteredParts.length} parts</span>
            {user && (
              <span className="text-[10px] text-[var(--c-g700)]">⚡ {user.credits}</span>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
