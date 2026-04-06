'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { useUserStore } from '@/stores/userStore'

// Paddle Price IDs (from API creation)
const PADDLE_PRICE_MONTHLY = process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY ?? 'pri_01kngxehc18djrff5fkscyvhk8'
const PADDLE_PRICE_YEARLY = process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY ?? 'pri_01kngxepk4jrtpfymxaaca13cc'

interface PricingModalProps {
  open: boolean
  onClose: () => void
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any
  }
}

function openPaddleCheckout(priceId: string, userId: string, userEmail: string) {
  if (!window.Paddle) {
    console.error('[Paddle] Not initialized')
    return
  }

  window.Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: {
      email: userEmail,
    },
    customData: {
      user_id: userId,
    },
    settings: {
      displayMode: 'overlay',
      theme: 'dark',
      locale: 'en',
      successUrl: `${window.location.origin}/account?paddle=success`,
    },
  })
}

export default function PricingModal({ open, onClose }: PricingModalProps) {
  const t = useTranslations('pricing')
  const { user } = useUserStore()
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)

  const handleSubscribe = () => {
    if (!user) return
    setLoading(true)

    const priceId = selected === 'monthly' ? PADDLE_PRICE_MONTHLY : PADDLE_PRICE_YEARLY

    try {
      openPaddleCheckout(priceId, user.id, user.email)
    } catch (err) {
      console.error('[Paddle] Checkout error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--c-g950)] border border-[var(--c-g800)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{t('title')}</h2>
              <p className="text-xs text-[var(--c-g500)] mt-1">{t('subtitle')}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[var(--c-g600)] hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Plan selection */}
        <div className="px-6 pb-4 space-y-2">
          {/* Monthly */}
          <button
            onClick={() => setSelected('monthly')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
              selected === 'monthly'
                ? 'border-white bg-white/5'
                : 'border-[var(--c-g800)] hover:border-[var(--c-g700)] bg-[var(--c-g900)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                selected === 'monthly' ? 'border-[var(--c-accent)]' : 'border-[var(--c-g600)]'
              }`}>
                {selected === 'monthly' && (
                  <div className="w-2 h-2 rounded-full bg-[var(--c-accent)]" />
                )}
              </div>
              <div>
                <span className="text-sm font-bold text-white">{t('monthly')}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">{t('monthlyPrice')}</p>
              <p className="text-[10px] text-[var(--c-g600)]">{t('perMonth')}</p>
            </div>
          </button>

          {/* Yearly */}
          <button
            onClick={() => setSelected('yearly')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
              selected === 'yearly'
                ? 'border-white bg-white/5'
                : 'border-[var(--c-g800)] hover:border-[var(--c-g700)] bg-[var(--c-g900)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                selected === 'yearly' ? 'border-[var(--c-accent)]' : 'border-[var(--c-g600)]'
              }`}>
                {selected === 'yearly' && (
                  <div className="w-2 h-2 rounded-full bg-[var(--c-accent)]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{t('yearly')}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded font-bold">
                    {t('savings')}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--c-g600)]">{t('yearlyTotal')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">{t('yearlyPrice')}</p>
              <p className="text-[10px] text-[var(--c-g600)]">{t('perMonth')}</p>
            </div>
          </button>
        </div>

        {/* Benefits */}
        <div className="px-6 pb-4">
          <div className="bg-[var(--c-g900)] rounded-xl p-4 space-y-2">
            {(['unlimited', 'priority', 'support'] as const).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--c-accent)] shrink-0">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-xs text-[var(--c-g400)]">{t(`benefits.${key}` as any)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-3 bg-[var(--c-accent)] hover:opacity-90 text-black font-bold text-sm rounded-xl transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                打开支付…
              </>
            ) : (
              t('subscribeNow')
            )}
          </button>
          <p className="text-center text-[10px] text-[var(--c-g700)] mt-2">
            <a href="/terms" target="_blank" className="hover:underline">服务条款</a> ·{' '}
            <a href="/privacy" target="_blank" className="hover:underline">隐私政策</a>
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
