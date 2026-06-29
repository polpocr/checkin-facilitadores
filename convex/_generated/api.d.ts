/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as applicationUsers from "../applicationUsers.js";
import type * as auth from "../auth.js";
import type * as casosRevision from "../casosRevision.js";
import type * as checkins from "../checkins.js";
import type * as dashboard from "../dashboard.js";
import type * as facilitadores from "../facilitadores.js";
import type * as grupos from "../grupos.js";
import type * as http from "../http.js";
import type * as integrantes from "../integrantes.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as lib_checkinPair from "../lib/checkinPair.js";
import type * as lib_grupoProvisionalName from "../lib/grupoProvisionalName.js";
import type * as personas from "../personas.js";
import type * as seed from "../seed.js";
import type * as seedPersonasData from "../seedPersonasData.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  applicationUsers: typeof applicationUsers;
  auth: typeof auth;
  casosRevision: typeof casosRevision;
  checkins: typeof checkins;
  dashboard: typeof dashboard;
  facilitadores: typeof facilitadores;
  grupos: typeof grupos;
  http: typeof http;
  integrantes: typeof integrantes;
  "lib/authorization": typeof lib_authorization;
  "lib/checkinPair": typeof lib_checkinPair;
  "lib/grupoProvisionalName": typeof lib_grupoProvisionalName;
  personas: typeof personas;
  seed: typeof seed;
  seedPersonasData: typeof seedPersonasData;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
};
