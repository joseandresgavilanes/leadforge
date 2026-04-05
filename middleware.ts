import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/auth/middleware'
import { locales, defaultLocale } from '@/lib/i18n/config'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Auth session refresh for app routes
  const localeSegments = locales.map((l) => `/${l}/app`)
  const isAppRoute = localeSegments.some((seg) => pathname.startsWith(seg))

  if (isAppRoute) {
    const sessionResponse = await updateSession(request)
    if (sessionResponse) return sessionResponse
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
