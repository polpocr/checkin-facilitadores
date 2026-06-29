import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import type { GenericCtx } from '@convex-dev/better-auth/utils'
import type { BetterAuthOptions } from 'better-auth'
import { admin } from 'better-auth/plugins/admin'
import { betterAuth } from 'better-auth'
import { components } from '../_generated/api'
import type { DataModel } from '../_generated/dataModel'
import authConfig from '../auth.config'
import schema from './schema'

export const authComponent = createClient<DataModel, typeof schema>(
  components.betterAuth,
  {
    local: { schema },
    verbose: false,
  },
)

const localSiteUrls = ['http://localhost:3000', 'http://127.0.0.1:3000']

const siteUrl =
  process.env.SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL

function getOriginVariants(rawUrl: string | undefined) {
  if (!rawUrl) return []

  try {
    const url = new URL(rawUrl)
    const origins = new Set([url.origin])

    if (url.hostname.startsWith('www.')) {
      origins.add(
        new URL(`${url.protocol}//${url.hostname.slice(4)}${url.port ? `:${url.port}` : ''}`).origin,
      )
    } else if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
      origins.add(
        new URL(`${url.protocol}//www.${url.hostname}${url.port ? `:${url.port}` : ''}`).origin,
      )
    }

    return Array.from(origins)
  } catch {
    return []
  }
}

const trustedOrigins = Array.from(
  new Set([
    ...getOriginVariants(siteUrl),
    ...getOriginVariants(process.env.NEXT_PUBLIC_SITE_URL),
    ...localSiteUrls,
  ]),
)

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: 'CheckIn Facilitadores',
    baseURL: siteUrl,
    trustedOrigins,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    plugins: [convex({ authConfig }), admin({ defaultRole: 'user' })],
  } satisfies BetterAuthOptions
}

export const options = createAuthOptions({} as GenericCtx<DataModel>)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx))
}
