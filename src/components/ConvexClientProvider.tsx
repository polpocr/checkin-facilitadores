'use client'

import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { ConvexReactClient } from 'convex/react'
import type { ComponentProps, ReactNode } from 'react'
import { useMemo } from 'react'
import { authClient } from '@/lib/auth-client'

export function ConvexClientProvider({
  children,
  initialToken,
}: {
  children: ReactNode
  initialToken?: string | null
}) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) {
      throw new Error(
        'Missing NEXT_PUBLIC_CONVEX_URL. Run `pnpm convex:dev` once to create .env.local.',
      )
    }
    return new ConvexReactClient(url)
  }, [])

  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={
        authClient as unknown as ComponentProps<typeof ConvexBetterAuthProvider>['authClient']
      }
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  )
}
