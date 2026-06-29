export function provisionalGrupoNombre(orden: number, personaNombre: string): string {
  const first = personaNombre.trim().split(/\s+/)[0] ?? ''
  return `G${orden}-${first.toUpperCase()}`
}

export function resolveGrupoNombre(
  orden: number,
  personaNombre: string | undefined,
  provided?: string,
): string {
  const trimmed = provided?.trim()
  if (trimmed) return trimmed
  if (personaNombre) return provisionalGrupoNombre(orden, personaNombre)
  return `G${orden}`
}
