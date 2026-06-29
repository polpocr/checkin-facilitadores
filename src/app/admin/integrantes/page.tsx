'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { EditFieldDialog } from '@/components/app/edit-field-dialog'
import { EmptyState } from '@/components/app/empty-state'
import { LoadingState } from '@/components/app/loading-state'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

export default function IntegrantesAdminPage() {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<{ id: Id<'integrantes'>; nombre: string } | null>(null)
  const rows = useQuery(api.integrantes.list, { search: search || undefined })
  const grupos = useQuery(api.grupos.list, {})
  const update = useMutation(api.integrantes.update)
  const remove = useMutation(api.integrantes.remove)

  return (
    <div className="space-y-6">
      <PageHeader title="Integrantes" description="Personas incluidas en cada grupo de conexión" />

      <Input
        placeholder="Buscar por nombre…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {rows === undefined ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState title="Sin integrantes" description="Los integrantes se capturan durante el check-in." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((i) => {
                const grupo = grupos?.find((g) => g._id === i.grupoId)
                return (
                  <TableRow key={i._id}>
                    <TableCell className="font-medium">{i.nombre}</TableCell>
                    <TableCell>
                      {grupo ? `Grupo ${grupo.orden}${grupo.nombre ? `: ${grupo.nombre}` : ''}` : i.grupoId}
                    </TableCell>
                    <TableCell>{i.orden}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing({ id: i._id, nombre: i.nombre })}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          try {
                            await remove({ id: i._id })
                            toast.success('Eliminado')
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Error')
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <EditFieldDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          title="Editar integrante"
          label="Nombre"
          initialValue={editing.nombre}
          onSave={async (nombre) => {
            await update({ id: editing.id, nombre })
            toast.success('Actualizado')
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
