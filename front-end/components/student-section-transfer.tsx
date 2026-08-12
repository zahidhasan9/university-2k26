"use client"

import { useState } from "react"
import { ArrowRightLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { ActionDialog } from "@/components/ui/action-dialog"
import { Button } from "@/components/ui/button"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"

type Section = { _id: string; code: string; name: string; capacity: number; enrolledCount: number }
export function StudentSectionTransfer({
  studentId,
  currentSectionId,
  currentSectionCode,
  sections,
}: {
  studentId: string
  currentSectionId?: string
  currentSectionCode: string
  sections: Section[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const targets = sections.filter(
    (section) => section._id !== currentSectionId && section.enrolledCount < section.capacity,
  )
  async function transfer(values: Record<string, string>) {
    setPending(true)
    setError("")
    try {
      const response = await apiResponseRequest(API_ENDPOINTS.students.transferSection(studentId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicSectionId: values.academicSectionId,
          reason: values.reason || undefined,
        }),
      })
      const body = await response.json<{ message?: string }>()
      if (!response.ok) throw new Error(body.message || "Student could not be transferred")
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Student could not be transferred")
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={!targets.length}>
        <ArrowRightLeft /> Transfer section
      </Button>
      <ActionDialog
        open={open}
        title="Transfer student section"
        description={`Current section: ${currentSectionCode}. The transfer is recorded in the audit history.`}
        confirmLabel="Confirm transfer"
        pending={pending}
        error={error}
        onClose={() => setOpen(false)}
        onConfirm={transfer}
        fields={[
          {
            name: "academicSectionId",
            label: "Target section",
            required: true,
            options: [
              { value: "", label: "Select a section" },
              ...targets.map((section) => ({
                value: section._id,
                label: `${section.code} · ${section.name} (${section.capacity - section.enrolledCount} seats left)`,
              })),
            ],
          },
          { name: "reason", label: "Transfer reason", placeholder: "Optional administrative note" },
        ]}
      />
    </>
  )
}
