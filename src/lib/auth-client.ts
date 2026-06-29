'use client'

import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

const getAuthBaseURL = () => {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_SITE_URL
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [convexClient()],
})
