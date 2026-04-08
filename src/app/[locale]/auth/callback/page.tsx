'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { fetchProfile } = useUserStore()

  useEffect(() => {
    // The session is automatically handled by Supabase client
    // Just redirect to home after a short delay
    const timer = setTimeout(() => {
      router.push('/')
    }, 1500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--c-bg)]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--c-g400)] text-sm">Signing you in...</p>
      </div>
    </div>
  )
}
