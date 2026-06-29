import { query } from './_generated/server'
import { requireAdmin } from './lib/authorization'
import { isPersonaCoveredByCheckin } from './lib/checkinPair'

function hourKey(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`
}

function dayKey(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const getKpis = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const personas = await ctx.db.query('personas').collect()
    const checkins = await ctx.db.query('checkins').collect()
    const grupos = await ctx.db.query('grupos').collect()
    const integrantes = await ctx.db.query('integrantes').collect()
    const casosPendientes = (
      await ctx.db
        .query('casosRevision')
        .withIndex('by_estado', (q) => q.eq('estado', 'pendiente'))
        .collect()
    ).length

    const checkedInPersonaIds = new Set(checkins.map((c) => c.personaId))
    const totalPersonas = personas.length
    const checkinsRealizados = checkins.length
    const personasConCheckin = personas.filter((p) =>
      isPersonaCoveredByCheckin(p, checkedInPersonaIds),
    ).length
    const personasSinCheckin = totalPersonas - personasConCheckin
    const porcentajeCheckin =
      totalPersonas === 0 ? 0 : Math.round((personasConCheckin / totalPersonas) * 100)

    const gruposPorPersona = new Map<string, number>()
    for (const g of grupos) {
      gruposPorPersona.set(g.personaId, (gruposPorPersona.get(g.personaId) ?? 0) + 1)
    }
    let conUnGrupo = 0
    let conDosGrupos = 0
    for (const count of gruposPorPersona.values()) {
      if (count === 1) conUnGrupo++
      if (count >= 2) conDosGrupos++
    }

    const promedioIntegrantesPorGrupo =
      grupos.length === 0 ? 0 : Math.round((integrantes.length / grupos.length) * 10) / 10

    const checkinsPorOperador: Record<string, number> = {}
    for (const c of checkins) {
      checkinsPorOperador[c.operadorId] = (checkinsPorOperador[c.operadorId] ?? 0) + 1
    }

    const checkinsPorHora: Record<string, number> = {}
    const checkinsPorDia: Record<string, number> = {}
    for (const c of checkins) {
      const hk = hourKey(c.createdAt)
      const dk = dayKey(c.createdAt)
      checkinsPorHora[hk] = (checkinsPorHora[hk] ?? 0) + 1
      checkinsPorDia[dk] = (checkinsPorDia[dk] ?? 0) + 1
    }

    return {
      totalPersonas,
      checkinsRealizados,
      porcentajeCheckin,
      personasSinCheckin,
      totalGrupos: grupos.length,
      conUnGrupo,
      conDosGrupos,
      totalIntegrantes: integrantes.length,
      promedioIntegrantesPorGrupo,
      casosPendientes,
      checkinsPorOperador,
      checkinsPorHora,
      checkinsPorDia,
    }
  },
})
