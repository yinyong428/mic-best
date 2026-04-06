'use client'

import { createContext, useContext } from 'react'
import type { AbstractIntlMessages } from 'next-intl'

export interface Locale {
  locale: 'en' | 'zh'
  messages: AbstractIntlMessages
}

export const LocaleContext = createContext<Locale | null>(null)

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
