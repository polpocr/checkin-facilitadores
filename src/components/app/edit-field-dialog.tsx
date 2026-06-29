'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function EditFieldDialogBody({
  title,
  description,
  label,
  initialValue,
  onSave,
  onClose,
  required = true,
}: {
  title: string
  description?: string
  label: string
  initialValue: string
  onSave: (value: string) => Promise<void>
  onClose: () => void
  required?: boolean
}) {
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (required && !value.trim()) return
    setSaving(true)
    try {
      await onSave(value.trim())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="edit-field">{label}</Label>
        <Input
          id="edit-field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleSave()}
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={() => void handleSave()} disabled={saving || (required && !value.trim())}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogFooter>
    </>
  )
}

export function EditFieldDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  initialValue,
  onSave,
  required = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  label: string
  initialValue: string
  onSave: (value: string) => Promise<void>
  required?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <EditFieldDialogBody
            key={initialValue}
            title={title}
            description={description}
            label={label}
            initialValue={initialValue}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
            required={required}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
