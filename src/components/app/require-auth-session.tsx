'use client'

import { useConvexAuth } from 'convex/react'
import { useRouter } from 'next/navigation'
import { useEffect, type PropsWithChildren } from 'react'
import { LoadingState } from '@/components/app/loading-state'

export function RequireAuthSession({
  children,
  signInPath = '/sign-in',
}: PropsWithChildren<{ signInPath?: string }>) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(signInPath)
    }
  }, [isLoading, isAuthenticated, router, signInPath])

  if (isLoading) return <LoadingState />
  if (!isAuthenticated) return null

  return children
}
