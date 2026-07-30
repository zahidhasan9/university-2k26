"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { ActionDialog } from "@/components/ui/action-dialog"
import { Button } from "@/components/ui/button"
import { errorMessage, useEndpointMutation } from "@/lib/api-hooks"
import { API_ENDPOINTS } from "@/lib/api-endpoints"

export function EndAllocation({ id, type }: { id: string; type: "hostel" | "transport" }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const mutation = useEndpointMutation<unknown, { endsAt: string }>(
    API_ENDPOINTS.facilities.endAllocation(type, id),
  )

  async function endAllocation() {
    setError("")
    try {
      await mutation.mutateAsync({ endsAt: new Date().toISOString() })
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Allocation could not be ended"))
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <LogOut />
        End
      </Button>
      <ActionDialog
        open={open}
        title={`End this ${type} allocation?`}
        description="The allocation history will be retained with its end time."
        confirmLabel="End allocation"
        destructive
        pending={mutation.isPending}
        error={error}
        onClose={() => setOpen(false)}
        onConfirm={endAllocation}
      />
    </>
  )
}
