'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { ConfirmDeleteDialog } from '@/components/app/confirm-delete-dialog'
import { EmptyState } from '@/components/app/empty-state'
import { LoadingState } from '@/components/app/loading-state'
import { PageHeader } from '@/components/app/page-header'
import { SectionCard } from '@/components/app/section-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

export default function FacilitadoresAdminPage() {
  const [search, setSearch] = useState('')
  const rows = useQuery(api.facilitadores.list, { search: search || undefined })
  const create = useMutation(api.facilitadores.create)
  const update = useMutation(api.facilitadores.update)
  const remove = useMutation(api.facilitadores.remove)

  const [form, setForm] = useState({
    nombreCompleto: '',
    documento: '',
    contacto: '',
    esposoNombre: '',
  })
  const [editingId, setEditingId] = useState<Id<'facilitadores'> | null>(null)

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingId) {
        await update({ id: editingId, ...form })
        toast.success('Operador actualizado')
      } else {
        await create(form)
        toast.success('Operador creado')
      }
      setForm({ nombreCompleto: '', documento: '', contacto: '', esposoNombre: '' })
      setEditingId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operadores (registro alternativo)"
        description="Tabla auxiliar de registro — el check-in usa la lista principal de Operadores"
      />

      <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <SectionCard title={editingId ? 'Editar operador' : 'Nuevo operador'}>
        <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <Input value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Documento</Label>
            <Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Contacto</Label>
            <Input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Esposo/a (sugerencia)</Label>
            <Input value={form.esposoNombre} onChange={(e) => setForm({ ...form, esposoNombre: e.target.value })} />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">{editingId ? 'Actualizar' : 'Crear'}</Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm({ nombreCompleto: '', documento: '', contacto: '', esposoNombre: '' }) }}>
                Cancelar edición
              </Button>
            )}
          </div>
        </form>
      </SectionCard>

      {rows === undefined ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState title="Sin registros" description="No hay operadores en esta tabla auxiliar." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Esposo/a</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((f) => (
                <TableRow key={f._id}>
                  <TableCell className="font-medium">{f.nombreCompleto}</TableCell>
                  <TableCell>{f.documento}</TableCell>
                  <TableCell>{f.esposoNombre ?? '—'}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(f._id); setForm({ nombreCompleto: f.nombreCompleto, documento: f.documento, contacto: f.contacto ?? '', esposoNombre: f.esposoNombre ?? '' }) }}>Editar</Button>
                    <ConfirmDeleteDialog
                      trigger={<Button size="sm" variant="destructive">Eliminar</Button>}
                      title="Eliminar operador"
                      description={`¿Eliminar a ${f.nombreCompleto}? Esta acción no se puede deshacer.`}
                      onConfirm={async () => {
                        try {
                          await remove({ id: f._id })
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
    </div>
  )
}
