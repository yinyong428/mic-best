'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { routing } from '@/i18n/routing'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { fetchProfile } = useUserStore()

  useEffect(() => {
    // Supabase has already processed the auth callback and set the session cookie.
    // Detect locale from browser preference and redirect to the localized home.
    const locale = navigator.language.startsWith('zh') ? 'zh' : 'en'

    const timer = setTimeout(() => {
      router.push(`/${locale}`)
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
