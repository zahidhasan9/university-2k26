"use client"

import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { ActionDialog } from "@/components/ui/action-dialog"
import { Button } from "@/components/ui/button"
import { errorMessage, useEndpointMutation } from "@/lib/api-hooks"
import { API_ENDPOINTS } from "@/lib/api-endpoints"

export function AttendanceActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const mutation = useEndpointMutation(API_ENDPOINTS.attendance.close(id))

  async function closeSession() {
    setError("")
    try {
      await mutation.mutateAsync(undefined)
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Session could not be closed"))
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="sm" render={<Link href={`/dashboard/attendance/${id}`} />}>
        Records
      </Button>
      {status === "open" && (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close attendance session"
            onClick={() => setOpen(true)}
          >
            <CheckCircle2 />
          </Button>
          <ActionDialog
            open={open}
            title="Close attendance session?"
            description="Unmarked enrolled students will be recorded as absent."
            confirmLabel="Close session"
            destructive
            pending={mutation.isPending}
            error={error}
            onClose={() => setOpen(false)}
            onConfirm={closeSession}
          />
        </>
      )}
    </div>
  )
}
