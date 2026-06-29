'use client'

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
      onClick={() => {
        // ponytail: navigate before clearing auth so protected useQuery subs tear down first
        const url = new URL(signInPath, window.location.origin)
        url.searchParams.set('logout', '1')
        window.location.replace(url.pathname + url.search)
      }}
    >
      Cerrar sesión
    </Button>
  )
}
