'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any
  }
}

// Paddle client-side token (from Paddle Dashboard → Developer Tools → Client-side tokens)
// Must start with "live_" or "test_"
const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? ''

export default function PaddleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!PADDLE_CLIENT_TOKEN) {
      console.warn('[Paddle] NEXT_PUBLIC_PADDLE_CLIENT_TOKEN not set — Paddle checkout disabled')
      return
    }
    if (typeof window === 'undefined') return
    if (window.Paddle) return // Already initialized

    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    script.async = true
    script.onload = () => {
      if (window.Paddle) {
        // Environment (live/test) is determined by token prefix (live_ vs test_) — no need to call Environment.set
        window.Paddle.Initialize({
          token: PADDLE_CLIENT_TOKEN,
        })
        console.log('[Paddle] Initialized')
      }
    }
    script.onerror = () => console.error('[Paddle] Failed to load SDK')
    document.body.appendChild(script)
  }, [])

  return <>{children}</>
}
