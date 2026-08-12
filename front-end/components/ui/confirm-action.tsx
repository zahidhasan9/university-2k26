"use client"
import { ReactNode, useState } from "react"
import { ActionDialog } from "@/components/ui/action-dialog"
import { Button } from "@/components/ui/button"

export function ConfirmAction({ title, description, confirmLabel = "Remove", triggerLabel, triggerIcon, onConfirm, disabled = false, size = "sm", variant = "destructive" }: { title: string; description: string; confirmLabel?: string; triggerLabel?: string; triggerIcon?: ReactNode; onConfirm: () => void | Promise<void>; disabled?: boolean; size?: "sm" | "icon-sm"; variant?: "destructive" | "ghost" | "outline" }) {
  const [open, setOpen] = useState(false); const [pending, setPending] = useState(false); const [error, setError] = useState("")
  async function confirm() { setPending(true); setError(""); try { await onConfirm(); setOpen(false) } catch (cause) { setError(cause instanceof Error ? cause.message : "Action could not be completed") } finally { setPending(false) } }
  return <><Button type="button" size={size} variant={variant} disabled={disabled} aria-label={triggerLabel ?? confirmLabel} onClick={() => setOpen(true)}>{triggerIcon}{triggerLabel}</Button><ActionDialog open={open} title={title} description={description} confirmLabel={confirmLabel} destructive pending={pending} error={error} onClose={() => setOpen(false)} onConfirm={confirm} /></>
}
