'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { useUserStore } from '@/stores/userStore'

export default function LoginPage() {
  const locale = useLocale() as 'en' | 'zh'
  const t = useTranslations('auth.login')
  const tCommon = useTranslations('common')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useUserStore()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError(tCommon('error'))
      return
    }
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      window.location.href = '/'
    } else {
      setError(result.error ?? tCommon('error'))
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12 bg-[var(--c-bg)]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--c-accent)]">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            <line x1="12" y1="22" x2="12" y2="15.5" />
            <polyline points="22 8.5 12 15.5 2 8.5" />
          </svg>
          <span className="font-bold text-white text-sm tracking-widest uppercase">MIC.BEST</span>
        </Link>

        <div className="bg-[var(--c-g900)] border border-[var(--c-g700)] rounded-xl p-6">
          <h1 className="text-xl font-bold text-center mb-6">{t('title')}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--c-g400)] mb-1.5">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[var(--c-input-bg)] border border-[var(--c-g700)] rounded-lg px-4 py-2.5 text-sm text-[var(--c-text)] placeholder-[var(--c-g600)] focus:outline-none focus:border-[var(--c-accent)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--c-g400)] mb-1.5">{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--c-input-bg)] border border-[var(--c-g700)] rounded-lg px-4 py-2.5 text-sm text-[var(--c-text)] placeholder-[var(--c-g600)] focus:outline-none focus:border-[var(--c-accent)] transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {tCommon('loading')}
                </>
              ) : t('submit')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-[var(--c-g500)]">
              {t('noAccount')}{' '}
              <Link href={`/${locale}/signup`} className="text-[var(--c-accent)] hover:underline font-semibold">
                {t('signUp')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--c-g600)] mt-4">
          {t('agreeTerms')}{' '}
          <a href="#" className="hover:text-[var(--c-g400)]">{tCommon('termsOfService')}</a>
          {' '}{t('and')}{' '}
          <a href="#" className="hover:text-[var(--c-g400)]">{tCommon('privacyPolicy')}</a>
        </p>
      </div>
    </div>
  )
}
