"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpenCheck, LoaderCircle } from "lucide-react"
import { apiResponseRequest } from "@/lib/http-client"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { Button } from "@/components/ui/button"

type Offering = {
  _id: string
  section: string
  course: { code: string; title: string; credits: number; courseType: string; theoryHoursPerWeek: number; labHoursPerWeek: number }
  semester: { name: string; academicYear: string }
}

export function SemesterRegistrationForm({ offerings }: { offerings: Offering[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const offeringIds = form.getAll("offeringIds").map(String)
    if (!offeringIds.length) return setError("Select at least one course")
    setLoading(true)
    setError("")
    const response = await apiResponseRequest(API_ENDPOINTS.enrollments.registerMine, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offeringIds }),
    })
    const body = await response.json<{ message?: string }>()
    setLoading(false)
    if (!response.ok) return setError(body.message || "Registration failed")
    router.push("/dashboard/lms")
    router.refresh()
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {offerings.map((item) => (
        <label key={item._id} className="flex cursor-pointer gap-4 rounded-xl border p-4 hover:bg-muted/40">
          <input type="checkbox" name="offeringIds" value={item._id} className="mt-1 size-4" />
          <span className="flex-1">
            <span className="font-semibold">{item.course.code} — {item.course.title}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {item.course.credits} credits · {item.course.courseType} · Section {item.section}
            </span>
            <span className="block text-xs text-muted-foreground">
              Theory {item.course.theoryHoursPerWeek}h/week · Lab {item.course.labHoursPerWeek}h/week
            </span>
          </span>
        </label>
      ))}
      {!offerings.length && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No courses are currently open for your curriculum semester.</p>}
      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || !offerings.length}>
        {loading ? <LoaderCircle className="animate-spin" /> : <BookOpenCheck />} Register selected courses
      </Button>
    </form>
  )
}
