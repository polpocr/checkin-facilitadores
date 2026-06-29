import { v } from 'convex/values'

export const GRUPO_CATEGORIAS = [
  'G.C Bíblico',
  'G.C Interés',
  'G.C Apoyo',
  'G.C Acción Social',
] as const

export type GrupoCategoria = (typeof GRUPO_CATEGORIAS)[number]

export const grupoCategoriaValidator = v.union(
  v.literal('G.C Bíblico'),
  v.literal('G.C Interés'),
  v.literal('G.C Apoyo'),
  v.literal('G.C Acción Social'),
)
