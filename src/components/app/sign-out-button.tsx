'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function SignOutButton({
  variant = 'outline' as const,
  size,
  signInPath = '/sign-in',
}: {
  variant?: 'outline' | 'ghost'
  size?: 'sm' | 'default'
  signInPath?: string
}) {
  const router = useRouter()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={async () => {
        await authClient.signOut()
        router.replace(signInPath)
      }}
    >
      Cerrar sesión
    </Button>
  )
}
