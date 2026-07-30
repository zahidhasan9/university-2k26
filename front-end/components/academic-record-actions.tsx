"use client"

import { Archive, Pencil } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { ActionDialog } from "@/components/ui/action-dialog"
import { Button } from "@/components/ui/button"
import type { AcademicEntity } from "@/lib/academic-types"
import { errorMessage, useEndpointMutation } from "@/lib/api-hooks"
import { API_ENDPOINTS } from "@/lib/api-endpoints"

export function AcademicRecordActions({
  entity,
  id,
  archived,
}: {
  entity: AcademicEntity
  id: string
  archived: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const mutation = useEndpointMutation(API_ENDPOINTS.academics.detail(entity, id), {
    method: "DELETE",
  })

  async function archive() {
    setError("")
    try {
      await mutation.mutateAsync(undefined)
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Record could not be archived"))
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit record"
        render={<Link href={`/dashboard/academics/${entity}/${id}/edit`} />}
      >
        <Pencil />
      </Button>
      {entity !== "semesters" && !archived && (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Archive record"
            onClick={() => setOpen(true)}
          >
            <Archive />
          </Button>
          <ActionDialog
            open={open}
            title="Archive this record?"
            description="Existing historical references will be preserved."
            confirmLabel="Archive"
            destructive
            pending={mutation.isPending}
            error={error}
            onClose={() => setOpen(false)}
            onConfirm={archive}
          />
        </>
      )}
    </div>
  )
}
