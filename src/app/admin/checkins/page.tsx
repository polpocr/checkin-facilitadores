'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { ConfirmDeleteDialog } from '@/components/app/confirm-delete-dialog'
import { EmptyState } from '@/components/app/empty-state'
import { LoadingState } from '@/components/app/loading-state'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

export default function CheckinsAdminPage() {
  const rows = useQuery(api.checkins.list, {})
  const remove = useMutation(api.checkins.remove)
  const update = useMutation(api.checkins.update)

  return (
    <div className="space-y-6">
      <PageHeader title="Check-ins" description="Registros de check-in realizados en el evento" />

      {rows === undefined ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState title="Sin check-ins" description="Los registros aparecerán cuando el staff capture check-ins." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operador</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Grupos</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <CheckinRow key={c._id} checkin={c} onRemove={remove} onUpdate={update} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function CheckinRow({
  checkin,
  onRemove,
  onUpdate,
}: {
  checkin: {
    _id: Id<'checkins'>
    personaId: Id<'personas'>
    operadorId: Id<'users'>
    cantidadGrupos: 1 | 2
    createdAt: number
  }
  onRemove: (args: { id: Id<'checkins'> }) => Promise<unknown>
  onUpdate: (args: { id: Id<'checkins'>; cantidadGrupos?: 1 | 2 }) => Promise<unknown>
}) {
  const detail = useQuery(api.checkins.getDetail, { id: checkin._id })

  return (
    <TableRow>
      <TableCell className="font-medium">{detail?.persona?.nombreCompleto ?? checkin.personaId}</TableCell>
      <TableCell className="text-muted-foreground">{detail?.operador?.email ?? checkin.operadorId}</TableCell>
      <TableCell className="tabular-nums">{checkin.cantidadGrupos}</TableCell>
      <TableCell>{format(checkin.createdAt, 'PPp', { locale: es })}</TableCell>
      <TableCell className="space-x-2 text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            const next = checkin.cantidadGrupos === 1 ? 2 : 1
            try {
              await onUpdate({ id: checkin._id, cantidadGrupos: next as 1 | 2 })
              toast.success('Actualizado')
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Error')
            }
          }}
        >
          {checkin.cantidadGrupos === 1 ? 'Marcar 2 grupos' : 'Marcar 1 grupo'}
        </Button>
        <ConfirmDeleteDialog
          trigger={<Button size="sm" variant="destructive">Eliminar</Button>}
          title="Eliminar check-in"
          description="¿Eliminar este check-in y sus grupos asociados? Esta acción no se puede deshacer."
          onConfirm={async () => {
            try {
              await onRemove({ id: checkin._id })
              toast.success('Check-in eliminado')
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Error')
              throw err
            }
          }}
        />
      </TableCell>
    </TableRow>
  )
}
