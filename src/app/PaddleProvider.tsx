'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any
  }
}

const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? ''

export default function PaddleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!PADDLE_CLIENT_TOKEN) {
      console.warn('[Paddle] NEXT_PUBLIC_PADDLE_CLIENT_TOKEN not set')
      return
    }
    if (typeof window === 'undefined') return

    // Already initialized
    if (window.Paddle) return

    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    script.async = true
    script.onload = () => {
      if (window.Paddle) {
        window.Paddle.Environment.set('live')
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
