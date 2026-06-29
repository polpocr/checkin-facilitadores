import { mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { requireAdmin } from './lib/authorization'
import { resolveGrupoNombre } from './lib/grupoProvisionalName'

export const list = query({
  args: {
    personaId: v.optional(v.id('personas')),
    checkinId: v.optional(v.id('checkins')),
    orden: v.optional(v.union(v.literal(1), v.literal(2))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    let rows = await ctx.db.query('grupos').collect()
    if (args.personaId) rows = rows.filter((g) => g.personaId === args.personaId)
    if (args.checkinId) rows = rows.filter((g) => g.checkinId === args.checkinId)
    if (args.orden) rows = rows.filter((g) => g.orden === args.orden)
    return rows.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getDetail = query({
  args: { id: v.id('grupos') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const grupo = await ctx.db.get(args.id)
    if (!grupo) return null
    const integrantes = (
      await ctx.db
        .query('integrantes')
        .withIndex('by_grupo', (q) => q.eq('grupoId', grupo._id))
        .collect()
    ).sort((a, b) => a.orden - b.orden)
    const persona = await ctx.db.get(grupo.personaId)
    const checkin = await ctx.db.get(grupo.checkinId)
    return { grupo, integrantes, persona, checkin }
  },
})

export const create = mutation({
  args: {
    personaId: v.id('personas'),
    checkinId: v.id('checkins'),
    nombre: v.optional(v.string()),
    orden: v.union(v.literal(1), v.literal(2)),
    integrantes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const nombres = args.integrantes.map((n) => n.trim()).filter(Boolean)
    if (nombres.length === 0) throw new ConvexError('Al menos un integrante requerido')

    const existing = await ctx.db
      .query('grupos')
      .withIndex('by_persona_orden', (q) =>
        q.eq('personaId', args.personaId).eq('orden', args.orden),
      )
      .first()
    if (existing) throw new ConvexError('Ya existe un grupo con ese orden')

    const persona = await ctx.db.get(args.personaId)
    const nombre = resolveGrupoNombre(args.orden, persona?.nombreCompleto, args.nombre)

    const now = Date.now()
    const grupoId = await ctx.db.insert('grupos', {
      personaId: args.personaId,
      checkinId: args.checkinId,
      nombre,
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
  },
})

export const update = mutation({
  args: {
    id: v.id('grupos'),
    nombre: v.optional(v.string()),
    orden: v.optional(v.union(v.literal(1), v.literal(2))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const grupo = await ctx.db.get(args.id)
    if (!grupo) throw new ConvexError('Grupo no encontrado')

    if (args.orden && args.orden !== grupo.orden) {
      const clash = await ctx.db
        .query('grupos')
        .withIndex('by_persona_orden', (q) =>
          q.eq('personaId', grupo.personaId).eq('orden', args.orden!),
        )
        .first()
      if (clash && clash._id !== args.id) {
        throw new ConvexError('Ya existe un grupo con ese orden')
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.nombre !== undefined ? { nombre: args.nombre.trim() || undefined } : {}),
      ...(args.orden !== undefined ? { orden: args.orden } : {}),
      updatedAt: Date.now(),
    })
    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id('grupos') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const integrantes = await ctx.db
      .query('integrantes')
      .withIndex('by_grupo', (q) => q.eq('grupoId', args.id))
      .collect()
    for (const i of integrantes) await ctx.db.delete(i._id)
    await ctx.db.delete(args.id)
    return { ok: true as const }
  },
})
