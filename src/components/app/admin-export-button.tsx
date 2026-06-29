'use client'

import { useState } from 'react'
import { useConvex } from 'convex/react'
import { api } from '@convex/_generated/api'
import { downloadPersonasGruposCsv } from '@/lib/export-personas-grupos-csv'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

export function AdminExportButton() {
  const convex = useConvex()
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const rows = await convex.query(api.exportar.personasYGrupos, {})
      downloadPersonasGruposCsv(rows)
      toast.success('Exportación descargada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al exportar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      <Download />
      {loading ? 'Exportando…' : 'Exportar CSV'}
    </Button>
  )
}
