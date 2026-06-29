export type GrupoInput = {
  nombre?: string
  integrantes: string[]
}

export function normalizeSearchTerm(term: string) {
  return term.trim().toLowerCase()
}

export function validateCheckinPayload(
  cantidadGrupos: 1 | 2,
  grupos: GrupoInput[],
) {
  if (cantidadGrupos !== 1 && cantidadGrupos !== 2) {
    throw new Error('La cantidad de grupos debe ser 1 o 2')
  }
  if (grupos.length !== cantidadGrupos) {
    throw new Error('Debe capturar exactamente la cantidad de grupos seleccionada')
  }
  for (const [i, grupo] of grupos.entries()) {
    const nombres = grupo.integrantes.map((n) => n.trim()).filter(Boolean)
    if (nombres.length === 0) {
      throw new Error(`El grupo ${i + 1} requiere al menos un integrante`)
    }
  }
}

export function canAddSecondGroup(
  existingGroupCount: number,
  declaredGroupCount: 1 | 2,
) {
  return existingGroupCount < declaredGroupCount && existingGroupCount < 2
}

export function buildSpouseSuggestion(esposoNombre?: string) {
  const trimmed = esposoNombre?.trim()
  return trimmed ? [trimmed] : []
}
