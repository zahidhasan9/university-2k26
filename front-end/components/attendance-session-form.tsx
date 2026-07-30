"use client"

import { apiResponseRequest } from "@/lib/http-client"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
type Offering = { _id: string; section: string; course: { code: string; title: string } }
export function AttendanceSessionForm({ offerings }: { offerings: Offering[] }) {
  const router = useRouter(),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError("")
    const response = await apiResponseRequest("/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offeringId: form.get("offeringId"),
        date: form.get("date"),
        topic: String(form.get("topic") ?? "").trim() || undefined,
      }),
    })
    const body = await response.json()
    setLoading(false)
    if (!response.ok) return setError(body.message)
    router.push("/dashboard/attendance")
    router.refresh()
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="offeringId">Course offering</Label>
        <select
          id="offeringId"
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
              {item.course.code} · Section {item.section} · {item.course.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">Session date</Label>
        <Input id="date" name="date" type="date" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="topic">Topic</Label>
        <Input id="topic" name="topic" maxLength={300} />
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" disabled={loading}>
        {loading && <LoaderCircle className="animate-spin" />}Create session
      </Button>
    </form>
  )
}
