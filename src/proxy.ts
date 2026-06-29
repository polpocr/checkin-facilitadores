import { getSessionCookie } from 'better-auth/cookies'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/** Soft gate — server layout still enforces session + Convex profile. */
export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/checkin')) {
    return NextResponse.next()
  }

  const sessionCookie = getSessionCookie(req)
  if (sessionCookie) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/sign-in'
  url.searchParams.set('next', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*', '/checkin/:path*'],
}
