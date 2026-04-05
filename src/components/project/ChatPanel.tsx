'use client'

import { useState } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useProjectStore } from '@/stores/projectStore'

export default function ChatPanel() {
  const { messages, isLoading, addMessage, setLoading } = useChatStore()
  const { project } = useProjectStore()
  const [inputValue, setInputValue] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')

    // Add user message
    addMessage({ role: 'user', content: userMessage })

    // Simulate AI response
    setLoading(true)
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `我已理解你的需求。我正在更新项目...\n\n已修改: ${userMessage}\n\nBOM 已更新，接线图已重新生成。`,
      })
      setLoading(false)
    }, 2000)
  }

  if (collapsed) {
    return (
      <aside className="w-12 border-l border-[var(--c-g800)] bg-[var(--c-bg)] flex flex-col">
        <button
          onClick={() => setCollapsed(false)}
          className="h-12 flex items-center justify-center border-b border-[var(--c-g800)] hover:bg-[var(--c-g800)] transition-colors"
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
            className="text-[var(--c-g500)]"
          >
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--c-g400)]">
            Chat
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
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
            className="text-[var(--c-g500)]"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm ${
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
        {isLoading && (
          <div className="text-sm text-[var(--c-g600)] animate-pulse">
            AI 正在思考...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--c-g800)]">
        <div className="robot-border rounded-lg flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="> Ask to modify..."
            className="flex-1 bg-transparent px-3 py-2 text-sm placeholder-[var(--c-g600)] focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            className="m-1 p-2 hover:bg-[var(--c-g800)] transition-colors disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--c-g400)]"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
