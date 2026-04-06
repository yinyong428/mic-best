'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { useUserStore } from '@/stores/userStore'

function AccountContent() {
  const t = useTranslations('account')
  const params = useSearchParams()
  const { user } = useUserStore()
  const paddleStatus = params.get('paddle')
  const stripeStatus = params.get('stripe')

  const isSuccess = paddleStatus === 'success' || stripeStatus === 'success'

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        {isSuccess ? (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{t('paymentSuccess')}</h1>
            <p className="text-sm text-[var(--c-g400)]">{t('paymentSuccessDesc')}</p>
          </>
        ) : (
          <h1 className="text-2xl font-bold text-white mb-2">{t('title')}</h1>
        )}

        {user ? (
          <div className="bg-[var(--c-g900)] border border-[var(--c-g800)] rounded-xl p-4 text-left space-y-3 w-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--c-g500)] uppercase tracking-wider font-bold">{t('plan')}</p>
                <p className="text-lg font-bold text-white mt-0.5">
                  {user.plan === 'pro' ? t('proPlan') : t('freePlan')}
                </p>
              </div>
              {user.plan !== 'pro' && (
                <a href="/pricing" className="px-4 py-2 bg-[var(--c-accent)] text-black text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
                  {t('upgradeToPro')}
                </a>
              )}
            </div>
            <div className="border-t border-[var(--c-g800)] pt-3 flex items-center justify-between">
              <p className="text-xs text-[var(--c-g500)]">{t('remainingCredits')}</p>
              <p className="text-sm font-bold text-white">{user.credits}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--c-g500)]">{t('loginRequired')}</p>
        )}

        <a href="/" className="inline-block text-sm text-[var(--c-g400)] hover:text-white transition-colors">
          ← {t('backToHome')}
        </a>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--c-g600)] border-t-[var(--c-accent)] rounded-full animate-spin" />
      </div>
    }>
      <AccountContent />
    </Suspense>
  )
}
