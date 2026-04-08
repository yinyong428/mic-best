'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { useUserStore } from '@/stores/userStore'

export default function SignupPage() {
  const locale = useLocale() as 'en' | 'zh'
  const t = useTranslations('auth.signup')
  const tCommon = useTranslations('common')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signup, loginWithGoogle } = useUserStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError(tCommon('error'))
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError('')
    setLoading(true)
    const result = await signup(email, password, username)
    setLoading(false)
    if (result.success) {
      window.location.href = '/'
    } else {
      setError(result.error ?? tCommon('error'))
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    const result = await loginWithGoogle()
    if (!result.success) {
      setError(result.error ?? tCommon('error'))
      setGoogleLoading(false)
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

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-2.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-3 mb-4"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[var(--c-g700)]" />
            <span className="text-xs text-[var(--c-g500)]">or</span>
            <div className="flex-1 h-px bg-[var(--c-g700)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--c-g400)] mb-1.5">{t('username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your nickname"
                className="w-full bg-[var(--c-input-bg)] border border-[var(--c-g700)] rounded-lg px-4 py-2.5 text-sm text-[var(--c-text)] placeholder-[var(--c-g600)] focus:outline-none focus:border-[var(--c-accent)] transition-colors"
              />
            </div>

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
              {t('hasAccount')}{' '}
              <Link href={`/${locale}/login`} className="text-[var(--c-accent)] hover:underline font-semibold">
                {t('logIn')}
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
