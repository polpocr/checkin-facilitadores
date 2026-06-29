import {
  countParejasConCheckinPropio,
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

  const checked = new Set(['a', 'b', 'c'])
  const { parejasConCheckinMutuo, totalParejasVinculadas } = countParejasConCheckinPropio(
    [
      { _id: 'a', parejaPersonaId: 'b' } as never,
      { _id: 'b', parejaPersonaId: 'a' } as never,
      { _id: 'c', parejaPersonaId: 'd' } as never,
      { _id: 'd', parejaPersonaId: 'c' } as never,
      { _id: 'e', parejaPersonaId: 'f' } as never,
      { _id: 'f', parejaPersonaId: 'e' } as never,
    ],
    checked,
  )
  assert(totalParejasVinculadas === 3, 'counts linked pairs once')
  assert(parejasConCheckinMutuo === 1, 'only a-b both checked in')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCheckinPairSelfCheck()
  console.log('checkinPair: ok')
}
