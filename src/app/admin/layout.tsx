import Link from 'next/link'
import { api } from '@convex/_generated/api'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { AdminExportButton } from '@/components/app/admin-export-button'
import { AdminNav } from '@/components/app/admin-nav'
import { RequireAuthSession } from '@/components/app/require-auth-session'
import { SignOutButton } from '@/components/app/sign-out-button'
import { fetchAuthQuery, isAuthenticated } from '@/lib/auth-server'

export default async function AdminLayout({ children }: PropsWithChildren) {
  if (!(await isAuthenticated())) {
    redirect('/sign-in?next=/admin')
  }

  const profile = await fetchAuthQuery(api.applicationUsers.getMyApplicationUser, {}).catch(
    () => null,
  )

  if (!profile || profile.role !== 'admin' || !profile.active) {
    redirect('/sign-in?error=forbidden&next=/admin')
  }

  return (
    <div className="min-h-screen bg-muted/25">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href="/admin" className="font-semibold tracking-tight text-foreground hover:text-primary">
                CheckIn Operadores
              </Link>
              <p className="text-xs text-muted-foreground">Admin · {profile.fullName ?? profile.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <AdminExportButton />
              <SignOutButton variant="ghost" size="sm" signInPath="/sign-in?next=/admin" />
            </div>
          </div>
          <div className="mt-3 overflow-x-auto pb-1">
            <AdminNav />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <RequireAuthSession signInPath="/sign-in?next=/admin">{children}</RequireAuthSession>
      </main>
    </div>
  )
}
