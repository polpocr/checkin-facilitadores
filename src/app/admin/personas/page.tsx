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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

type SiNoValue = 'si' | 'no' | ''

type PersonaForm = {
  nombreCompleto: string
  documento: string
  contacto: string
  coordinadorFacilitador: boolean
  falta: SiNoValue
  carreraCrecimiento: SiNoValue
  llevoGrupoConexion: SiNoValue
  parejaNombre: string
  parejaDocumento: string
  parejaContacto: string
  parejaFalta: SiNoValue
}

const emptyForm = (): PersonaForm => ({
  nombreCompleto: '',
  documento: '',
  contacto: '',
  coordinadorFacilitador: false,
  falta: '',
  carreraCrecimiento: '',
  llevoGrupoConexion: '',
  parejaNombre: '',
  parejaDocumento: '',
  parejaContacto: '',
  parejaFalta: '',
})

function siNoFromBoolean(value: boolean | undefined): SiNoValue {
  if (value === true) return 'si'
  if (value === false) return 'no'
  return ''
}

function booleanFromSiNo(value: SiNoValue): boolean | undefined {
  if (value === 'si') return true
  if (value === 'no') return false
  return undefined
}

function formatSiNo(value: boolean | undefined): string {
  if (value === true) return 'Sí'
  if (value === false) return 'No'
  return '—'
}

function formToPayload(form: PersonaForm, editing: boolean) {
  const optionalBoolean = (value: SiNoValue) => {
    const mapped = booleanFromSiNo(value)
    if (editing) return mapped === undefined ? null : mapped
    return mapped
  }

  return {
    nombreCompleto: form.nombreCompleto,
    documento: form.documento,
    contacto: form.contacto,
    coordinadorFacilitador: editing
      ? form.coordinadorFacilitador
      : form.coordinadorFacilitador || undefined,
    falta: optionalBoolean(form.falta),
    carreraCrecimiento: optionalBoolean(form.carreraCrecimiento),
    llevoGrupoConexion: optionalBoolean(form.llevoGrupoConexion),
    parejaNombre: form.parejaNombre,
    parejaDocumento: form.parejaDocumento,
    parejaContacto: form.parejaContacto,
    parejaFalta: optionalBoolean(form.parejaFalta),
  }
}

function SiNoSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: SiNoValue
  onChange: (value: SiNoValue) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value || 'unset'} onValueChange={(v) => onChange(v === 'unset' ? '' : (v as SiNoValue))}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">—</SelectItem>
          <SelectItem value="si">Sí</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default function PersonasAdminPage() {
  const [search, setSearch] = useState('')
  const rows = useQuery(api.personas.list, { search: search || undefined })
  const create = useMutation(api.personas.create)
  const update = useMutation(api.personas.update)
  const remove = useMutation(api.personas.remove)

  const [form, setForm] = useState<PersonaForm>(emptyForm)
  const [editingId, setEditingId] = useState<Id<'personas'> | null>(null)

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = formToPayload(form, !!editingId)
      if (editingId) {
        await update({ id: editingId, ...payload })
        toast.success('Facilitador actualizado')
      } else {
        await create({
          ...payload,
          falta: payload.falta ?? undefined,
          carreraCrecimiento: payload.carreraCrecimiento ?? undefined,
          llevoGrupoConexion: payload.llevoGrupoConexion ?? undefined,
          parejaFalta: payload.parejaFalta ?? undefined,
        })
        toast.success('Facilitador creado')
      }
      setForm(emptyForm())
      setEditingId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm())
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilitadores"
        description="Facilitadores registrados que pueden hacer check-in en el evento"
      />

      <Input
        placeholder="Buscar por nombre o documento…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <SectionCard title={editingId ? 'Editar facilitador' : 'Nuevo facilitador'}>
        <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
          <p className="text-sm font-medium text-muted-foreground md:col-span-2">Facilitador</p>
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
          <div className="flex items-end gap-2 pb-2">
            <input
              id="coordinadorFacilitador"
              type="checkbox"
              className="size-4 rounded border"
              checked={form.coordinadorFacilitador}
              onChange={(e) => setForm({ ...form, coordinadorFacilitador: e.target.checked })}
            />
            <Label htmlFor="coordinadorFacilitador" className="cursor-pointer font-normal">
              Coordinador/Facilitador
            </Label>
          </div>
          <SiNoSelect
            id="falta"
            label="Falta"
            value={form.falta}
            onChange={(falta) => setForm({ ...form, falta })}
          />
          <SiNoSelect
            id="carreraCrecimiento"
            label="Carrera crecimiento"
            value={form.carreraCrecimiento}
            onChange={(carreraCrecimiento) => setForm({ ...form, carreraCrecimiento })}
          />
          <SiNoSelect
            id="llevoGrupoConexion"
            label="Grupo Conexión"
            value={form.llevoGrupoConexion}
            onChange={(llevoGrupoConexion) => setForm({ ...form, llevoGrupoConexion })}
          />

          <p className="text-sm font-medium text-muted-foreground md:col-span-2">Pareja</p>
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
          <SiNoSelect
            id="parejaFalta"
            label="Falta (pareja)"
            value={form.parejaFalta}
            onChange={(parejaFalta) => setForm({ ...form, parejaFalta })}
          />

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
        <EmptyState title="Sin facilitadores" description="Cree el primer registro con el formulario de arriba." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Coord./Fac.</TableHead>
                <TableHead>Falta</TableHead>
                <TableHead>Carrera</TableHead>
                <TableHead>G. Conexión</TableHead>
                <TableHead>Pareja</TableHead>
                <TableHead>Cédula pareja</TableHead>
                <TableHead>Número pareja</TableHead>
                <TableHead>Falta pareja</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-medium">{p.nombreCompleto}</TableCell>
                  <TableCell>{p.documento}</TableCell>
                  <TableCell>{p.contacto ?? '—'}</TableCell>
                  <TableCell>{p.coordinadorFacilitador ? 'Sí' : '—'}</TableCell>
                  <TableCell>{formatSiNo(p.falta)}</TableCell>
                  <TableCell>{formatSiNo(p.carreraCrecimiento)}</TableCell>
                  <TableCell>{formatSiNo(p.llevoGrupoConexion)}</TableCell>
                  <TableCell>{p.parejaNombre ?? '—'}</TableCell>
                  <TableCell>{p.parejaDocumento ?? '—'}</TableCell>
                  <TableCell>{p.parejaContacto ?? '—'}</TableCell>
                  <TableCell>{formatSiNo(p.parejaFalta)}</TableCell>
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
                          coordinadorFacilitador: p.coordinadorFacilitador ?? false,
                          falta: siNoFromBoolean(p.falta),
                          carreraCrecimiento: siNoFromBoolean(p.carreraCrecimiento),
                          llevoGrupoConexion: siNoFromBoolean(p.llevoGrupoConexion),
                          parejaNombre: p.parejaNombre ?? '',
                          parejaDocumento: p.parejaDocumento ?? '',
                          parejaContacto: p.parejaContacto ?? '',
                          parejaFalta: siNoFromBoolean(p.parejaFalta),
                        })
                      }}
                    >
                      Editar
                    </Button>
                    <ConfirmDeleteDialog
                      trigger={<Button size="sm" variant="destructive">Eliminar</Button>}
                      title="Eliminar facilitador"
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
