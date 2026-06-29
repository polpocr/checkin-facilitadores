import { mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { requireAdmin } from './lib/authorization'

function normalizeDocumento(documento: string) {
  return documento.trim().toLowerCase()
}

export const list = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const all = await ctx.db.query('facilitadores').collect()
    const term = args.search?.trim().toLowerCase()
    if (!term) return all.sort((a, b) => b.createdAt - a.createdAt)
    return all
      .filter(
        (f) =>
          f.nombreCompleto.toLowerCase().includes(term) ||
          f.documento.toLowerCase().includes(term),
      )
      .sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const create = mutation({
  args: {
    nombreCompleto: v.string(),
    documento: v.string(),
    contacto: v.optional(v.string()),
    esposoNombre: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const documento = normalizeDocumento(args.documento)
    const existing = await ctx.db
      .query('facilitadores')
      .withIndex('by_documento', (q) => q.eq('documento', documento))
      .first()
    if (existing) throw new ConvexError('Ya existe un facilitador con ese documento')

    const now = Date.now()
    return ctx.db.insert('facilitadores', {
      nombreCompleto: args.nombreCompleto.trim(),
      documento,
      contacto: args.contacto?.trim() || undefined,
      esposoNombre: args.esposoNombre?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('facilitadores'),
    nombreCompleto: v.optional(v.string()),
    documento: v.optional(v.string()),
    contacto: v.optional(v.string()),
    esposoNombre: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const facilitador = await ctx.db.get(args.id)
    if (!facilitador) throw new ConvexError('Facilitador no encontrado')

    if (args.documento) {
      const documento = normalizeDocumento(args.documento)
      const existing = await ctx.db
        .query('facilitadores')
        .withIndex('by_documento', (q) => q.eq('documento', documento))
        .first()
      if (existing && existing._id !== args.id) {
        throw new ConvexError('Ya existe un facilitador con ese documento')
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.nombreCompleto !== undefined
        ? { nombreCompleto: args.nombreCompleto.trim() }
        : {}),
      ...(args.documento !== undefined
        ? { documento: normalizeDocumento(args.documento) }
        : {}),
      ...(args.contacto !== undefined ? { contacto: args.contacto.trim() || undefined } : {}),
      ...(args.esposoNombre !== undefined
        ? { esposoNombre: args.esposoNombre.trim() || undefined }
        : {}),
      updatedAt: Date.now(),
    })
    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id('facilitadores') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.delete(args.id)
    return { ok: true as const }
  },
})
