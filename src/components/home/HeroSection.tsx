'use client'

import { useState } from 'react'
import { ideaExamples } from '@/lib/mockData'

interface HeroSectionProps {
  showIdeas: boolean
  onToggleIdeas: () => void
}

export default function HeroSection({ showIdeas, onToggleIdeas }: HeroSectionProps) {
  const [inputValue, setInputValue] = useState('')

  const handleIdeaClick = (idea: string) => {
    setInputValue(idea)
    onToggleIdeas()
  }

  const handleSubmit = () => {
    if (!inputValue.trim()) return
    // TODO: Navigate to project creation
    console.log('Creating project:', inputValue)
  }

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* 3D Background Placeholder - Gradient mesh */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 70%),
              #09090b
            `,
          }}
        />
        {/* Animated particles placeholder */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-[var(--c-accent)]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
                animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto text-center space-y-8">
        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            你想建造什么？
          </h1>
          <p className="text-[var(--c-g400)] text-lg">
            通过与人工智能对话创建硬件原型设计
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          {/* Main Input */}
          <div className="robot-border rounded-lg flex items-center bg-[var(--c-input-bg)]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="请建筑师提供蓝图……"
              className="flex-1 bg-transparent px-4 py-3 text-[var(--c-text)] placeholder-[var(--c-g600)] focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="m-1 px-4 py-2 bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>

          {/* Need an Idea button */}
          <button
            onClick={onToggleIdeas}
            className="idea-btn-glow text-amber-400 font-semibold text-sm px-4 py-2"
          >
            需要灵感吗？
          </button>

          {/* Ideas dropdown */}
          {showIdeas && (
            <div className="bg-[var(--c-g900)] border border-[var(--c-g700)] rounded-lg p-4 text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-g500)] mb-3">
                💡 灵感示例
              </p>
              {ideaExamples.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => handleIdeaClick(idea)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-[var(--c-g800)] rounded transition-colors"
                >
                  {idea}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }
      `}</style>
    </section>
  )
}
