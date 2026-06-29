'use client'

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
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        await authClient.signOut()
        window.location.assign(signInPath)
      }}
    >
      Cerrar sesión
    </Button>
  )
}
