"use client"

import { Undo2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { ActionDialog } from "@/components/ui/action-dialog"
import { Button } from "@/components/ui/button"
import { errorMessage, useEndpointMutation } from "@/lib/api-hooks"
import { API_ENDPOINTS } from "@/lib/api-endpoints"

type ReturnPayload = {
  condition: string
  note?: string
}

export function ReturnBook({ id }: { id: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const mutation = useEndpointMutation<unknown, ReturnPayload>(
    API_ENDPOINTS.library.returnTransaction(id),
  )

  async function returnBook(values: Record<string, string>) {
    setError("")
    try {
      await mutation.mutateAsync({
        condition: values.condition,
        note: values.note.trim() || undefined,
      })
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Book return could not be recorded"))
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Undo2 />
        Return
      </Button>
      <ActionDialog
        open={open}
        title="Return library book"
        description="Record the physical condition before completing the return."
        confirmLabel="Complete return"
        pending={mutation.isPending}
        error={error}
        fields={[
          {
            name: "condition",
            label: "Return condition",
            defaultValue: "good",
            required: true,
            options: ["new", "good", "fair", "damaged"].map((value) => ({
              label: value[0].toUpperCase() + value.slice(1),
              value,
            })),
          },
          { name: "note", label: "Return note", placeholder: "Optional note" },
        ]}
        onClose={() => setOpen(false)}
        onConfirm={returnBook}
      />
    </>
  )
}
