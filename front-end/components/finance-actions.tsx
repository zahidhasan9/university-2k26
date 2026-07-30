"use client"

import { Check, RotateCcw, WalletCards, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { ActionDialog } from "@/components/ui/action-dialog"
import { Button } from "@/components/ui/button"
import { errorMessage, useEndpointMutation } from "@/lib/api-hooks"
import { API_ENDPOINTS } from "@/lib/api-endpoints"

export function RefundAction({ id }: { id: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const mutation = useEndpointMutation<unknown, { reason: string }>(
    API_ENDPOINTS.finance.refundPayment(id),
  )

  async function refund(values: Record<string, string>) {
    setError("")
    try {
      await mutation.mutateAsync({ reason: values.reason.trim() })
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Refund could not be completed"))
    }
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <RotateCcw />
        Refund
      </Button>
      <ActionDialog
        open={open}
        title="Refund this payment?"
        confirmLabel="Refund payment"
        destructive
        pending={mutation.isPending}
        error={error}
        fields={[{ name: "reason", label: "Refund reason", required: true }]}
        onClose={() => setOpen(false)}
        onConfirm={refund}
      />
    </>
  )
}

export function ExpenseAction({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [action, setAction] = useState<string | null>(null)
  const [error, setError] = useState("")
  const mutation = useEndpointMutation<unknown, { action: string; note?: string }>(
    API_ENDPOINTS.finance.expenseAction(id),
  )
  const actions =
    status === "draft"
      ? ["approve", "reject"]
      : status === "approved"
        ? ["mark_paid", "cancel"]
        : []

  async function run(values: Record<string, string>) {
    if (!action) return
    setError("")
    try {
      await mutation.mutateAsync({
        action,
        note: values.note.trim() || undefined,
      })
      setAction(null)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Expense action could not be completed"))
    }
  }

  return (
    <div className="flex justify-end gap-1">
      {actions.map((item) => (
        <Button
          key={item}
          size="icon-sm"
          variant="ghost"
          aria-label={item.replace("_", " ")}
          onClick={() => setAction(item)}
        >
          {item === "approve" ? <Check /> : item === "mark_paid" ? <WalletCards /> : <X />}
        </Button>
      ))}
      <ActionDialog
        open={action !== null}
        title={`${action?.replace("_", " ") ?? "Update"} this expense?`}
        confirmLabel={action?.replace("_", " ") ?? "Continue"}
        destructive={action === "reject" || action === "cancel"}
        pending={mutation.isPending}
        error={error}
        fields={[{ name: "note", label: "Action note", placeholder: "Optional note" }]}
        onClose={() => setAction(null)}
        onConfirm={run}
      />
    </div>
  )
}
