"use client"

import { ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ActionDialog } from "@/components/ui/action-dialog"
import { errorMessage, useEndpointMutation } from "@/lib/api-hooks"
import { API_ENDPOINTS } from "@/lib/api-endpoints"

export function UserStatusAction({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const nextStatus = status === "active" ? "suspended" : "active"
  const mutation = useEndpointMutation<unknown, { status: string }>(
    API_ENDPOINTS.users.detail(id),
    {
      method: "PATCH",
    },
  )

  async function update() {
    setError("")
    try {
      await mutation.mutateAsync({ status: nextStatus })
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Status update failed"))
    }
  }

  const actionLabel = nextStatus === "active" ? "Activate" : "Suspend"

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <ShieldAlert />
        {actionLabel}
      </Button>
      <ActionDialog
        open={open}
        title={`${actionLabel} this user?`}
        description="Active sessions may be revoked when the account status changes."
        confirmLabel={actionLabel}
        destructive={nextStatus === "suspended"}
        pending={mutation.isPending}
        error={error}
        onClose={() => setOpen(false)}
        onConfirm={update}
      />
    </>
  )
}
