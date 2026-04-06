'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any
  }
}

interface PaddleProviderProps {
  children: React.ReactNode
  env?: 'sandbox' | 'production'
}

export default function PaddleProvider({ children, env = 'production' }: PaddleProviderProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    if (!clientToken) {
      console.warn('[Paddle] NEXT_PUBLIC_PADDLE_CLIENT_TOKEN not set')
      return
    }

    // Paddle JS script
    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    script.async = true
    script.onload = () => {
      if (window.Paddle) {
        window.Paddle.Environment.set(env === 'sandbox' ? 'sandbox' : 'production')
        window.Paddle.Initialize({
          token: clientToken,
          // In production, set webhook URL for server-side verification
        })
        console.log('[Paddle] Initialized in', env, 'mode')
      }
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [env])

  return <>{children}</>
}
