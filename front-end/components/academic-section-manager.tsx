"use client"

import { FormEvent, useState } from "react"
import { LoaderCircle, Plus, Trash2, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { ConfirmAction } from "@/components/ui/confirm-action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"

export type AcademicSectionOption = {
  _id: string
  code: string
  name: string
  capacity: number
  enrolledCount: number
  availableSeats: number
  shift: string
  homeRoom?: string
  status: string
}
const selectClass = "h-9 w-full rounded-lg border bg-background px-3 text-sm"

export function AcademicSectionManager({
  batchId,
  sections,
}: {
  batchId: string
  sections: AcademicSectionOption[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSaving(true)
    setError("")
    try {
      const response = await apiResponseRequest(API_ENDPOINTS.academics.sections, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicBatchId: batchId,
          code: form.get("code"),
          name: form.get("name"),
          capacity: Number(form.get("capacity")),
          shift: form.get("shift"),
          homeRoom: form.get("homeRoom") || undefined,
        }),
      })
      const body = await response.json<{ message?: string }>()
      if (!response.ok) throw new Error(body.message || "Section could not be created")
      formElement.reset()
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Section could not be created")
    } finally {
      setSaving(false)
    }
  }
  async function archive(id: string) {
    const response = await apiResponseRequest(API_ENDPOINTS.academics.sectionDetail(id), {
      method: "DELETE",
    })
    if (!response.ok) {
      const body = await response.json<{ message?: string }>()
      throw new Error(body.message || "Section could not be archived")
    }
    router.refresh()
  }
  return (
    <div className="space-y-6">
      <form
        onSubmit={create}
        className="grid gap-4 rounded-xl border bg-muted/20 p-5 md:grid-cols-5"
      >
        <div className="space-y-2">
          <Label>Code</Label>
          <Input name="code" placeholder="A" required />
        </div>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input name="name" placeholder="Section A" required />
        </div>
        <div className="space-y-2">
          <Label>Capacity</Label>
          <Input name="capacity" type="number" min={1} max={1000} defaultValue={60} required />
        </div>
        <div className="space-y-2">
          <Label>Shift</Label>
          <select name="shift" className={selectClass} defaultValue="day">
            <option value="morning">Morning</option>
            <option value="day">Day</option>
            <option value="evening">Evening</option>
            <option value="weekend">Weekend</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Home room</Label>
          <Input name="homeRoom" placeholder="C-301" />
        </div>
        {error && <p className="text-sm text-destructive md:col-span-4">{error}</p>}
        <div className="md:col-span-5">
          <Button type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="animate-spin" /> : <Plus />} Add section
          </Button>
        </div>
      </form>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="p-3">Section</th>
              <th className="p-3">Shift / room</th>
              <th className="p-3">Students</th>
              <th className="p-3">Available</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section._id} className="border-t">
                <td className="p-3">
                  <p className="font-semibold">{section.code}</p>
                  <p className="text-xs text-muted-foreground">{section.name}</p>
                </td>
                <td className="p-3 capitalize">
                  {section.shift}
                  {section.homeRoom ? ` · ${section.homeRoom}` : ""}
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-4" />
                    {section.enrolledCount} / {section.capacity}
                  </span>
                </td>
                <td className="p-3">{section.availableSeats}</td>
                <td className="p-3 text-right">
                  <ConfirmAction
                    title={`Archive section ${section.code}?`}
                    description="A section with assigned students cannot be archived. Transfer them first."
                    confirmLabel="Archive section"
                    triggerIcon={<Trash2 />}
                    onConfirm={() => archive(section._id)}
                    disabled={section.enrolledCount > 0}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!sections.length && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No sections yet. Add the first section above.
          </p>
        )}
      </div>
    </div>
  )
}
