'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { useUserStore } from '@/stores/userStore'

// Paddle Price IDs for credit packs (create these in Paddle Dashboard)
const CREDIT_PACKS = [
  {
    id: 'credits_10',
    credits: 10,
    label: '10 Credits',
    price: '$2.99',
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_10 ?? '',
    description: '适合轻量使用',
  },
  {
    id: 'credits_50',
    credits: 50,
    label: '50 Credits',
    price: '$9.99',
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_50 ?? '',
    description: '最受欢迎',
    popular: true,
  },
  {
    id: 'credits_100',
    credits: 100,
    label: '100 Credits',
    price: '$17.99',
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREDITS_100 ?? '',
    description: '批量使用最划算',
  },
]

interface CreditsPurchaseModalProps {
  open: boolean
  onClose: () => void
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any
  }
}

function openPaddleCheckout(priceId: string, userId: string) {
  if (!window.Paddle) {
    console.error('[Paddle] Not initialized')
    return
  }
  window.Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customData: {
      user_id: userId,
    },
    settings: {
      displayMode: 'overlay',
      theme: 'dark',
      locale: 'en',
      successUrl: `${window.location.origin}/account?credits=success`,
    },
  })
}

export default function CreditsPurchaseModal({ open, onClose }: CreditsPurchaseModalProps) {
  const t = useTranslations('credits')
  const { user } = useUserStore()
  const [selectedPack, setSelectedPack] = useState(CREDIT_PACKS[1]) // Default to 50
  const [loading, setLoading] = useState(false)

  const handlePurchase = () => {
    if (!user || !selectedPack.priceId) return
    setLoading(true)
    try {
      openPaddleCheckout(selectedPack.priceId, user.id)
    } catch (err) {
      console.error('[Credits] Purchase error:', err)
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
      <div className="relative w-full max-w-sm bg-[var(--c-g950)] border border-[var(--c-g800)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">购买 Credits</h2>
              <p className="text-xs text-[var(--c-g500)] mt-1">当前余额：{user?.credits ?? 0} Credits</p>
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

        {/* Pack selection */}
        <div className="px-6 pb-4 space-y-2">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setSelectedPack(pack)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                selectedPack.id === pack.id
                  ? 'border-white bg-white/5'
                  : 'border-[var(--c-g800)] hover:border-[var(--c-g700)] bg-[var(--c-g900)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedPack.id === pack.id ? 'border-[var(--c-accent)]' : 'border-[var(--c-g600)]'
                }`}>
                  {selectedPack.id === pack.id && (
                    <div className="w-2 h-2 rounded-full bg-[var(--c-accent)]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{pack.label}</span>
                    {pack.popular && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-[var(--c-accent)] text-black rounded font-bold">
                        HOT
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--c-g600)]">{pack.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{pack.price}</p>
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={handlePurchase}
            disabled={loading || !selectedPack.priceId}
            className="w-full py-3 bg-[var(--c-accent)] hover:opacity-90 text-black font-bold text-sm rounded-xl transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                打开支付…
              </>
            ) : (
              <>⚡ 购买 {selectedPack.label} — {selectedPack.price}</>
            )}
          </button>
          <p className="text-center text-[10px] text-[var(--c-g700)] mt-2">
            支付由 Paddle 处理 · 支付即表示同意{' '}
            <a href="/terms" target="_blank" className="hover:underline">服务条款</a>
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
