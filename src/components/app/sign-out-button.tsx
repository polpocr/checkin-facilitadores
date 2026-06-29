'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function SignOutButton({
  variant = 'outline' as const,
  size,
  signInPath = '/sign-in',
  className,
}: {
  variant?: 'outline' | 'ghost'
  size?: 'sm' | 'default'
  signInPath?: string
  className?: string
}) {
  const router = useRouter()

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        await authClient.signOut()
        router.replace(signInPath)
      }}
    >
      Cerrar sesión
    </Button>
  )
}
