import { query } from './_generated/server'
import { authComponent } from './betterAuth/auth'

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => ctx.auth.getUserIdentity(),
})

export const { getAuthUser } = authComponent.clientApi()
