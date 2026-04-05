import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MIC.BEST - AI Hardware Prototype Design',
  description: '中国版 Blueprint — 通过 AI 对话创建硬件原型设计，对接 LCSC + JLCPCB 供应链',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" className="dark">
      <body className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)] antialiased">
        {children}
      </body>
    </html>
  )
}
