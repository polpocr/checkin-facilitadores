export const GRUPO_CATEGORIAS = [
  'G.C Bíblico',
  'G.C Interés',
  'G.C Apoyo',
  'G.C Acción Social',
] as const

export type GrupoCategoria = (typeof GRUPO_CATEGORIAS)[number]
