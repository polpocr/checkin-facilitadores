import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { grupoCategoriaValidator } from './lib/grupoCategoria'

export default defineSchema({
  users: defineTable({
    betterAuthUserId: v.optional(v.string()),
    email: v.string(),
    fullName: v.optional(v.string()),
    role: v.union(v.literal('admin'), v.literal('operador')),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_better_auth_user_id', ['betterAuthUserId'])
    .index('by_email', ['email'])
    .index('by_role_active', ['role', 'active']),

  facilitadores: defineTable({
    nombreCompleto: v.string(),
    documento: v.string(),
    contacto: v.optional(v.string()),
    esposoNombre: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_documento', ['documento'])
    .searchIndex('search_nombre', {
      searchField: 'nombreCompleto',
      filterFields: [],
    }),

  personas: defineTable({
    nombreCompleto: v.string(),
    documento: v.string(),
    contacto: v.optional(v.string()),
    parejaNombre: v.optional(v.string()),
    parejaDocumento: v.optional(v.string()),
    parejaContacto: v.optional(v.string()),
    parejaPersonaId: v.optional(v.id('personas')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_documento', ['documento'])
    .searchIndex('search_nombre', {
      searchField: 'nombreCompleto',
      filterFields: [],
    }),

  checkins: defineTable({
    personaId: v.id('personas'),
    operadorId: v.id('users'),
    cantidadGrupos: v.union(v.literal(1), v.literal(2)),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_persona', ['personaId'])
    .index('by_operador', ['operadorId'])
    .index('by_created_at', ['createdAt']),

  grupos: defineTable({
    personaId: v.id('personas'),
    checkinId: v.id('checkins'),
    nombre: v.optional(v.string()),
    categoria: grupoCategoriaValidator,
    orden: v.union(v.literal(1), v.literal(2)),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_persona', ['personaId'])
    .index('by_checkin', ['checkinId'])
    .index('by_persona_orden', ['personaId', 'orden']),

  integrantes: defineTable({
    grupoId: v.id('grupos'),
    nombre: v.string(),
    orden: v.number(),
    conyugeId: v.optional(v.id('integrantes')),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_grupo', ['grupoId']),

  casosRevision: defineTable({
    textoBusqueda: v.string(),
    operadorId: v.id('users'),
    estado: v.union(v.literal('pendiente'), v.literal('resuelto')),
    createdAt: v.number(),
    updatedAt: v.number(),
    resueltoAt: v.optional(v.number()),
    resueltoPorId: v.optional(v.id('users')),
    notas: v.optional(v.string()),
    personaId: v.optional(v.id('personas')),
  })
    .index('by_estado', ['estado'])
    .index('by_created_at', ['createdAt']),
})
