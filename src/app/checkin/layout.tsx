import { api } from '@convex/_generated/api'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { RequireAuthSession } from '@/components/app/require-auth-session'
import { SignOutButton } from '@/components/app/sign-out-button'
import { fetchAuthQuery, isAuthenticated } from '@/lib/auth-server'

export default async function CheckinLayout({ children }: PropsWithChildren) {
  if (!(await isAuthenticated())) {
    redirect('/sign-in?next=/checkin')
  }

  const profile = await fetchAuthQuery(api.applicationUsers.getMyApplicationUser, {}).catch(
    () => null,
  )

  if (!profile || profile.role !== 'operador' || !profile.active) {
    redirect('/sign-in?error=forbidden&next=/checkin')
  }

  return (
    <div className="min-h-screen bg-muted/25">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mesa de check-in</p>
            <h1 className="text-lg font-semibold tracking-tight">Zona de registro</h1>
            <p className="text-sm text-muted-foreground">Staff: {profile.fullName ?? profile.email}</p>
          </div>
          <SignOutButton variant="outline" size="sm" signInPath="/sign-in?next=/checkin" />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <RequireAuthSession signInPath="/sign-in?next=/checkin">{children}</RequireAuthSession>
      </main>
    </div>
  )
}
