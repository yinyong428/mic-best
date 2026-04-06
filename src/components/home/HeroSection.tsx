'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ideaExamples } from '@/lib/mockData'
import { useBOMStore } from '@/stores/bomStore'

export default function HeroSection({ showIdeas, onToggleIdeas }: {
  showIdeas: boolean
  onToggleIdeas: () => void
}) {
  const t = useTranslations('home')
  const [inputValue, setInputValue] = useState('')
  const [particles, setParticles] = useState<Array<{ x: number; y: number; opacity: number; duration: number; delay: number }>>([])
  const { phase, result, error, thinking, progress, imageUrl, imageLoading, generate, approve, reset } = useBOMStore()

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        opacity: Math.random() * 0.5 + 0.2,
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 2,
      }))
    )
  }, [])

  const handleSubmit = () => {
    if (!inputValue.trim() || phase !== 'idle') return
    generate(inputValue)
  }

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Background */}
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
        <div className="absolute inset-0 opacity-30">
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-[var(--c-accent)]"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                opacity: p.opacity,
                animation: `pulse ${p.duration}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{t('hero.title')}</h1>
          <p className="text-[var(--c-g400)] text-lg">{t('hero.subtitle')}</p>
        </div>

        {/* ========== IDLE: Input ========== */}
        {phase === 'idle' && (
          <div className="space-y-4">
            <div className="robot-border rounded-lg flex items-center bg-[var(--c-input-bg)]">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('hero.placeholder')}
                className="flex-1 bg-transparent px-4 py-3 text-[var(--c-text)] placeholder-[var(--c-g600)] focus:outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
              />
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                className="m-1 px-4 py-2 bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('hero.send')}
              </button>
            </div>
            <button onClick={onToggleIdeas} className="idea-btn-glow text-amber-400 font-semibold text-sm px-4 py-2">
              {t('hero.needIdea')}
            </button>
            {showIdeas && (
              <div className="bg-[var(--c-g900)] border border-[var(--c-g700)] rounded-lg p-4 text-left space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-g500)] mb-3">💡 灵感示例</p>
                {ideaExamples.map((idea, i) => (
                  <button
                    key={i}
                    onClick={() => { setInputValue(idea); onToggleIdeas() }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-[var(--c-g800)] rounded transition-colors"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== THINKING ========== */}
        {phase === 'thinking' && (
          <div className="bg-[var(--c-g900)] border border-[var(--c-g700)] rounded-xl p-6 text-left space-y-4 animate-slide-up">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--c-accent)] animate-pulse" />
              <span className="text-xs font-bold text-[var(--c-accent)] uppercase tracking-wider">AI 思考中</span>
            </div>
            <p className="text-sm text-[var(--c-g300)] leading-relaxed">
              {thinking}
              <span className="thinking-cursor inline-block w-1.5 h-3.5 bg-[var(--c-accent)] ml-0.5 mt-0.5 align-middle" />
            </p>
          </div>
        )}

        {/* ========== APPROVED ========== */}
        {phase === 'approved' && thinking && (
          <div className="bg-[var(--c-g900)] border border-[var(--c-g700)] rounded-xl p-6 text-left space-y-4 animate-slide-up">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--c-accent)]" />
              <span className="text-xs font-bold text-[var(--c-accent)] uppercase tracking-wider">设计思路</span>
            </div>
            <p className="text-sm text-[var(--c-g300)] leading-relaxed">{thinking}</p>
            <div className="flex items-center gap-3 pt-2 border-t border-[var(--c-g700)]">
              <button
                onClick={approve}
                className="px-5 py-2 bg-[var(--c-accent)] text-black font-bold text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                批准 ✓
              </button>
              <button
                onClick={reset}
                className="px-5 py-2 border border-[var(--c-g700)] text-[var(--c-g400)] text-sm rounded-lg hover:bg-[var(--c-g800)] transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        )}

        {/* ========== GENERATING ========== */}
        {phase === 'generating' && (
          <div className="bg-[var(--c-g900)] border border-[var(--c-g700)] rounded-xl p-6 text-left space-y-4 animate-slide-up">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--c-accent)] animate-pulse" />
              <span className="text-xs font-bold text-[var(--c-accent)] uppercase tracking-wider">正在生成</span>
            </div>
            <div className="h-1.5 bg-[var(--c-g800)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--c-accent)] rounded-full" style={{ width: '100%', animation: 'pulse 1s ease-in-out infinite' }} />
            </div>
            <p className="text-xs text-[var(--c-g500)]">{progress}</p>
          </div>
        )}

        {/* ========== ERROR ========== */}
        {phase === 'error' && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-left">
            <p className="text-red-400 text-sm">生成失败：{error}</p>
            <button onClick={reset} className="mt-2 text-xs text-red-500 hover:underline">重试</button>
          </div>
        )}

        {/* ========== DONE ========== */}
        {phase === 'done' && result && (
          <div className="bg-[var(--c-g900)] border border-[var(--c-accent)] rounded-xl p-6 text-left space-y-5 animate-slide-up">
            {/* Image */}
            {(imageUrl || imageLoading) && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-[var(--c-g800)]">
                {imageLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-6 h-6 border-2 border-[var(--c-g600)] border-t-[var(--c-accent)] rounded-full animate-spin" />
                  </div>
                ) : imageUrl ? (
                  <img src={imageUrl} alt={result.projectName} className="w-full h-full object-cover" />
                ) : null}
              </div>
            )}
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[var(--c-accent)]">{result.projectName}</h3>
                <p className="text-sm text-[var(--c-g400)] mt-1">{result.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-bold">¥{result.totalCost}</p>
                <p className="text-xs text-[var(--c-g500)]">{result.items.length} 个元件</p>
              </div>
            </div>
            {/* Reasoning */}
            {result.reasoning && (
              <div className="bg-[var(--c-g800)] rounded-lg p-4">
                <p className="text-xs font-semibold text-[var(--c-g500)] uppercase tracking-wider mb-2">💡 设计思路</p>
                <p className="text-sm text-[var(--c-g300)] leading-relaxed">{result.reasoning}</p>
              </div>
            )}
            {/* BOM preview */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--c-g500)] uppercase tracking-wider mb-2">📦 物料清单</p>
              {result.items.slice(0, 6).map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 hover:bg-[var(--c-g800)] rounded-lg transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-[var(--c-g600)] w-4 shrink-0">{i + 1}</span>
                    <p className="text-sm font-medium truncate">{item.name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold">¥{item.unitCost}</p>
                    <p className="text-xs text-[var(--c-g500)]">× {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/project/generation"
                className="px-5 py-2.5 bg-[var(--c-accent)] text-black font-bold text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                查看完整项目 →
              </Link>
              <button
                onClick={reset}
                className="px-5 py-2.5 border border-[var(--c-g700)] text-[var(--c-g400)] text-sm rounded-lg hover:bg-[var(--c-g800)] transition-colors"
              >
                再试一次
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        @keyframes thinking {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        .thinking-cursor { animation: thinking 1s ease-in-out infinite; }
      `}</style>
    </section>
  )
}
