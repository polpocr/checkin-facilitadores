import { mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { requireAdmin, requireOperador } from './lib/authorization'
import {
  findBlockingCheckin,
  personaMatchesIntegranteNombre,
} from './lib/checkinPair'

function normalizeDocumento(documento: string) {
  return documento.trim().toLowerCase()
}

export const search = query({
  args: { term: v.string() },
  handler: async (ctx, args) => {
    await requireOperador(ctx)
    const term = args.term.trim()
    if (term.length < 2) return []

    const byDoc = await ctx.db
      .query('personas')
      .withIndex('by_documento', (q) => q.eq('documento', normalizeDocumento(term)))
      .collect()

    const byName = await ctx.db
      .query('personas')
      .withSearchIndex('search_nombre', (q) => q.search('nombreCompleto', term))
      .take(20)

    const map = new Map<string, (typeof byDoc)[number]>()
    for (const p of [...byDoc, ...byName]) map.set(p._id, p)
    return Array.from(map.values()).slice(0, 20)
  },
})

export const getById = query({
  args: { id: v.id('personas') },
  handler: async (ctx, args) => {
    await requireOperador(ctx)
    return ctx.db.get(args.id)
  },
})

export const getCheckinStatus = query({
  args: { personaId: v.id('personas') },
  handler: async (ctx, args) => {
    await requireOperador(ctx)
    const effective = await findBlockingCheckin(ctx, args.personaId)

    if (!effective) {
      const persona = await ctx.db.get(args.personaId)
      let pareja: Doc<'personas'> | null = null
      if (persona?.parejaPersonaId) {
        pareja = await ctx.db.get(persona.parejaPersonaId)
      }
      return {
        hasCheckin: false as const,
        checkin: null,
        grupos: [],
        integrantesByGrupo: {},
        viaPareja: false as const,
        viaPersonaId: null,
        viaPersonaNombre: null,
        pareja,
      }
    }

    const persona = await ctx.db.get(args.personaId)
    const viaPersona = await ctx.db.get(effective.viaPersonaId)
    const allGrupos = await ctx.db
      .query('grupos')
      .withIndex('by_checkin', (q) => q.eq('checkinId', effective.checkin._id))
      .collect()

    const integrantesByGrupo: Record<string, Doc<'integrantes'>[]> = {}
    for (const grupo of allGrupos) {
      const integrantes = await ctx.db
        .query('integrantes')
        .withIndex('by_grupo', (q) => q.eq('grupoId', grupo._id))
        .collect()
      integrantesByGrupo[grupo._id] = integrantes
    }

    const grupos =
      effective.viaPareja && persona
        ? allGrupos.filter((grupo) =>
            (integrantesByGrupo[grupo._id] ?? []).some((i) =>
              personaMatchesIntegranteNombre(persona, i.nombre),
            ),
          )
        : allGrupos

    return {
      hasCheckin: true as const,
      checkin: effective.checkin,
      grupos,
      integrantesByGrupo,
      viaPareja: effective.viaPareja,
      viaPersonaId: effective.viaPersonaId,
      viaPersonaNombre: viaPersona?.nombreCompleto ?? null,
      pareja: effective.viaPareja ? viaPersona : null,
    }
  },
})

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const all = await ctx.db.query('personas').collect()
    const term = args.search?.trim().toLowerCase()
    if (!term) return all.sort((a, b) => b.createdAt - a.createdAt)
    return all
      .filter(
        (p) =>
          p.nombreCompleto.toLowerCase().includes(term) ||
          p.documento.toLowerCase().includes(term),
      )
      .sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const create = mutation({
  args: {
    nombreCompleto: v.string(),
    documento: v.string(),
    contacto: v.optional(v.string()),
    parejaNombre: v.optional(v.string()),
    parejaPersonaId: v.optional(v.id('personas')),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const documento = normalizeDocumento(args.documento)
    const existing = await ctx.db
      .query('personas')
      .withIndex('by_documento', (q) => q.eq('documento', documento))
      .first()
    if (existing) throw new ConvexError('Ya existe una persona con ese documento')

    const now = Date.now()
    const id = await ctx.db.insert('personas', {
      nombreCompleto: args.nombreCompleto.trim(),
      documento,
      contacto: args.contacto?.trim() || undefined,
      parejaNombre: args.parejaNombre?.trim() || undefined,
      parejaPersonaId: args.parejaPersonaId,
      createdAt: now,
      updatedAt: now,
    })

    if (args.parejaPersonaId) {
      await ctx.db.patch(args.parejaPersonaId, { parejaPersonaId: id, updatedAt: now })
    }

    return id
  },
})

export const update = mutation({
  args: {
    id: v.id('personas'),
    nombreCompleto: v.optional(v.string()),
    documento: v.optional(v.string()),
    contacto: v.optional(v.string()),
    parejaNombre: v.optional(v.string()),
    parejaPersonaId: v.optional(v.union(v.id('personas'), v.null())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const persona = await ctx.db.get(args.id)
    if (!persona) throw new ConvexError('Persona no encontrada')

    if (args.documento) {
      const documento = normalizeDocumento(args.documento)
      const existing = await ctx.db
        .query('personas')
        .withIndex('by_documento', (q) => q.eq('documento', documento))
        .first()
      if (existing && existing._id !== args.id) {
        throw new ConvexError('Ya existe una persona con ese documento')
      }
    }

    const now = Date.now()
    if (persona.parejaPersonaId && persona.parejaPersonaId !== args.parejaPersonaId) {
      const prev = await ctx.db.get(persona.parejaPersonaId)
      if (prev?.parejaPersonaId === args.id) {
        await ctx.db.patch(persona.parejaPersonaId, { parejaPersonaId: undefined, updatedAt: now })
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.nombreCompleto !== undefined
        ? { nombreCompleto: args.nombreCompleto.trim() }
        : {}),
      ...(args.documento !== undefined ? { documento: normalizeDocumento(args.documento) } : {}),
      ...(args.contacto !== undefined ? { contacto: args.contacto.trim() || undefined } : {}),
      ...(args.parejaNombre !== undefined
        ? { parejaNombre: args.parejaNombre.trim() || undefined }
        : {}),
      ...(args.parejaPersonaId !== undefined
        ? {
            parejaPersonaId:
              args.parejaPersonaId === null ? undefined : args.parejaPersonaId,
          }
        : {}),
      updatedAt: now,
    })

    if (args.parejaPersonaId && args.parejaPersonaId !== null) {
      await ctx.db.patch(args.parejaPersonaId, { parejaPersonaId: args.id, updatedAt: now })
    }

    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id('personas') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const effective = await findBlockingCheckin(ctx, args.id)
    if (effective) throw new ConvexError('No se puede eliminar: tiene check-in registrado')

    const persona = await ctx.db.get(args.id)
    if (persona?.parejaPersonaId) {
      const pareja = await ctx.db.get(persona.parejaPersonaId)
      if (pareja?.parejaPersonaId === args.id) {
        await ctx.db.patch(persona.parejaPersonaId, {
          parejaPersonaId: undefined,
          updatedAt: Date.now(),
        })
      }
    }

    await ctx.db.delete(args.id)
    return { ok: true as const }
  },
})
