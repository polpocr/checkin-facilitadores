import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type Ctx = QueryCtx | MutationCtx

export type EffectiveCheckin = {
  checkin: Doc<'checkins'>
  viaPersonaId: Id<'personas'>
  viaPareja: boolean
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
  if (!persona?.parejaPersonaId) return null

  const partnerCheckin = await ctx.db
    .query('checkins')
    .withIndex('by_persona', (q) => q.eq('personaId', persona.parejaPersonaId!))
    .first()
  if (!partnerCheckin) return null

  return {
    checkin: partnerCheckin,
    viaPersonaId: persona.parejaPersonaId,
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
