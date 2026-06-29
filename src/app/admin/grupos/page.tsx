'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { displayGrupoNombre } from '@/lib/grupo-provisional-name'
import { ConfirmDeleteDialog } from '@/components/app/confirm-delete-dialog'
import { EditFieldDialog } from '@/components/app/edit-field-dialog'
import { EmptyState } from '@/components/app/empty-state'
import { LoadingState } from '@/components/app/loading-state'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

export default function GruposAdminPage() {
  const [personaFilter, setPersonaFilter] = useState('')
  const [editing, setEditing] = useState<{ id: Id<'grupos'>; nombre: string } | null>(null)
  const [detailId, setDetailId] = useState<Id<'grupos'> | null>(null)
  const personas = useQuery(api.personas.list, {})
  const rows = useQuery(api.grupos.list, {})
  const detail = useQuery(api.grupos.getDetail, detailId ? { id: detailId } : 'skip')
  const remove = useMutation(api.grupos.remove)
  const update = useMutation(api.grupos.update)

  const filtered = rows?.filter((g) => {
    if (!personaFilter) return true
    const p = personas?.find((x) => x._id === g.personaId)
    return p?.nombreCompleto.toLowerCase().includes(personaFilter.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Grupos" description="Grupos propuestos por personas durante el check-in" />

      <Input
        placeholder="Filtrar por persona…"
        value={personaFilter}
        onChange={(e) => setPersonaFilter(e.target.value)}
        className="max-w-sm"
      />

      {filtered === undefined ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin grupos" description="Los grupos aparecerán cuando se registren check-ins." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Nombre provisional</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => {
                const p = personas?.find((x) => x._id === g.personaId)
                return (
                  <TableRow key={g._id}>
                    <TableCell className="font-medium">{p?.nombreCompleto ?? g.personaId}</TableCell>
                    <TableCell>{g.orden}</TableCell>
                    <TableCell className="font-medium">
                      {displayGrupoNombre(g.orden, p?.nombreCompleto ?? '', g.nombre)}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setDetailId(g._id)}>
                        Ver detalle
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing({ id: g._id, nombre: g.nombre ?? '' })}>
                        Editar
                      </Button>
                      <ConfirmDeleteDialog
                        trigger={<Button size="sm" variant="destructive">Eliminar</Button>}
                        title="Eliminar grupo"
                        description={`¿Eliminar ${displayGrupoNombre(g.orden, p?.nombreCompleto ?? '', g.nombre)}? También se eliminarán sus integrantes.`}
                        onConfirm={async () => {
                          try {
                            await remove({ id: g._id })
                            toast.success('Eliminado')
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Error')
                            throw err
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del grupo</DialogTitle>
            <DialogDescription>Información capturada durante el check-in</DialogDescription>
          </DialogHeader>
          {detail === undefined ? (
            <LoadingState />
          ) : detail === null ? (
            <p className="text-sm text-muted-foreground">Grupo no encontrado.</p>
          ) : (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Persona</dt>
                <dd className="font-medium">{detail.persona?.nombreCompleto ?? detail.grupo.personaId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Orden</dt>
                <dd className="tabular-nums">{detail.grupo.orden}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Nombre provisional</dt>
                <dd className="font-medium">
                  {displayGrupoNombre(
                    detail.grupo.orden,
                    detail.persona?.nombreCompleto ?? '',
                    detail.grupo.nombre,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fecha del check-in</dt>
                <dd>
                  {detail.checkin
                    ? format(detail.checkin.createdAt, 'PPp', { locale: es })
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Integrantes ({detail.integrantes.length})</dt>
                <dd>
                  {detail.integrantes.length === 0 ? (
                    <span className="text-muted-foreground">Sin integrantes</span>
                  ) : (
                    <ol className="mt-1 list-decimal space-y-1 pl-5">
                      {detail.integrantes.map((i) => (
                        <li key={i._id}>{i.nombre}</li>
                      ))}
                    </ol>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>

      {editing && (
        <EditFieldDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          title="Editar grupo"
          description="Actualice el nombre provisional del grupo"
          label="Nombre provisional"
          initialValue={editing.nombre}
          required={false}
          onSave={async (nombre) => {
            await update({ id: editing.id, nombre: nombre || undefined })
            toast.success('Actualizado')
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
