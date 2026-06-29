import { mutation, query } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { requireAdmin, requireOperador } from './lib/authorization'
import type { Doc, Id } from './_generated/dataModel'
import { findBlockingCheckin, findEffectiveCheckin } from './lib/checkinPair'
import { grupoCategoriaValidator, type GrupoCategoria } from './lib/grupoCategoria'
import { resolveGrupoNombre } from './lib/grupoProvisionalName'

const grupoInput = v.object({
  nombre: v.optional(v.string()),
  categoria: grupoCategoriaValidator,
  integrantes: v.array(v.string()),
})

async function insertGrupoWithIntegrantes(
  ctx: MutationCtx,
  args: {
    personaId: Id<'personas'>
    checkinId: Id<'checkins'>
    orden: 1 | 2
    nombre?: string
    categoria: GrupoCategoria
    integrantes: string[]
  },
) {
  const now = Date.now()
  const nombres = args.integrantes.map((n) => n.trim()).filter(Boolean)
  if (nombres.length === 0) {
    throw new ConvexError(`El grupo ${args.orden} requiere al menos un integrante`)
  }

  const persona = await ctx.db.get(args.personaId)
  const nombre = resolveGrupoNombre(args.orden, persona?.nombreCompleto, args.nombre)

  const grupoId = await ctx.db.insert('grupos', {
    personaId: args.personaId,
    checkinId: args.checkinId,
    nombre,
    categoria: args.categoria,
    orden: args.orden,
    createdAt: now,
    updatedAt: now,
  })

  for (const [index, nombre] of nombres.entries()) {
    await ctx.db.insert('integrantes', {
      grupoId,
      nombre,
      orden: index + 1,
      createdAt: now,
      updatedAt: now,
    })
  }

  return grupoId
}

export const createWithGrupos = mutation({
  args: {
    personaId: v.id('personas'),
    cantidadGrupos: v.union(v.literal(1), v.literal(2)),
    grupos: v.array(grupoInput),
  },
  handler: async (ctx, args) => {
    const operador = await requireOperador(ctx)

    if (args.grupos.length !== args.cantidadGrupos) {
      throw new ConvexError('Debe capturar exactamente la cantidad de grupos seleccionada')
    }

    const existing = await findBlockingCheckin(ctx, args.personaId)
    if (existing) {
      const via = await ctx.db.get(existing.viaPersonaId)
      const msg = existing.viaPareja
        ? `Esta pareja ya tiene check-in registrado por ${via?.nombreCompleto ?? 'su pareja'}`
        : 'Esta persona ya tiene check-in registrado'
      throw new ConvexError(msg)
    }

    const now = Date.now()
    const checkinId = await ctx.db.insert('checkins', {
      personaId: args.personaId,
      operadorId: operador._id,
      cantidadGrupos: args.cantidadGrupos,
      createdAt: now,
      updatedAt: now,
    })

    for (const [index, grupo] of args.grupos.entries()) {
      await insertGrupoWithIntegrantes(ctx, {
        personaId: args.personaId,
        checkinId,
        orden: (index + 1) as 1 | 2,
        nombre: grupo.nombre,
        categoria: grupo.categoria,
        integrantes: grupo.integrantes,
      })
    }

    return checkinId
  },
})

export const addMissingGrupo = mutation({
  args: {
    personaId: v.id('personas'),
    grupo: grupoInput,
  },
  handler: async (ctx, args) => {
    const operador = await requireOperador(ctx)

    const effective = await findEffectiveCheckin(ctx, args.personaId)
    if (!effective) throw new ConvexError('La persona no tiene check-in')

    const checkin = effective.checkin
    const ownerPersonaId = effective.viaPersonaId

    const existingGrupos = await ctx.db
      .query('grupos')
      .withIndex('by_checkin', (q) => q.eq('checkinId', checkin._id))
      .collect()

    if (existingGrupos.length >= checkin.cantidadGrupos) {
      throw new ConvexError('Ya se capturaron todos los grupos declarados')
    }
    if (existingGrupos.length >= 2) {
      throw new ConvexError('Máximo 2 grupos por persona')
    }

    const nextOrden = (existingGrupos.length + 1) as 1 | 2
    const grupoId = await insertGrupoWithIntegrantes(ctx, {
      personaId: ownerPersonaId,
      checkinId: checkin._id,
      orden: nextOrden,
      nombre: args.grupo.nombre,
      categoria: args.grupo.categoria,
      integrantes: args.grupo.integrantes,
    })

    await ctx.db.patch(checkin._id, {
      updatedAt: Date.now(),
      operadorId: operador._id,
    })

    return grupoId
  },
})

export const list = query({
  args: {
    personaId: v.optional(v.id('personas')),
    operadorId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    let rows = await ctx.db.query('checkins').collect()
    if (args.personaId) {
      rows = rows.filter((c) => c.personaId === args.personaId)
    }
    if (args.operadorId) {
      rows = rows.filter((c) => c.operadorId === args.operadorId)
    }
    return rows.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getDetail = query({
  args: { id: v.id('checkins') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const checkin = await ctx.db.get(args.id)
    if (!checkin) return null

    const persona = await ctx.db.get(checkin.personaId)
    const operador = await ctx.db.get(checkin.operadorId)
    const grupos = await ctx.db
      .query('grupos')
      .withIndex('by_checkin', (q) => q.eq('checkinId', checkin._id))
      .collect()

    const gruposWithIntegrantes = []
    for (const grupo of grupos) {
      const integrantes = await ctx.db
        .query('integrantes')
        .withIndex('by_grupo', (q) => q.eq('grupoId', grupo._id))
        .collect()
      gruposWithIntegrantes.push({ ...grupo, integrantes })
    }

    return { checkin, persona, operador, grupos: gruposWithIntegrantes }
  },
})

export const update = mutation({
  args: {
    id: v.id('checkins'),
    cantidadGrupos: v.optional(v.union(v.literal(1), v.literal(2))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const checkin = await ctx.db.get(args.id)
    if (!checkin) throw new ConvexError('Check-in no encontrado')

    if (args.cantidadGrupos !== undefined) {
      const grupos = await ctx.db
        .query('grupos')
        .withIndex('by_checkin', (q) => q.eq('checkinId', checkin._id))
        .collect()
      if (grupos.length > args.cantidadGrupos) {
        throw new ConvexError('No puede reducir grupos por debajo de los ya creados')
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.cantidadGrupos !== undefined ? { cantidadGrupos: args.cantidadGrupos } : {}),
      updatedAt: Date.now(),
    })
    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id('checkins') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const checkin = await ctx.db.get(args.id)
    if (!checkin) throw new ConvexError('Check-in no encontrado')

    const grupos = await ctx.db
      .query('grupos')
      .withIndex('by_checkin', (q) => q.eq('checkinId', checkin._id))
      .collect()

    for (const grupo of grupos) {
      const integrantes = await ctx.db
        .query('integrantes')
        .withIndex('by_grupo', (q) => q.eq('grupoId', grupo._id))
        .collect()
      for (const integrante of integrantes) {
        await ctx.db.delete(integrante._id)
      }
      await ctx.db.delete(grupo._id)
    }

    await ctx.db.delete(args.id)
    return { ok: true as const }
  },
})

export type CheckinDoc = Doc<'checkins'>
