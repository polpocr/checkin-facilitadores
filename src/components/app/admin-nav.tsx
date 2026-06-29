'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/personas', label: 'Operadores' },
  { href: '/admin/checkins', label: 'Check-ins' },
  { href: '/admin/grupos', label: 'Grupos' },
  { href: '/admin/casos-revision', label: 'Revisión' },
  { href: '/admin/staff', label: 'Staff' },
] as const

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1">
      {nav.map((item) => {
        const active =
          'exact' in item && item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Button
            key={item.href}
            variant={active ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(active && 'font-medium')}
            nativeButton={false}
            render={<Link href={item.href} />}
          >
            {item.label}
          </Button>
        )
      })}
    </nav>
  )
}
