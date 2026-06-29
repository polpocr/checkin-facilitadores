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

export default function PersonasAdminPage() {
  const [search, setSearch] = useState('')
  const rows = useQuery(api.personas.list, { search: search || undefined })
  const create = useMutation(api.personas.create)
  const update = useMutation(api.personas.update)
  const remove = useMutation(api.personas.remove)

  const [form, setForm] = useState({
    nombreCompleto: '',
    documento: '',
    contacto: '',
    parejaNombre: '',
    parejaDocumento: '',
    parejaContacto: '',
  })
  const [editingId, setEditingId] = useState<Id<'personas'> | null>(null)

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingId) {
        await update({ id: editingId, ...form })
        toast.success('Persona actualizada')
      } else {
        await create(form)
        toast.success('Persona creada')
      }
      setForm({
        nombreCompleto: '',
        documento: '',
        contacto: '',
        parejaNombre: '',
        parejaDocumento: '',
        parejaContacto: '',
      })
      setEditingId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({
      nombreCompleto: '',
      documento: '',
      contacto: '',
      parejaNombre: '',
      parejaDocumento: '',
      parejaContacto: '',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personas"
        description="Personas registradas que pueden hacer check-in en el evento"
      />

      <Input
        placeholder="Buscar por nombre o documento…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <SectionCard title={editingId ? 'Editar persona' : 'Nueva persona'}>
        <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <Input
              value={form.nombreCompleto}
              onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Documento</Label>
            <Input
              value={form.documento}
              onChange={(e) => setForm({ ...form, documento: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Contacto</Label>
            <Input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Pareja (sugerencia)</Label>
            <Input
              value={form.parejaNombre}
              onChange={(e) => setForm({ ...form, parejaNombre: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Cédula de la pareja</Label>
            <Input
              value={form.parejaDocumento}
              onChange={(e) => setForm({ ...form, parejaDocumento: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Número de la pareja</Label>
            <Input
              value={form.parejaContacto}
              onChange={(e) => setForm({ ...form, parejaContacto: e.target.value })}
            />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">{editingId ? 'Actualizar' : 'Crear'}</Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancelar edición
              </Button>
            )}
          </div>
        </form>
      </SectionCard>

      {rows === undefined ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState title="Sin personas" description="Cree el primer registro con el formulario de arriba." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Pareja</TableHead>
                <TableHead>Cédula pareja</TableHead>
                <TableHead>Número pareja</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-medium">{p.nombreCompleto}</TableCell>
                  <TableCell>{p.documento}</TableCell>
                  <TableCell>{p.contacto ?? '—'}</TableCell>
                  <TableCell>{p.parejaNombre ?? '—'}</TableCell>
                  <TableCell>{p.parejaDocumento ?? '—'}</TableCell>
                  <TableCell>{p.parejaContacto ?? '—'}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(p._id)
                        setForm({
                          nombreCompleto: p.nombreCompleto,
                          documento: p.documento,
                          contacto: p.contacto ?? '',
                          parejaNombre: p.parejaNombre ?? '',
                          parejaDocumento: p.parejaDocumento ?? '',
                          parejaContacto: p.parejaContacto ?? '',
                        })
                      }}
                    >
                      Editar
                    </Button>
                    <ConfirmDeleteDialog
                      trigger={<Button size="sm" variant="destructive">Eliminar</Button>}
                      title="Eliminar persona"
                      description={`¿Eliminar a ${p.nombreCompleto}? Esta acción no se puede deshacer.`}
                      onConfirm={async () => {
                        try {
                          await remove({ id: p._id })
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
