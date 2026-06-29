import { mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { isAPIError } from 'better-auth/api'
import { authComponent, createAuth } from './betterAuth/auth'
import type { Doc } from './_generated/dataModel'
import { requireAdmin } from './lib/authorization'

export type ApplicationUser = Doc<'users'>

export const getMyApplicationUser = query({
  args: {},
  handler: async (ctx): Promise<ApplicationUser | null> => {
    const baUser = await authComponent.safeGetAuthUser(ctx)
    if (!baUser) return null

    const betterAuthUserId = String(
      (baUser as { _id?: string })._id ?? (baUser as { id?: string }).id ?? '',
    )
    if (!betterAuthUserId) return null

    return ctx.db
      .query('users')
      .withIndex('by_better_auth_user_id', (q) =>
        q.eq('betterAuthUserId', betterAuthUserId),
      )
      .first()
  },
})

export const listStaff = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return ctx.db.query('users').collect()
  },
})

export const createStaffUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    fullName: v.optional(v.string()),
    role: v.union(v.literal('admin'), v.literal('operador')),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const email = args.email.trim().toLowerCase()
    if (args.password.length < 8) {
      throw new ConvexError('La contraseña debe tener al menos 8 caracteres')
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first()
    if (existing) throw new ConvexError('Ya existe un usuario con ese email')

    const { auth } = await authComponent.getAuth(createAuth, ctx)
    let created
    try {
      created = await auth.api.createUser({
        body: {
          email,
          password: args.password,
          name: args.fullName?.trim() || email,
          role: 'user',
        },
      })
    } catch (err) {
      if (isAPIError(err) && err.message.toLowerCase().includes('already exists')) {
        throw new ConvexError('Ya existe un usuario con ese email')
      }
      throw new ConvexError(
        isAPIError(err) ? err.message : 'No se pudo crear el usuario',
      )
    }

    const betterAuthUserId = (created.user as { id: string }).id
    const now = Date.now()

    return await ctx.db.insert('users', {
      betterAuthUserId,
      email,
      fullName: args.fullName?.trim() || undefined,
      role: args.role,
      active: true,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateStaffUser = mutation({
  args: {
    id: v.id('users'),
    fullName: v.optional(v.string()),
    role: v.optional(v.union(v.literal('admin'), v.literal('operador'))),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const user = await ctx.db.get(args.id)
    if (!user) throw new ConvexError('Usuario no encontrado')

    if (user.role === 'admin') {
      if (args.active === false) {
        throw new ConvexError('No se puede desactivar un usuario administrador')
      }
      if (args.role !== undefined && args.role !== 'admin') {
        throw new ConvexError('No se puede cambiar el rol de un usuario administrador')
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.fullName !== undefined ? { fullName: args.fullName.trim() || undefined } : {}),
      ...(args.role !== undefined ? { role: args.role } : {}),
      ...(args.active !== undefined ? { active: args.active } : {}),
      updatedAt: Date.now(),
    })
    return args.id
  },
})

export const removeStaffUser = mutation({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const user = await ctx.db.get(args.id)
    if (!user) throw new ConvexError('Usuario no encontrado')
    if (user.role === 'admin') {
      throw new ConvexError('No se puede eliminar un usuario administrador')
    }
    await ctx.db.delete(args.id)
    return { ok: true as const }
  },
})
