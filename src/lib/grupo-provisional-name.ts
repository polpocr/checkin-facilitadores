export function provisionalGrupoNombre(orden: number, personaNombre: string): string {
  const first = personaNombre.trim().split(/\s+/)[0] ?? ''
  return `G${orden}-${first.toUpperCase()}`
}

export function displayGrupoNombre(
  orden: number,
  personaNombre: string,
  storedNombre?: string | null,
): string {
  return storedNombre?.trim() || provisionalGrupoNombre(orden, personaNombre)
}
