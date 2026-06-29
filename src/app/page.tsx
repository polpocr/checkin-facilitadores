import { api } from '@convex/_generated/api'
import { redirect } from 'next/navigation'
import { fetchAuthQuery, isAuthenticated } from '@/lib/auth-server'

export default async function HomePage() {
  if (!(await isAuthenticated())) {
    redirect('/sign-in')
  }

  const profile = await fetchAuthQuery(api.applicationUsers.getMyApplicationUser, {}).catch(
    () => null,
  )

  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role === 'operador') redirect('/checkin')
  redirect('/sign-in?error=forbidden')
}
