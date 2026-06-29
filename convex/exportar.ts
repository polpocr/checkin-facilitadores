import { query } from './_generated/server'
import { v } from 'convex/values'
import { requireAdmin } from './lib/authorization'
import { findEffectiveCheckin } from './lib/checkinPair'
import { resolveGrupoNombre } from './lib/grupoProvisionalName'

function formatOptionalBoolean(value: boolean | undefined): string {
  if (value === true) return 'Sí'
  if (value === false) return 'No'
  return ''
}

const exportRowValidator = v.object({
  nombreCompleto: v.string(),
  documento: v.string(),
  contacto: v.string(),
  coordinadorFacilitador: v.string(),
  falta: v.string(),
  carreraCrecimiento: v.string(),
  llevoGrupoConexion: v.string(),
  parejaNombre: v.string(),
  parejaVinculada: v.string(),
  parejaCarreraCrecimiento: v.string(),
  parejaLlevoGrupoConexion: v.string(),
  tieneCheckin: v.boolean(),
  checkinViaPareja: v.boolean(),
  checkinViaPersonaNombre: v.string(),
  checkinFecha: v.string(),
  cantidadGrupos: v.string(),
  grupo1Nombre: v.string(),
  grupo1Categoria: v.string(),
  grupo1Integrantes: v.string(),
  grupo2Nombre: v.string(),
  grupo2Categoria: v.string(),
  grupo2Integrantes: v.string(),
})

export const personasYGrupos = query({
  args: {},
  returns: v.array(exportRowValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const personas = await ctx.db.query('personas').collect()
    personas.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'))

    const rows = []
    for (const persona of personas) {
      const pareja = persona.parejaPersonaId
        ? await ctx.db.get(persona.parejaPersonaId)
        : null

      const effective = await findEffectiveCheckin(ctx, persona._id)

      let checkinViaPareja = false
      let checkinViaPersonaNombre = ''
      let checkinFecha = ''
      let cantidadGrupos = ''
      let grupo1Nombre = ''
      let grupo1Categoria = ''
      let grupo1Integrantes = ''
      let grupo2Nombre = ''
      let grupo2Categoria = ''
      let grupo2Integrantes = ''

      if (effective) {
        checkinViaPareja = effective.viaPareja
        if (effective.viaPareja) {
          const viaPersona = await ctx.db.get(effective.viaPersonaId)
          checkinViaPersonaNombre = viaPersona?.nombreCompleto ?? ''
        }

        const checkin = effective.checkin
        checkinFecha = new Date(checkin.createdAt).toISOString()
        cantidadGrupos = String(checkin.cantidadGrupos)

        const grupos = await ctx.db
          .query('grupos')
          .withIndex('by_checkin', (q) => q.eq('checkinId', checkin._id))
          .collect()

        const ownerPersona = await ctx.db.get(effective.viaPersonaId)

        for (const grupo of grupos.sort((a, b) => a.orden - b.orden)) {
          const integrantes = await ctx.db
            .query('integrantes')
            .withIndex('by_grupo', (q) => q.eq('grupoId', grupo._id))
            .collect()
          const nombres = integrantes
            .sort((a, b) => a.orden - b.orden)
            .map((i) => i.nombre)
            .join('; ')
          const nombre = resolveGrupoNombre(grupo.orden, ownerPersona?.nombreCompleto, grupo.nombre)

          if (grupo.orden === 1) {
            grupo1Nombre = nombre
            grupo1Categoria = grupo.categoria
            grupo1Integrantes = nombres
          } else if (grupo.orden === 2) {
            grupo2Nombre = nombre
            grupo2Categoria = grupo.categoria
            grupo2Integrantes = nombres
          }
        }
      }

      rows.push({
        nombreCompleto: persona.nombreCompleto,
        documento: persona.documento,
        contacto: persona.contacto ?? '',
        coordinadorFacilitador: formatOptionalBoolean(persona.coordinadorFacilitador),
        falta: formatOptionalBoolean(persona.falta),
        carreraCrecimiento: formatOptionalBoolean(persona.carreraCrecimiento),
        llevoGrupoConexion: formatOptionalBoolean(persona.llevoGrupoConexion),
        parejaNombre: persona.parejaNombre ?? '',
        parejaVinculada: pareja?.nombreCompleto ?? '',
        parejaCarreraCrecimiento: formatOptionalBoolean(persona.parejaCarreraCrecimiento),
        parejaLlevoGrupoConexion: formatOptionalBoolean(persona.parejaLlevoGrupoConexion),
        tieneCheckin: !!effective,
        checkinViaPareja,
        checkinViaPersonaNombre,
        checkinFecha,
        cantidadGrupos,
        grupo1Nombre,
        grupo1Categoria,
        grupo1Integrantes,
        grupo2Nombre,
        grupo2Categoria,
        grupo2Integrantes,
      })
    }

    return rows
  },
})
