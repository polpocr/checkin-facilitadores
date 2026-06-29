import { mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { requireAdmin } from './lib/authorization'

export const list = query({
  args: {
    grupoId: v.optional(v.id('grupos')),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    let rows = await ctx.db.query('integrantes').collect()
    if (args.grupoId) rows = rows.filter((i) => i.grupoId === args.grupoId)
    const term = args.search?.trim().toLowerCase()
    if (term) rows = rows.filter((i) => i.nombre.toLowerCase().includes(term))
    return rows.sort((a, b) => a.orden - b.orden)
  },
})

export const create = mutation({
  args: {
    grupoId: v.id('grupos'),
    nombre: v.string(),
    orden: v.optional(v.number()),
    conyugeId: v.optional(v.id('integrantes')),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const grupo = await ctx.db.get(args.grupoId)
    if (!grupo) throw new ConvexError('Grupo no encontrado')

    const existing = await ctx.db
      .query('integrantes')
      .withIndex('by_grupo', (q) => q.eq('grupoId', args.grupoId))
      .collect()
    const orden = args.orden ?? existing.length + 1
    const now = Date.now()

    const id = await ctx.db.insert('integrantes', {
      grupoId: args.grupoId,
      nombre: args.nombre.trim(),
      orden,
      conyugeId: args.conyugeId,
      createdAt: now,
      updatedAt: now,
    })

    if (args.conyugeId) {
      await ctx.db.patch(args.conyugeId, { conyugeId: id, updatedAt: now })
    }

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id('integrantes'),
    nombre: v.optional(v.string()),
    orden: v.optional(v.number()),
    conyugeId: v.optional(v.union(v.id('integrantes'), v.null())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const integrante = await ctx.db.get(args.id)
    if (!integrante) throw new ConvexError('Integrante no encontrado')

    const now = Date.now()
    if (integrante.conyugeId && integrante.conyugeId !== args.conyugeId) {
      const prev = await ctx.db.get(integrante.conyugeId)
      if (prev?.conyugeId === args.id) {
        await ctx.db.patch(integrante.conyugeId, { conyugeId: undefined, updatedAt: now })
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.nombre !== undefined ? { nombre: args.nombre.trim() } : {}),
      ...(args.orden !== undefined ? { orden: args.orden } : {}),
      ...(args.conyugeId !== undefined
        ? { conyugeId: args.conyugeId === null ? undefined : args.conyugeId }
        : {}),
      updatedAt: now,
    })

    if (args.conyugeId && args.conyugeId !== null) {
      await ctx.db.patch(args.conyugeId, { conyugeId: args.id, updatedAt: now })
    }

    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id('integrantes') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const integrante = await ctx.db.get(args.id)
    if (!integrante) throw new ConvexError('Integrante no encontrado')

    if (integrante.conyugeId) {
      const conyuge = await ctx.db.get(integrante.conyugeId)
      if (conyuge?.conyugeId === args.id) {
        await ctx.db.patch(integrante.conyugeId, {
          conyugeId: undefined,
          updatedAt: Date.now(),
        })
      }
    }

    await ctx.db.delete(args.id)
    return { ok: true as const }
  },
})
