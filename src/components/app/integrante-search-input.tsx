'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

type IntegranteSearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function IntegranteSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: IntegranteSearchInputProps) {
  const [focused, setFocused] = useState(false)
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(value.trim()), 300)
    return () => clearTimeout(t)
  }, [value])

  // ponytail: one query per focused field; fine for ~2–6 rows
  const results = useQuery(
    api.personas.search,
    focused && debouncedTerm.length >= 2 ? { term: debouncedTerm } : 'skip',
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showDropdown = focused && debouncedTerm.length >= 2

  return (
    <div ref={containerRef} className={cn('relative min-w-0 flex-1', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={placeholder ?? 'Buscar integrante'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
        />
      </div>
      {showDropdown && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-md ring-1 ring-foreground/10">
          {results === undefined && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Buscando…</p>
          )}
          {results?.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              Sin coincidencias — puede usar el texto ingresado
            </p>
          )}
          {results?.map((p) => (
            <button
              key={p._id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(p.nombreCompleto)
                setFocused(false)
              }}
              className="flex w-full flex-col rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <span className="font-medium">{p.nombreCompleto}</span>
              <span className="text-xs text-muted-foreground">Doc: {p.documento}</span>
            </button>
          ))}
        </div>
      )}
      {focused && debouncedTerm.length > 0 && debouncedTerm.length < 2 && (
        <p className="absolute z-50 mt-1 w-full rounded-lg border bg-popover px-2 py-1.5 text-sm text-muted-foreground shadow-md ring-1 ring-foreground/10">
          Escriba al menos 2 caracteres para buscar
        </p>
      )}
    </div>
  )
}
