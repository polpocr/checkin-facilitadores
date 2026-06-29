'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SignOutButton } from '@/components/app/sign-out-button'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(
    error === 'forbidden'
      ? 'No tienes permiso para esa sección (p. ej. staff check-in no puede entrar a /admin). Cierra sesión e intenta de nuevo.'
      : null,
  )

  const logoutHandled = useRef(false)
  useEffect(() => {
    if (searchParams.get('logout') !== '1' || logoutHandled.current) return
    logoutHandled.current = true
    void authClient.signOut().then(() => {
      const next = new URL(window.location.href)
      next.searchParams.delete('logout')
      window.history.replaceState({}, '', next.pathname + next.search)
    })
  }, [searchParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        setMessage(result.error.message ?? 'Error al iniciar sesión')
        return
      }
      // ponytail: always route via / so role picks /checkin vs /admin (avoids stale ?next=/admin)
      await authClient.convex.token({ fetchOptions: { throw: false } })
      window.location.assign('/')
    } catch {
      setMessage('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/25 p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mesa de registro</p>
          <CardTitle className="text-xl">CheckIn Operadores</CardTitle>
          <CardDescription>Inicia sesión como staff de check-in o administrador</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {message && (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
            {error === 'forbidden' && (
              <SignOutButton variant="outline" className="w-full" signInPath="/sign-in" />
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
