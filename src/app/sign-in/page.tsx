import { Suspense } from 'react'
import SignInPage from './page.client'

export default function SignInRoute() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Cargando…</div>}>
      <SignInPage />
    </Suspense>
  )
}
