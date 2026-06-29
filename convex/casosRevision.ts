import { mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { requireAdmin, requireOperador } from './lib/authorization'

export const create = mutation({
  args: { textoBusqueda: v.string() },
  handler: async (ctx, args) => {
    const operador = await requireOperador(ctx)
    const texto = args.textoBusqueda.trim()
    if (texto.length < 2) throw new ConvexError('Ingrese un texto de búsqueda válido')

    const now = Date.now()
    return ctx.db.insert('casosRevision', {
      textoBusqueda: texto,
      operadorId: operador._id,
      estado: 'pendiente',
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const list = query({
  args: {
    estado: v.optional(v.union(v.literal('pendiente'), v.literal('resuelto'))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    let rows = await ctx.db.query('casosRevision').collect()
    if (args.estado) rows = rows.filter((c) => c.estado === args.estado)
    return rows.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const resolve = mutation({
  args: {
    id: v.id('casosRevision'),
    personaId: v.optional(v.id('personas')),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    const caso = await ctx.db.get(args.id)
    if (!caso) throw new ConvexError('Caso no encontrado')

    const now = Date.now()
    await ctx.db.patch(args.id, {
      estado: 'resuelto',
      personaId: args.personaId,
      notas: args.notas?.trim() || undefined,
      resueltoAt: now,
      resueltoPorId: admin._id,
      updatedAt: now,
    })
    return args.id
  },
})

export const update = mutation({
  args: {
    id: v.id('casosRevision'),
    notas: v.optional(v.string()),
    personaId: v.optional(v.id('personas')),
    estado: v.optional(v.union(v.literal('pendiente'), v.literal('resuelto'))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const caso = await ctx.db.get(args.id)
    if (!caso) throw new ConvexError('Caso no encontrado')

    await ctx.db.patch(args.id, {
      ...(args.notas !== undefined ? { notas: args.notas.trim() || undefined } : {}),
      ...(args.personaId !== undefined ? { personaId: args.personaId } : {}),
      ...(args.estado !== undefined ? { estado: args.estado } : {}),
      updatedAt: Date.now(),
    })
    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id('casosRevision') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.delete(args.id)
    return { ok: true as const }
  },
})
