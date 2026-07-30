"use client"

import { Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { ActionDialog } from "@/components/ui/action-dialog"
import { Button } from "@/components/ui/button"
import { errorMessage, useEndpointMutation } from "@/lib/api-hooks"
import { API_ENDPOINTS } from "@/lib/api-endpoints"

type Decision = "approve" | "reject"

export function LeaveDecision({ id }: { id: string }) {
  const router = useRouter()
  const [decision, setDecision] = useState<Decision | null>(null)
  const [error, setError] = useState("")
  const mutation = useEndpointMutation<unknown, { decision: Decision; note?: string }>(
    API_ENDPOINTS.hr.leaveDecision(id),
  )

  async function submit(values: Record<string, string>) {
    if (!decision) return
    setError("")
    try {
      await mutation.mutateAsync({
        decision,
        note: values.note.trim() || undefined,
      })
      setDecision(null)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Leave decision could not be saved"))
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        size="icon-sm"
        variant="ghost"
        className="text-emerald-700"
        aria-label="Approve leave"
        onClick={() => setDecision("approve")}
      >
        <Check />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        className="text-rose-700"
        aria-label="Reject leave"
        onClick={() => setDecision("reject")}
      >
        <X />
      </Button>
      <ActionDialog
        open={decision !== null}
        title={decision === "approve" ? "Approve leave request?" : "Reject leave request?"}
        confirmLabel={decision === "approve" ? "Approve" : "Reject"}
        destructive={decision === "reject"}
        pending={mutation.isPending}
        error={error}
        fields={[
          {
            name: "note",
            label: decision === "reject" ? "Rejection reason" : "Approval note",
            required: decision === "reject",
            placeholder:
              decision === "reject" ? "Explain why this request is rejected" : "Optional",
          },
        ]}
        onClose={() => setDecision(null)}
        onConfirm={submit}
      />
    </div>
  )
}
