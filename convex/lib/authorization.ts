import { ConvexError } from 'convex/values'
import type { QueryCtx, MutationCtx } from '../_generated/server'
import { authComponent } from '../betterAuth/auth'
import type { Doc } from '../_generated/dataModel'

export type Ctx = QueryCtx | MutationCtx

async function resolveUser(ctx: Ctx): Promise<Doc<'users'> | null> {
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
}

export async function getOptionalAuthenticatedUser(
  ctx: Ctx,
): Promise<Doc<'users'> | null> {
  return resolveUser(ctx)
}

export async function getAuthenticatedUser(ctx: Ctx): Promise<Doc<'users'>> {
  const user = await resolveUser(ctx)
  if (!user) throw new ConvexError('Not authenticated')
  return user
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<'users'>> {
  const user = await getAuthenticatedUser(ctx)
  if (user.role !== 'admin') throw new ConvexError('Forbidden: admin required')
  if (!user.active) throw new ConvexError('Forbidden: account inactive')
  return user
}

export async function requireOperador(ctx: Ctx): Promise<Doc<'users'>> {
  const user = await getAuthenticatedUser(ctx)
  if (user.role !== 'operador') throw new ConvexError('Forbidden: operador required')
  if (!user.active) throw new ConvexError('Forbidden: account inactive')
  return user
}

export async function requireStaff(ctx: Ctx): Promise<Doc<'users'>> {
  const user = await getAuthenticatedUser(ctx)
  if (user.role !== 'admin' && user.role !== 'operador') {
    throw new ConvexError('Forbidden: staff required')
  }
  if (!user.active) throw new ConvexError('Forbidden: account inactive')
  return user
}
