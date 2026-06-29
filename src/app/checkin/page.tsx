'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Doc } from '@convex/_generated/dataModel'
import { buildSpouseSuggestion, canAddSecondGroup, validateCheckinPayload } from '@/lib/checkin-rules'
import { EmptyState } from '@/components/app/empty-state'
import { IntegranteSearchInput } from '@/components/app/integrante-search-input'
import { LoadingState } from '@/components/app/loading-state'
import { SectionCard } from '@/components/app/section-card'
import { StepIndicator, type CheckinStepId } from '@/components/app/step-indicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CheckCircle2, Search, UserCheck, Users } from 'lucide-react'

type Step = CheckinStepId

type GrupoDraft = {
  nombre: string
  integrantes: string[]
}

export default function CheckinPage() {
  const [step, setStep] = useState<Step>('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [selected, setSelected] = useState<Doc<'personas'> | null>(null)
  const [cantidadGrupos, setCantidadGrupos] = useState<1 | 2>(1)
  const [grupos, setGrupos] = useState<GrupoDraft[]>([{ nombre: '', integrantes: [''] }])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const results = useQuery(
    api.personas.search,
    debouncedTerm.length >= 2 ? { term: debouncedTerm } : 'skip',
  )

  const status = useQuery(
    api.personas.getCheckinStatus,
    selected ? { personaId: selected._id } : 'skip',
  )

  const createCheckin = useMutation(api.checkins.createWithGrupos)
  const addMissingGrupo = useMutation(api.checkins.addMissingGrupo)
  const createManualCase = useMutation(api.casosRevision.create)

  const spouseSuggestion = useMemo(
    () => buildSpouseSuggestion(selected?.parejaNombre),
    [selected],
  )

  function resetFlow() {
    setStep('search')
    setSearchTerm('')
    setDebouncedTerm('')
    setSelected(null)
    setCantidadGrupos(1)
    setGrupos([{ nombre: '', integrantes: [''] }])
    setSaveError(null)
  }

  function selectPersona(p: Doc<'personas'>) {
    setSelected(p)
    setStep('confirm')
    setSaveError(null)
  }

  function startGroupsFlow() {
    if (!selected) return
    const suggestion = buildSpouseSuggestion(selected.parejaNombre)
    setCantidadGrupos(1)
    setGrupos([{ nombre: '', integrantes: suggestion.length ? [...suggestion, ''] : [''] }])
    setStep('groups')
  }

  function startAddMissingGroup() {
    if (!selected) return
    const suggestion = buildSpouseSuggestion(selected.parejaNombre)
    setGrupos([{ nombre: '', integrantes: suggestion.length ? [...suggestion, ''] : [''] }])
    setStep('groups')
  }

  function setGrupoCount(count: 1 | 2) {
    setCantidadGrupos(count)
    setGrupos((prev) => {
      if (count === 1) return [prev[0] ?? { nombre: '', integrantes: [''] }]
      const second = prev[1] ?? {
        nombre: '',
        integrantes: spouseSuggestion.length ? [...spouseSuggestion, ''] : [''],
      }
      return [prev[0] ?? { nombre: '', integrantes: [''] }, second]
    })
  }

  async function submitCheckin(isAddMissing = false) {
    if (!selected) return
    setSaving(true)
    setSaveError(null)
    try {
      const payload = grupos.map((g) => ({
        nombre: g.nombre || undefined,
        integrantes: g.integrantes,
      }))

      if (isAddMissing) {
        validateCheckinPayload(1, payload)
        await addMissingGrupo({
          personaId: selected._id,
          grupo: payload[0],
        })
      } else {
        validateCheckinPayload(cantidadGrupos, payload)
        await createCheckin({
          personaId: selected._id,
          cantidadGrupos,
          grupos: payload,
        })
      }

      toast.success('Check-in guardado correctamente')
      setStep('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      setSaveError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function markManualReview() {
    if (searchTerm.trim().length < 2) {
      toast.error('Ingrese un término de búsqueda')
      return
    }
    try {
      await createManualCase({ textoBusqueda: searchTerm.trim() })
      toast.success('Caso marcado para revisión manual')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear el caso')
    }
  }

  const canAddGroup =
    status?.hasCheckin &&
    status.checkin &&
    canAddSecondGroup(status.grupos.length, status.checkin.cantidadGrupos)

  return (
    <div className="space-y-6">
      <StepIndicator current={step} />

      {selected && step !== 'search' && (
        <div className="rounded-xl border bg-card px-4 py-3 ring-1 ring-foreground/5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ficha activa</p>
          <p className="mt-0.5 text-lg font-semibold">{selected.nombreCompleto}</p>
          <p className="text-sm text-muted-foreground">Doc. {selected.documento}</p>
          {selected.parejaNombre && (
            <p className="text-sm text-muted-foreground">Cónyuge: {selected.parejaNombre}</p>
          )}
        </div>
      )}

      {step !== 'search' && step !== 'done' && (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={resetFlow}>
            Nuevo check-in
          </Button>
        </div>
      )}

      {step === 'search' && (
        <SectionCard
          title="Buscar persona"
          description="Por nombre, apellido o documento — mínimo 2 caracteres"
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Ej: María González o 1-2345-6789"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            {debouncedTerm.length >= 2 && results === undefined && <LoadingState label="Buscando…" />}

            {debouncedTerm.length >= 2 && results?.length === 0 && (
              <Alert>
                <AlertDescription className="space-y-3">
                  <p>No se encontraron coincidencias para &ldquo;{debouncedTerm}&rdquo;.</p>
                  <Button variant="secondary" onClick={() => void markManualReview()}>
                    Marcar para revisión manual
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {debouncedTerm.length < 2 && debouncedTerm.length > 0 && (
              <p className="text-sm text-muted-foreground">Escriba al menos 2 caracteres para buscar.</p>
            )}

            <div className="space-y-2">
              {results?.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => selectPersona(p)}
                  className="flex w-full items-start justify-between gap-3 rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{p.nombreCompleto}</p>
                    <p className="text-sm text-muted-foreground">Doc: {p.documento}</p>
                    {p.parejaNombre && (
                      <p className="text-sm text-muted-foreground">Pareja: {p.parejaNombre}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    Seleccionar
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {step === 'confirm' && selected && (
        <SectionCard
          title="Confirmar identidad"
          description="Verifique que seleccionó a la persona correcta antes de continuar"
        >
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{selected.nombreCompleto}</p>
                  <p className="text-muted-foreground">Documento: {selected.documento}</p>
                  {selected.contacto && (
                    <p className="text-muted-foreground">Contacto: {selected.contacto}</p>
                  )}
                  {selected.parejaNombre && (
                    <p className="text-muted-foreground">Pareja: {selected.parejaNombre}</p>
                  )}
                </div>
              </div>
            </div>

            {status === undefined && <LoadingState label="Consultando estado del check-in…" />}

            {status?.hasCheckin && (
              <Alert>
                <AlertDescription>
                  {status.viaPareja && status.viaPersonaNombre
                    ? `Esta pareja ya tiene check-in registrado por ${status.viaPersonaNombre}.`
                    : 'Esta persona ya tiene check-in registrado. No se puede duplicar.'}
                </AlertDescription>
              </Alert>
            )}

            {status?.hasCheckin && status.grupos.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Grupos existentes</p>
                {status.grupos.map((g) => (
                  <div key={g._id} className="rounded-lg border bg-background p-3">
                    <p className="font-medium">
                      Grupo {g.orden}
                      {g.nombre ? `: ${g.nombre}` : ''}
                    </p>
                    <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                      {(status.integrantesByGrupo[g._id] ?? []).map((i) => (
                        <li key={i._id}>{i.nombre}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('search')}>
                Volver a buscar
              </Button>
              {!status?.hasCheckin && (
                <Button onClick={startGroupsFlow}>Confirmar y continuar</Button>
              )}
              {canAddGroup && (
                <Button onClick={startAddMissingGroup}>Agregar grupo faltante</Button>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {step === 'groups' && selected && (
        <SectionCard
          title="Capturar grupos"
          description={
            status?.hasCheckin
              ? 'Agregue el grupo faltante con sus integrantes'
              : 'Seleccione 1 o 2 grupos — los integrantes son obligatorios'
          }
        >
          <div className="space-y-6">
            {!status?.hasCheckin && (
              <div className="flex gap-2">
                <Button
                  variant={cantidadGrupos === 1 ? 'default' : 'outline'}
                  onClick={() => setGrupoCount(1)}
                  className="flex-1 sm:flex-none"
                >
                  <Users className="size-4" />
                  1 grupo
                </Button>
                <Button
                  variant={cantidadGrupos === 2 ? 'default' : 'outline'}
                  onClick={() => setGrupoCount(2)}
                  className="flex-1 sm:flex-none"
                >
                  <Users className="size-4" />
                  2 grupos
                </Button>
              </div>
            )}

            {(status?.hasCheckin ? grupos.slice(0, 1) : grupos).map((grupo, gi) => (
              <div key={gi} className="space-y-4 rounded-xl border bg-muted/10 p-4">
                <p className="font-medium">Grupo {gi + 1}</p>
                <div className="space-y-2">
                  <Label>Nombre del grupo (opcional)</Label>
                  <Input
                    value={grupo.nombre}
                    onChange={(e) => {
                      const copy = [...grupos]
                      copy[gi] = { ...copy[gi], nombre: e.target.value }
                      setGrupos(copy)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Integrantes (obligatorio)</Label>
                  {spouseSuggestion[0] && gi === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Sugerencia de pareja: <span className="font-medium text-foreground">{spouseSuggestion[0]}</span>
                    </p>
                  )}
                  {grupo.integrantes.map((nombre, ii) => (
                    <div key={ii} className="flex gap-2">
                      <IntegranteSearchInput
                        placeholder={
                          ii === 0 && spouseSuggestion[0]
                            ? spouseSuggestion[0]
                            : 'Buscar por nombre o documento'
                        }
                        value={nombre}
                        onChange={(next) => {
                          const copy = [...grupos]
                          const ints = [...copy[gi].integrantes]
                          ints[ii] = next
                          copy[gi] = { ...copy[gi], integrantes: ints }
                          setGrupos(copy)
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const copy = [...grupos]
                          copy[gi].integrantes = copy[gi].integrantes.filter((_, idx) => idx !== ii)
                          if (copy[gi].integrantes.length === 0) copy[gi].integrantes = ['']
                          setGrupos(copy)
                        }}
                      >
                        Quitar
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const copy = [...grupos]
                      copy[gi].integrantes.push('')
                      setGrupos(copy)
                    }}
                  >
                    Agregar integrante
                  </Button>
                </div>
              </div>
            ))}

            {saveError && (
              <Alert variant="destructive">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStep('confirm')}>
                Volver
              </Button>
              <Button disabled={saving} onClick={() => void submitCheckin(!!status?.hasCheckin)}>
                {saving ? 'Guardando…' : 'Confirmar y guardar'}
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {step === 'done' && (
        <EmptyState
          title="Check-in completado"
          description="El registro se guardó correctamente. Puede atender a la siguiente persona."
          action={
            <Button onClick={resetFlow} className="gap-2">
              <CheckCircle2 className="size-4" />
              Registrar otra persona
            </Button>
          }
        />
      )}
    </div>
  )
}
