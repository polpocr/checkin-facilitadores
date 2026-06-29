# CheckIn Operadores — Design System

## Direction & Feel

**Product:** Mesa de registro en evento — staff atiende operadores registrados, captura grupos, admin monitorea en tiempo real.

**Feel:** Operativa cálida. Papel crema, tinta azul, sellos de estado. Clara bajo presión, no SaaS genérico.

**Signature:** Ficha de check-in persistente — operador seleccionado, pasos visibles, expediente compacto (no formulario plano).

**Language:**
- Participante registrado → **Operador** (UI; tabla `personas`)
- Usuario de mesa con login → **Staff check-in** (rol técnico `operador`)
- Marca → **CheckIn Operadores**

## Depth Strategy

**Borders + subtle surface shifts.** No heavy shadows.

- Page canvas: `bg-muted/25`
- Cards: shadcn `Card` con `ring-1 ring-foreground/10`, `rounded-xl`
- Nested panels: `rounded-xl border bg-muted/10` o `bg-muted/20`
- Tables: `overflow-x-auto rounded-xl border` wrapper
- Inputs: token `--input` (ligeramente más oscuro que fondo)
- Sticky headers: `bg-background/95 backdrop-blur-sm border-b`

## Spacing

- Base unit: **4px** (Tailwind default)
- Page rhythm: `space-y-6` (admin), `space-y-6`–`space-y-8` (dashboard)
- Form fields: `space-y-2` dentro de field, `gap-4` en grids
- Container: `max-w-6xl` admin, `max-w-4xl` check-in, `px-4 py-6` main
- Section gaps: `gap-4` grids, `gap-8` entre bloques mayores

## Typography

- **Sans:** DM Sans (`--font-sans` via `next/font`)
- **Mono:** JetBrains Mono (`--font-geist-mono`) — IDs, métricas tabulares
- **Heading = sans** (`font-heading` === `font-sans`)

| Role | Classes |
|------|---------|
| Page title | `text-2xl font-semibold tracking-tight` |
| Section label | `text-xs font-medium uppercase tracking-wider text-muted-foreground` |
| Card title | shadcn `CardTitle` — `text-base font-medium` |
| Body | `text-sm` (default shadcn) |
| Hero metric | `text-3xl font-semibold tabular-nums tracking-tight` |
| Muted meta | `text-sm text-muted-foreground` |

Type scale ratio ~1.25 from 14px body. Hierarchy via **weight + color + size**, not size alone.

## Color Palette (oklch tokens in `globals.css`)

| Token | Role |
|-------|------|
| `--background` | Papel crema |
| `--foreground` | Tinta azul oscura |
| `--primary` | Azul tinta — acciones principales |
| `--muted` / `--muted-foreground` | Estructura y metadata |
| `--accent` | Manila suave — highlights secundarios |
| `--destructive` | Error / pendiente crítico |
| `--success` | Confirmado / check-in OK |
| `--warning` | Pendiente / atención |
| `--border` | Bordes cálidos baja opacidad |

**Rule:** 60/30/10 — neutros dominan, color comunica estado. No hex sueltos en componentes; usar tokens semánticos.

## Component Patterns

### Shell (admin + check-in)
- `min-h-screen bg-muted/25`
- Header sticky con marca, usuario, `SignOutButton`
- Admin: `AdminNav` con `Button variant="ghost|secondary"` + `Link`

### PageHeader
`src/components/app/page-header.tsx`
- Title + optional description + optional actions slot
- Usar en toda página admin

### SectionCard
`src/components/app/section-card.tsx`
- Wrapper `Card` + header opcional para formularios y bloques

### EmptyState / LoadingState
- Empty: `rounded-xl border border-dashed bg-muted/30 py-12`
- Loading: spinner `border-t-primary` + label

### EditFieldDialog
`src/components/app/edit-field-dialog.tsx`
- Reemplazo de `prompt()` — edición inline con validación

### StepIndicator (check-in)
`src/components/app/step-indicator.tsx`
- 4 pasos: Buscar → Confirmar → Grupos → Listo
- Círculos `size-7`, activo con `ring-2 ring-primary/25`

### KPI cards (dashboard)
- Icon en `size-9 rounded-lg bg-primary/10`
- Label uppercase `text-xs tracking-wide text-muted-foreground`
- Value `text-3xl tabular-nums`
- Warning highlight: `border-warning/40 bg-warning/5`

### Selectable search result (check-in)
```
rounded-xl border bg-background p-4
hover:border-primary/40 hover:bg-muted/40
focus-visible:ring-2 focus-visible:ring-ring
```

### Ficha activa (check-in)
```
rounded-xl border bg-card px-4 py-3 ring-1 ring-foreground/5
```

## Buttons

Usar shadcn `Button` — no raw `<div onClick>`.

| Context | Variant |
|---------|---------|
| Primary action | `default` |
| Secondary / cancel | `outline` |
| Tertiary | `ghost` |
| Destructive | `destructive` |
| Nav active | `secondary` |
| Nav inactive | `ghost` size `sm` |

## Forms

- Grid: `grid gap-4 md:grid-cols-2`
- Labels siempre con `Label` + `htmlFor`
- Field stack: `space-y-2`
- Submit row: `flex gap-2 md:col-span-2`

## Tables

- Siempre dentro de `overflow-x-auto rounded-xl border`
- Acciones: `text-right`, `space-x-2`
- Nombre principal: `font-medium` en primera columna de entidad
- Loading → `LoadingState`; vacío → `EmptyState`

## Motion

- Transiciones en cards/links: `transition-colors` o `transition-all`
- Dialog: shadcn defaults (`duration-100`, zoom/fade)
- Respetar `prefers-reduced-motion` vía shadcn/tw-animate

## Dark Mode

Tokens definidos en `.dark` pero **no es feature activa** — light mode es el target. No agregar toggle sin `ThemeProvider`.

## File Map

| Concern | File |
|---------|------|
| Tokens | `src/app/globals.css` |
| Fonts | `src/app/layout.tsx` |
| Admin shell | `src/app/admin/layout.tsx` |
| Check-in shell | `src/app/checkin/layout.tsx` |
| Shared app components | `src/components/app/*` |
| shadcn primitives | `src/components/ui/*` |

## Consistency Checks

Before shipping UI changes:
1. ¿Usa tokens, no `gray-500` / hex?
2. ¿`PageHeader` + estados loading/empty en listados?
3. ¿Jerarquía clara — un focal point por vista?
4. ¿Lenguaje: Operador = participante, Staff = usuario de mesa?
5. ¿Sin `prompt()` / `alert()` nativos?
