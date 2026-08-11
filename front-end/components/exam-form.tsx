"use client"

import { API_ENDPOINTS } from "@/lib/api-endpoints"

import { apiResponseRequest } from "@/lib/http-client"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
type Offering = {
  _id: string
  section: string
  course: { code: string; title: string }
  semester: { name: string; academicYear: string }
}
export function ExamForm({ offerings }: { offerings: Offering[] }) {
  const router = useRouter(),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      offeringId: form.get("offeringId"),
      title: form.get("title"),
      type: form.get("type"),
      examDate: form.get("examDate"),
      startTime: form.get("startTime"),
      endTime: form.get("endTime"),
      room: String(form.get("room") ?? "").trim() || undefined,
      totalMarks: Number(form.get("totalMarks")),
      weightPercentage: Number(form.get("weightPercentage")),
    }
    setLoading(true)
    const response = await apiResponseRequest(API_ENDPOINTS.exams.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const body = await response.json()
    setLoading(false)
    if (!response.ok) return setError(body.message)
    router.push("/dashboard/results")
    router.refresh()
  }
  return (
    <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label>Course offering</Label>
        <select
          name="offeringId"
          required
          defaultValue=""
          className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
        >
          <option value="" disabled>
            Select offering
          </option>
          {offerings.map((item) => (
            <option key={item._id} value={item._id}>
              {item.course.code} · {item.section} · {item.semester.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Exam title</Label>
        <Input name="title" minLength={2} required />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <select name="type" className="h-9 w-full rounded-lg border bg-background px-3 text-sm">
          {["quiz", "class_test", "midterm", "final", "practical", "assignment", "viva"].map(
            (value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ),
          )}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Date</Label>
        <Input name="examDate" type="date" required />
      </div>
      <div className="space-y-2">
        <Label>Room</Label>
        <Input name="room" />
      </div>
      <div className="space-y-2">
        <Label>Start time</Label>
        <Input name="startTime" type="time" required />
      </div>
      <div className="space-y-2">
        <Label>End time</Label>
        <Input name="endTime" type="time" required />
      </div>
      <div className="space-y-2">
        <Label>Total marks</Label>
        <Input name="totalMarks" type="number" min={1} max={1000} required />
      </div>
      <div className="space-y-2">
        <Label>Weight percentage</Label>
        <Input name="weightPercentage" type="number" min={0.01} max={100} step={0.01} required />
      </div>
      {error && (
        <p className="md:col-span-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <LoaderCircle className="animate-spin" />}Create examination
        </Button>
      </div>
    </form>
  )
}
