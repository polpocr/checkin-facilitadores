import {
  buildSpouseSuggestion,
  canAddSecondGroup,
  normalizeSearchTerm,
  validateCheckinPayload,
} from './checkin-rules'
import { provisionalGrupoNombre } from './grupo-provisional-name'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

// ponytail: assert-based self-check; upgrade to vitest if rules grow
export function runCheckinRulesSelfCheck() {
  validateCheckinPayload(1, [{ integrantes: ['Ana'] }])
  validateCheckinPayload(2, [
    { integrantes: ['Ana'] },
    { integrantes: ['Luis', 'María'] },
  ])

  let threw = false
  try {
    validateCheckinPayload(2, [{ integrantes: ['Ana'] }])
  } catch {
    threw = true
  }
  assert(threw, 'expected mismatch error')

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
