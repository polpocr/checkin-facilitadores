import { cn } from '@/lib/utils'

const STEPS = ['Buscar', 'Confirmar', 'Grupos', 'Listo'] as const
export type CheckinStepId = 'search' | 'confirm' | 'groups' | 'done'

const stepIndex: Record<CheckinStepId, number> = {
  search: 0,
  confirm: 1,
  groups: 2,
  done: 3,
}

export function StepIndicator({ current }: { current: CheckinStepId }) {
  const active = stepIndex[current]

  return (
    <ol className="flex items-center gap-1 sm:gap-2" aria-label="Pasos del check-in">
      {STEPS.map((label, i) => {
        const done = i < active
        const currentStep = i === active
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums transition-colors',
                  done && 'bg-primary text-primary-foreground',
                  currentStep && 'bg-primary text-primary-foreground ring-2 ring-primary/25',
                  !done && !currentStep && 'bg-muted text-muted-foreground',
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              <span
                className={cn(
                  'hidden truncate text-[11px] font-medium sm:block',
                  currentStep ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn('mb-4 h-px flex-1', done ? 'bg-primary/40' : 'bg-border')}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
