import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ConvexClientProvider } from '@/components/ConvexClientProvider'
import { getToken } from '@/lib/auth-server'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'CheckIn Facilitadores',
  description: 'Registro de check-in y grupos para facilitadores',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const token = await getToken()
  return (
    <html lang="es" suppressHydrationWarning className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="min-h-screen bg-background font-sans antialiased">
        <ConvexClientProvider initialToken={token}>
          {children}
          <Toaster richColors />
        </ConvexClientProvider>
      </body>
    </html>
  )
}
