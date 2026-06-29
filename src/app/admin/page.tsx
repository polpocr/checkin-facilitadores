'use client'

import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { EmptyState } from '@/components/app/empty-state'
import { LoadingState } from '@/components/app/loading-state'
import { PageHeader } from '@/components/app/page-header'
import { SectionCard } from '@/components/app/section-card'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, ClipboardList, Users } from 'lucide-react'

function KpiCard({
  title,
  value,
  subtitle,
  href,
  highlight,
  icon: Icon,
}: {
  title: string
  value: string | number
  subtitle?: string
  href: string
  highlight?: 'primary' | 'warning' | 'success'
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link href={href} className="group block">
      <Card
        className={cn(
          'transition-all hover:ring-primary/30',
          highlight === 'warning' && 'border-warning/40 bg-warning/5',
          highlight === 'success' && 'border-success/30',
        )}
      >
        <CardContent className="flex items-start gap-3 pt-(--card-spacing)">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg',
              highlight === 'warning' ? 'bg-warning/20 text-warning-foreground' : 'bg-primary/10 text-primary',
            )}
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function AdminDashboardPage() {
  const kpis = useQuery(api.dashboard.getKpis)

  if (!kpis) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Resumen en tiempo real del evento" />
        <LoadingState label="Cargando métricas…" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Monitoreo en tiempo real del registro y grupos del evento"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Check-ins realizados"
          value={kpis.checkinsRealizados}
          subtitle={`${kpis.porcentajeCheckin}% del total`}
          href="/admin/checkins"
          highlight="success"
          icon={CheckCircle2}
        />
        <KpiCard
          title="Sin check-in"
          value={kpis.personasSinCheckin}
          href="/admin/checkins"
          highlight={kpis.personasSinCheckin > 0 ? 'warning' : undefined}
          icon={AlertTriangle}
        />
        <KpiCard
          title="Casos pendientes"
          value={kpis.casosPendientes}
          href="/admin/casos-revision?estado=pendiente"
          highlight={kpis.casosPendientes > 0 ? 'warning' : undefined}
          icon={ClipboardList}
        />
        <KpiCard
          title="Operadores registrados"
          value={kpis.totalPersonas}
          href="/admin/personas"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Grupos creados" value={kpis.totalGrupos} href="/admin/grupos" icon={Users} />
        <KpiCard
          title="Desglose grupos"
          value={`${kpis.conUnGrupo} / ${kpis.conDosGrupos}`}
          subtitle="1 grupo / 2 grupos"
          href="/admin/grupos"
          icon={Users}
        />
        <KpiCard
          title="Integrantes capturados"
          value={kpis.totalIntegrantes}
          subtitle={`Promedio ${kpis.promedioIntegrantesPorGrupo} por grupo`}
          href="/admin/integrantes"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Check-ins por staff">
          <div className="space-y-2 text-sm">
            {Object.entries(kpis.checkinsPorOperador).map(([operadorId, count]) => (
              <div key={operadorId} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                <span className="truncate font-mono text-xs text-muted-foreground">{operadorId.slice(0, 8)}…</span>
                <span className="font-medium tabular-nums">{count}</span>
              </div>
            ))}
            {Object.keys(kpis.checkinsPorOperador).length === 0 && (
              <EmptyState title="Sin actividad" description="Aún no hay check-ins registrados por el staff." />
            )}
          </div>
        </SectionCard>
        <SectionCard title="Check-ins por hora">
          <div className="max-h-64 space-y-2 overflow-auto text-sm">
            {Object.entries(kpis.checkinsPorHora)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([hour, count]) => (
                <div key={hour} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-muted-foreground">{hour}</span>
                  <span className="font-medium tabular-nums">{count}</span>
                </div>
              ))}
            {Object.keys(kpis.checkinsPorHora).length === 0 && (
              <EmptyState title="Sin datos horarios" description="Los check-ins aparecerán aquí conforme avance el evento." />
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
