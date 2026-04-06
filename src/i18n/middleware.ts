import createMiddleware from 'next-intl/middleware'
import { routing } from './routing'

export default createMiddleware({
  ...routing,
  localePrefix: 'always',
})

export const config = {
  matcher: ['/', '/(zh|en)/:path*']
}
