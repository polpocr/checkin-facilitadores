import {
  normalizeIntegranteNombre,
  personaMatchesIntegranteNombre,
} from './checkinPair'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

export function runCheckinPairSelfCheck() {
  assert(normalizeIntegranteNombre('  Ana María  ') === 'ana maría', 'normalize integrante')
  assert(
    personaMatchesIntegranteNombre(
      { nombreCompleto: 'RONALD JOSE CASCO ACEVEDO' },
      'ronald jose casco acevedo',
    ),
    'persona matches integrante',
  )
  assert(
    !personaMatchesIntegranteNombre(
      { nombreCompleto: 'RONALD JOSE CASCO ACEVEDO' },
      'Katherine Calvo',
    ),
    'different names do not match',
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCheckinPairSelfCheck()
  console.log('checkinPair: ok')
}
