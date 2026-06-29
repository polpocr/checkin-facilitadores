import assert from 'node:assert/strict'
import { escapeCsvField, rowsToCsv, type ExportRow } from './export-personas-grupos-csv'

function sampleRow(overrides: Partial<ExportRow> = {}): ExportRow {
  return {
    nombreCompleto: 'Ana',
    documento: '123',
    contacto: '',
    parejaNombre: '',
    parejaVinculada: '',
    tieneCheckin: false,
    checkinViaPareja: false,
    checkinViaPersonaNombre: '',
    checkinFecha: '',
    cantidadGrupos: '',
    grupo1Nombre: '',
    grupo1Integrantes: '',
    grupo2Nombre: '',
    grupo2Integrantes: '',
    ...overrides,
  }
}

function runExportCsvSelfCheck() {
  assert.equal(escapeCsvField('simple'), 'simple')
  assert.equal(escapeCsvField('a,b'), '"a,b"')
  assert.equal(escapeCsvField('say "hi"'), '"say ""hi"""')
  assert.equal(escapeCsvField('line\nbreak'), '"line\nbreak"')

  const csv = rowsToCsv([
    sampleRow({
      nombreCompleto: 'García, Luis',
      contacto: 'tel "oficina"',
      tieneCheckin: true,
      grupo1Integrantes: 'Ana; Luis',
    }),
  ])

  assert.ok(csv.startsWith('\uFEFF'), 'BOM UTF-8')
  assert.ok(csv.includes('"García, Luis"'), 'comma escaped')
  assert.ok(csv.includes('"tel ""oficina"""'), 'quotes escaped')
  assert.ok(csv.includes('Sí'), 'boolean as Sí')
}

runExportCsvSelfCheck()
console.log('export-personas-grupos-csv: ok')
