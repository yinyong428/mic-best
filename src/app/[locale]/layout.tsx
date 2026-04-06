import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import Navbar from '@/components/layout/Navbar'
import Providers from '@/components/Providers'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'zh')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <Providers>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Navbar />
        <div className="min-h-dvh flex flex-col">
          {children}
        </div>
      </NextIntlClientProvider>
    </Providers>
  )
}
