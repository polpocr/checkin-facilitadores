import type { FunctionReturnType } from 'convex/server'
import type { api } from '@convex/_generated/api'

export type ExportRow = FunctionReturnType<typeof api.exportar.personasYGrupos>[number]

const COLUMNS: { key: keyof ExportRow; header: string }[] = [
  { key: 'nombreCompleto', header: 'Nombre completo' },
  { key: 'documento', header: 'Documento' },
  { key: 'contacto', header: 'Contacto' },
  { key: 'coordinadorFacilitador', header: 'Coordinador/Facilitador' },
  { key: 'falta', header: 'Falta' },
  { key: 'carreraCrecimiento', header: 'Carrera crecimiento' },
  { key: 'llevoGrupoConexion', header: 'Grupo Conexión' },
  { key: 'parejaNombre', header: 'Pareja (sugerencia)' },
  { key: 'parejaVinculada', header: 'Pareja vinculada' },
  { key: 'parejaFalta', header: 'Falta pareja' },
  { key: 'tieneCheckin', header: 'Tiene check-in' },
  { key: 'checkinViaPareja', header: 'Check-in vía pareja' },
  { key: 'checkinViaPersonaNombre', header: 'Check-in vía persona' },
  { key: 'checkinFecha', header: 'Fecha check-in' },
  { key: 'cantidadGrupos', header: 'Cantidad grupos' },
  { key: 'grupo1Nombre', header: 'Grupo 1' },
  { key: 'grupo1Categoria', header: 'Categoría grupo 1' },
  { key: 'grupo1Integrantes', header: 'Integrantes grupo 1' },
  { key: 'grupo2Nombre', header: 'Grupo 2' },
  { key: 'grupo2Categoria', header: 'Categoría grupo 2' },
  { key: 'grupo2Integrantes', header: 'Integrantes grupo 2' },
]

export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatCell(value: ExportRow[keyof ExportRow]): string {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  return String(value ?? '')
}

export function rowsToCsv(rows: ExportRow[]): string {
  const header = COLUMNS.map((c) => escapeCsvField(c.header)).join(',')
  const body = rows
    .map((row) =>
      COLUMNS.map((c) => escapeCsvField(formatCell(row[c.key]))).join(','),
    )
    .join('\n')
  return `\uFEFF${header}\n${body}`
}

export function downloadPersonasGruposCsv(rows: ExportRow[]) {
  const csv = rowsToCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `personas-grupos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
