'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { ConfirmDeleteDialog } from '@/components/app/confirm-delete-dialog'
import { EmptyState } from '@/components/app/empty-state'
import { LoadingState } from '@/components/app/loading-state'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

type FilterTab = 'todos' | 'pendiente' | 'resuelto'

function CasosRevisionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const estadoParam = searchParams.get('estado')
  const activeTab: FilterTab =
    estadoParam === 'pendiente' || estadoParam === 'resuelto' ? estadoParam : 'todos'

  const estado = activeTab === 'todos' ? undefined : activeTab
  const rows = useQuery(api.casosRevision.list, { estado })
  const personas = useQuery(api.personas.list, {})
  const resolve = useMutation(api.casosRevision.resolve)
  const remove = useMutation(api.casosRevision.remove)

  const [resolvingId, setResolvingId] = useState<Id<'casosRevision'> | null>(null)
  const [linkSearch, setLinkSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const resolvingCase = rows?.find((c) => c._id === resolvingId)

  const linkMatches = useMemo(() => {
    if (!personas || !linkSearch.trim()) return []
    const q = linkSearch.trim().toLowerCase()
    return personas
      .filter(
        (p) =>
          p.nombreCompleto.toLowerCase().includes(q) ||
          p.documento.toLowerCase().includes(q) ||
          p._id === linkSearch.trim(),
      )
      .slice(0, 8)
  }, [personas, linkSearch])

  function setTab(tab: FilterTab) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'todos') params.delete('estado')
    else params.set('estado', tab)
    router.replace(`/admin/casos-revision${params.toString() ? `?${params}` : ''}`)
  }

  async function handleResolve(personaId?: Id<'personas'>) {
    if (!resolvingId) return
    setSaving(true)
    try {
      await resolve({
        id: resolvingId,
        personaId,
        notas: personaId ? 'Vinculado desde panel admin' : 'Resuelto sin vincular',
      })
      toast.success('Caso resuelto')
      setResolvingId(null)
      setLinkSearch('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Casos de revisión manual"
        description="Búsquedas sin coincidencia marcadas por el staff de check-in"
      />

      <Tabs value={activeTab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
          <TabsTrigger value="resuelto">Resueltos</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          {rows === undefined ? (
            <LoadingState />
          ) : rows.length === 0 ? (
            <EmptyState
              title="Sin casos"
              description={
                activeTab === 'pendiente'
                  ? 'No hay casos pendientes de revisión.'
                  : 'No hay casos en este filtro.'
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Búsqueda</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">{c.textoBusqueda}</TableCell>
                      <TableCell>
                        <Badge variant={c.estado === 'pendiente' ? 'destructive' : 'secondary'}>
                          {c.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(c.createdAt, 'PPp', { locale: es })}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        {c.estado === 'pendiente' && (
                          <Button size="sm" onClick={() => { setResolvingId(c._id); setLinkSearch('') }}>
                            Resolver
                          </Button>
                        )}
                        <ConfirmDeleteDialog
                          trigger={<Button size="sm" variant="destructive">Eliminar</Button>}
                          title="Eliminar caso"
                          description={`¿Eliminar el caso "${c.textoBusqueda}"? Esta acción no se puede deshacer.`}
                          onConfirm={async () => {
                            try {
                              await remove({ id: c._id })
                              toast.success('Eliminado')
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Error')
                              throw err
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!resolvingId} onOpenChange={(open) => !open && setResolvingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolver caso</DialogTitle>
            <DialogDescription>
              {resolvingCase
                ? `Búsqueda: "${resolvingCase.textoBusqueda}". Opcionalmente vincule a una persona registrada.`
                : 'Vincule o marque como resuelto.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="link-search">Buscar persona para vincular</Label>
              <Input
                id="link-search"
                placeholder="Nombre o documento…"
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
              />
            </div>
            {linkMatches.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-auto rounded-lg border p-2">
                {linkMatches.map((p) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => void handleResolve(p._id)}
                      disabled={saving}
                    >
                      <span className="font-medium">{p.nombreCompleto}</span>
                      <span className="text-muted-foreground"> · {p.documento}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolvingId(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => void handleResolve()} disabled={saving}>
              Resolver sin vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CasosRevisionAdminPage() {
  return (
    <Suspense fallback={<LoadingState className="p-6" />}>
      <CasosRevisionContent />
    </Suspense>
  )
}
