'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useUserStore } from '@/stores/userStore'

export default function AccountSettingsPage() {
  const t = useTranslations('settings')
  const { user } = useUserStore()
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!user) return null

  const NOTIFICATIONS = [
    { key: 'projectUpdates', label: t('projectUpdates'), desc: t('projectUpdatesDesc') },
    { key: 'communityUpdates', label: t('communityUpdates'), desc: t('communityUpdatesDesc') },
    { key: 'marketingEmails', label: t('marketingEmails'), desc: t('marketingEmailsDesc') },
  ]

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-6">{t('title')}</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic info */}
        <div className="bg-[var(--c-g900)] border border-[var(--c-g700)] rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm">{t('basicInfo')}</h2>
          <div>
            <label className="block text-xs font-semibold text-[var(--c-g500)] mb-1.5">{t('username')}</label>
            <input
              type="text"
              defaultValue={user.username}
              className="w-full bg-[var(--c-input-bg)] border border-[var(--c-g700)] rounded-lg px-4 py-2.5 text-sm text-[var(--c-text)] focus:outline-none focus:border-[var(--c-accent)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--c-g500)] mb-1.5">{t('email')}</label>
            <input
              type="email"
              defaultValue={user.email}
              className="w-full bg-[var(--c-input-bg)] border border-[var(--c-g700)] rounded-lg px-4 py-2.5 text-sm text-[var(--c-text)] focus:outline-none focus:border-[var(--c-accent)] transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="bg-[var(--c-g900)] border border-[var(--c-g700)] rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm">{t('changePassword')}</h2>
          <div>
            <label className="block text-xs font-semibold text-[var(--c-g500)] mb-1.5">{t('currentPassword')}</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-[var(--c-input-bg)] border border-[var(--c-g700)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--c-accent)] transition-colors placeholder-[var(--c-g600)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--c-g500)] mb-1.5">{t('newPassword')}</label>
            <input
              type="password"
              placeholder={t('newPasswordPlaceholder')}
              className="w-full bg-[var(--c-input-bg)] border border-[var(--c-g700)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--c-accent)] transition-colors placeholder-[var(--c-g600)]"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[var(--c-g900)] border border-[var(--c-g700)] rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm">{t('notifications')}</h2>
          {NOTIFICATIONS.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm">{item.label}</p>
                <p className="text-xs text-[var(--c-g500)]">{item.desc}</p>
              </div>
              <button type="button" className="w-10 h-5 rounded-full bg-[var(--c-g700)] relative transition-colors shrink-0">
                <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-[var(--c-g400)] transition-all" />
              </button>
            </div>
          ))}
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary text-sm">
            {t('saveChanges')}
          </button>
          {saved && (
            <span className="text-xs text-green-400">✓ Saved</span>
          )}
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-8 pt-6 border-t border-[var(--c-g800)]">
        <h2 className="text-sm font-semibold text-red-400 mb-3">{t('security')}</h2>
        <button className="px-4 py-2 border border-red-800 text-red-400 text-sm rounded-lg hover:bg-red-900/20 transition-colors">
          {t('deleteAccount')}
        </button>
      </div>
    </div>
  )
}
