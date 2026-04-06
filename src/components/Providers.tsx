'use client'

import PaddleProvider from '@/components/PaddleProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <PaddleProvider>{children}</PaddleProvider>
}
