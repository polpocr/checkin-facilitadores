import {
  buildSpouseSuggestion,
  canAddSecondGroup,
  normalizeSearchTerm,
  validateCheckinPayload,
} from './checkin-rules'
import { provisionalGrupoNombre } from './grupo-provisional-name'

const CATEGORIA = 'G.C Bíblico' as const

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

// ponytail: assert-based self-check; upgrade to vitest if rules grow
export function runCheckinRulesSelfCheck() {
  validateCheckinPayload(1, [{ categoria: CATEGORIA, integrantes: ['Ana'] }])
  validateCheckinPayload(2, [
    { categoria: CATEGORIA, integrantes: ['Ana'] },
    { categoria: 'G.C Interés', integrantes: ['Luis', 'María'] },
  ])

  let threw = false
  try {
    validateCheckinPayload(2, [{ categoria: CATEGORIA, integrantes: ['Ana'] }])
  } catch {
    threw = true
  }
  assert(threw, 'expected mismatch error')

  threw = false
  try {
    validateCheckinPayload(1, [{ categoria: '' as typeof CATEGORIA, integrantes: ['Ana'] }])
  } catch {
    threw = true
  }
  assert(threw, 'expected missing categoria error')

  assert(canAddSecondGroup(1, 2), 'should allow second group')
  assert(!canAddSecondGroup(2, 2), 'should block third group')
  assert(buildSpouseSuggestion('  Pedro  ')[0] === 'Pedro', 'spouse suggestion')
  assert(provisionalGrupoNombre(1, 'Marianita López') === 'G1-MARIANITA', 'provisional grupo name')
  assert(provisionalGrupoNombre(2, '  Ana María  ') === 'G2-ANA', 'provisional grupo first token')
  assert(normalizeSearchTerm('  Ana  ') === 'ana', 'normalize search')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCheckinRulesSelfCheck()
  console.log('checkin-rules: ok')
}
