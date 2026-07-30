"use client"

import { useEffect, useRef, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type ActionDialogField = {
  name: string
  label: string
  placeholder?: string
  required?: boolean
  defaultValue?: string
  options?: Array<{ label: string; value: string }>
}

export function ActionDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  pending = false,
  error,
  fields = [],
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  destructive?: boolean
  pending?: boolean
  error?: string
  fields?: ActionDialogField[]
  onClose: () => void
  onConfirm: (values: Record<string, string>) => void | Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<
      string,
      string
    >
    await onConfirm(values)
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onClose()
      }}
      onClose={() => {
        if (open && !pending) onClose()
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-xl border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50"
    >
      <form onSubmit={submit}>
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        </div>
        {(fields.length > 0 || error) && (
          <div className="space-y-4 p-5">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={`dialog-${field.name}`}>{field.label}</Label>
                {field.options ? (
                  <select
                    id={`dialog-${field.name}`}
                    name={field.name}
                    required={field.required}
                    defaultValue={field.defaultValue ?? ""}
                    className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={`dialog-${field.name}`}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    defaultValue={field.defaultValue}
                  />
                )}
              </div>
            ))}
            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 border-t p-4">
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
