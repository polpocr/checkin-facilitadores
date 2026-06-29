import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type Ctx = QueryCtx | MutationCtx

export type EffectiveCheckin = {
  checkin: Doc<'checkins'>
  viaPersonaId: Id<'personas'>
  viaPareja: boolean
}

export function normalizeIntegranteNombre(name: string) {
  return name.trim().toLowerCase()
}

export function personaMatchesIntegranteNombre(
  persona: Pick<Doc<'personas'>, 'nombreCompleto'>,
  integranteNombre: string,
) {
  return (
    normalizeIntegranteNombre(persona.nombreCompleto) ===
    normalizeIntegranteNombre(integranteNombre)
  )
}

export async function personaParticipatesInCheckin(
  ctx: Ctx,
  persona: Doc<'personas'>,
  checkinId: Id<'checkins'>,
) {
  const grupos = await ctx.db
    .query('grupos')
    .withIndex('by_checkin', (q) => q.eq('checkinId', checkinId))
    .collect()

  for (const grupo of grupos) {
    const integrantes = await ctx.db
      .query('integrantes')
      .withIndex('by_grupo', (q) => q.eq('grupoId', grupo._id))
      .collect()
    if (integrantes.some((i) => personaMatchesIntegranteNombre(persona, i.nombre))) {
      return true
    }
  }
  return false
}

/** Linked pairs where both partners have their own check-in row. */
export function countParejasConCheckinPropio(
  personas: Doc<'personas'>[],
  checkedInPersonaIds: Set<string>,
) {
  const counted = new Set<string>()
  let parejasConCheckinMutuo = 0
  let totalParejasVinculadas = 0

  for (const p of personas) {
    const parejaId = p.parejaPersonaId
    if (!parejaId) continue

    const pairKey = [p._id, parejaId].sort().join(':')
    if (counted.has(pairKey)) continue
    counted.add(pairKey)
    totalParejasVinculadas++

    if (checkedInPersonaIds.has(p._id) && checkedInPersonaIds.has(parejaId)) {
      parejasConCheckinMutuo++
    }
  }

  return { parejasConCheckinMutuo, totalParejasVinculadas }
}

/** Blocks duplicate check-in: own record, or listed in pareja's grupos. */
export async function findBlockingCheckin(
  ctx: Ctx,
  personaId: Id<'personas'>,
): Promise<EffectiveCheckin | null> {
  const self = await ctx.db
    .query('checkins')
    .withIndex('by_persona', (q) => q.eq('personaId', personaId))
    .first()
  if (self) return { checkin: self, viaPersonaId: personaId, viaPareja: false }

  const persona = await ctx.db.get(personaId)
  if (!persona) return null
  const parejaPersonaId = persona.parejaPersonaId
  if (!parejaPersonaId) return null

  const partnerCheckin = await ctx.db
    .query('checkins')
    .withIndex('by_persona', (q) => q.eq('personaId', parejaPersonaId))
    .first()
  if (!partnerCheckin) return null

  const participates = await personaParticipatesInCheckin(ctx, persona, partnerCheckin._id)
  if (!participates) return null

  return {
    checkin: partnerCheckin,
    viaPersonaId: parejaPersonaId,
    viaPareja: true,
  }
}

export async function findEffectiveCheckin(
  ctx: Ctx,
  personaId: Id<'personas'>,
): Promise<EffectiveCheckin | null> {
  const self = await ctx.db
    .query('checkins')
    .withIndex('by_persona', (q) => q.eq('personaId', personaId))
    .first()
  if (self) return { checkin: self, viaPersonaId: personaId, viaPareja: false }

  const persona = await ctx.db.get(personaId)
  if (!persona) return null
  const parejaPersonaId = persona.parejaPersonaId
  if (!parejaPersonaId) return null

  const partnerCheckin = await ctx.db
    .query('checkins')
    .withIndex('by_persona', (q) => q.eq('personaId', parejaPersonaId))
    .first()
  if (!partnerCheckin) return null

  return {
    checkin: partnerCheckin,
    viaPersonaId: parejaPersonaId,
    viaPareja: true,
  }
}

export function isPersonaCoveredByCheckin(
  persona: Doc<'personas'>,
  checkedInPersonaIds: Set<string>,
) {
  if (checkedInPersonaIds.has(persona._id)) return true
  if (persona.parejaPersonaId && checkedInPersonaIds.has(persona.parejaPersonaId)) {
    return true
  }
  return false
}
