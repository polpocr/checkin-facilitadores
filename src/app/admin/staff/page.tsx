'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { EmptyState } from '@/components/app/empty-state'
import { LoadingState } from '@/components/app/loading-state'
import { PageHeader } from '@/components/app/page-header'
import { SectionCard } from '@/components/app/section-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function StaffAdminPage() {
  const rows = useQuery(api.applicationUsers.listStaff)
  const create = useMutation(api.applicationUsers.createStaffUser)
  const update = useMutation(api.applicationUsers.updateStaffUser)
  const remove = useMutation(api.applicationUsers.removeStaffUser)

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'operador' as 'admin' | 'operador',
  })

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      await create(form)
      toast.success('Usuario creado')
      setForm({ email: '', password: '', fullName: '', role: 'operador' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Usuarios con acceso al check-in (operador) o al panel admin"
      />

      <SectionCard title="Nuevo usuario">
        <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Contraseña</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </div>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as 'admin' | 'operador' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="operador">Staff check-in</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Crear usuario</Button>
          </div>
        </form>
      </SectionCard>

      {rows === undefined ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState title="Sin usuarios" description="Cree el primer usuario de staff con el formulario de arriba." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.fullName ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role === 'operador' ? 'Staff check-in' : 'Admin'}</Badge>
                  </TableCell>
                  <TableCell>{u.active ? 'Activo' : 'Inactivo'}</TableCell>
                  <TableCell className="text-right">
                    {u.role === 'admin' ? (
                      <span className="text-sm text-muted-foreground">Protegido</span>
                    ) : (
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await update({ id: u._id, active: !u.active })
                              toast.success('Actualizado')
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Error')
                            }
                          }}
                        >
                          {u.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            try {
                              await remove({ id: u._id })
                              toast.success('Eliminado')
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Error')
                            }
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
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
