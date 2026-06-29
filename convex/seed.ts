import { components } from './_generated/api'
import { mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import { authComponent, createAuth } from './betterAuth/auth'
import type { Id, TableNames } from './_generated/dataModel'
import { SEED_PERSONAS } from './seedPersonasData'

const ADMIN_EMAIL = 'admin@facilitadores.com'
const ADMIN_PASSWORD = 'qwerty12345'
const OPERADOR_EMAIL = 'operador@facilitadores.com'
const OPERADOR_PASSWORD = 'qwerty12345'

const APP_TABLES = [
  'casosRevision',
  'integrantes',
  'grupos',
  'checkins',
  'personas',
  'facilitadores',
  'users',
] satisfies TableNames[]

const BETTER_AUTH_MODELS = [
  'rateLimit',
  'jwks',
  'oauthConsent',
  'oauthAccessToken',
  'oauthApplication',
  'twoFactor',
  'verification',
  'session',
  'account',
  'user',
] as const

const BATCH_SIZE = 100

async function deleteAllFromAppTable(ctx: MutationCtx, table: TableNames) {
  let deleted = 0
  for (;;) {
    const rows = await ctx.db.query(table).take(BATCH_SIZE)
    if (rows.length === 0) break
    for (const row of rows) await ctx.db.delete(row._id)
    deleted += rows.length
  }
  return deleted
}

export const resetAndCreateAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const deletedAppRows: Record<string, number> = {}
    for (const table of APP_TABLES) {
      deletedAppRows[table] = await deleteAllFromAppTable(ctx, table)
    }

    const deletedBetterAuthRows: Record<string, number> = {}
    for (const model of BETTER_AUTH_MODELS) {
      let deleted = 0
      for (;;) {
        const result = await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
          input: { model },
          paginationOpts: { numItems: BATCH_SIZE, cursor: null },
        })
        deleted += result.count
        if (result.isDone || result.count === 0) break
      }
      deletedBetterAuthRows[model] = deleted
    }

    const { auth } = await authComponent.getAuth(createAuth, ctx)
    const createdAdmin = await auth.api.createUser({
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'Admin', role: 'user' },
    })
    const createdOperador = await auth.api.createUser({
      body: {
        email: OPERADOR_EMAIL,
        password: OPERADOR_PASSWORD,
        name: 'Operador',
        role: 'user',
      },
    })

    const now = Date.now()
    const adminId = await ctx.db.insert('users', {
      betterAuthUserId: (createdAdmin.user as { id: string }).id,
      email: ADMIN_EMAIL,
      fullName: 'Admin',
      role: 'admin',
      active: true,
      createdAt: now,
      updatedAt: now,
    })
    const operadorId = await ctx.db.insert('users', {
      betterAuthUserId: (createdOperador.user as { id: string }).id,
      email: OPERADOR_EMAIL,
      fullName: 'Operador',
      role: 'operador',
      active: true,
      createdAt: now,
      updatedAt: now,
    })

    const idsByPairSide = new Map<string, Id<'personas'>>()
    for (const p of SEED_PERSONAS) {
      const id = await ctx.db.insert('personas', {
        nombreCompleto: p.nombreCompleto,
        documento: p.documento,
        contacto: p.contacto,
        parejaNombre: p.parejaNombre,
        createdAt: now,
        updatedAt: now,
      })
      idsByPairSide.set(`${p.pairKey}:${p.side}`, id)
    }

    let parejasVinculadas = 0
    for (const p of SEED_PERSONAS) {
      const selfId = idsByPairSide.get(`${p.pairKey}:${p.side}`)
      if (!selfId) continue
      const otherSide = p.side === 'hombre' ? 'mujer' : 'hombre'
      const otherId = idsByPairSide.get(`${p.pairKey}:${otherSide}`)
      if (!otherId) continue
      await ctx.db.patch(selfId, { parejaPersonaId: otherId, updatedAt: now })
      parejasVinculadas++
    }

    return {
      ok: true as const,
      admin: { email: ADMIN_EMAIL, applicationUserId: adminId },
      operador: { email: OPERADOR_EMAIL, applicationUserId: operadorId },
      personasCreadas: SEED_PERSONAS.length,
      parejasVinculadas,
      deletedAppRows,
      deletedBetterAuthRows,
    }
  },
})
