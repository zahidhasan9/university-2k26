"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"

type Offering = { _id: string; section: string; batch: string; course: { code: string; title: string }; teacher: { user: { firstName: string; lastName: string } }; semester: { name: string; academicYear: string } }
type Routine = { _id: string; offering: string; dayOfWeek: string; startTime: string; endTime: string; room: string }
const selectClass = "h-9 w-full rounded-lg border bg-background px-3 text-sm"

export function AttendanceSessionForm({ offerings, routines }: { offerings: Offering[]; routines: Routine[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [offeringId, setOfferingId] = useState("")
  const availableRoutines = routines.filter((slot) => String(slot.offering) === offeringId)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError("")
    const response = await apiResponseRequest(API_ENDPOINTS.attendance.sessions, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offeringId: form.get("offeringId"), startsAt: form.get("startsAt"), endsAt: form.get("endsAt"),
        classType: form.get("classType"), room: String(form.get("room") ?? "").trim() || undefined,
        routineSlotId: String(form.get("routineSlotId") ?? "").trim() || undefined,
        topic: String(form.get("topic") ?? "").trim() || undefined,
      }),
    })
    const body = await response.json<{ message: string; data: { session: { _id: string } } }>()
    setLoading(false)
    if (!response.ok) return setError(body.message)
    router.push(`/dashboard/attendance/${body.data.session._id}`)
    router.refresh()
  }

  return <form onSubmit={submit} className="space-y-5">
    <div className="space-y-2"><Label htmlFor="offeringId">Course offering</Label><select id="offeringId" name="offeringId" required value={offeringId} onChange={(event) => setOfferingId(event.target.value)} className={selectClass}><option value="" disabled>Select assigned course</option>{offerings.map((item) => <option key={item._id} value={item._id}>{item.course.code} · {item.batch}/{item.section} · {item.teacher.user.firstName} {item.teacher.user.lastName}</option>)}</select></div>
    <div className="space-y-2"><Label htmlFor="routineSlotId">Routine slot (optional)</Label><select id="routineSlotId" name="routineSlotId" className={selectClass} defaultValue=""><option value="">Ad-hoc / no routine slot</option>{availableRoutines.map((slot) => <option key={slot._id} value={slot._id}>{slot.dayOfWeek} · {slot.startTime}–{slot.endTime} · {slot.room}</option>)}</select></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="startsAt">Class starts</Label><Input id="startsAt" name="startsAt" type="datetime-local" required /></div><div className="space-y-2"><Label htmlFor="endsAt">Class ends</Label><Input id="endsAt" name="endsAt" type="datetime-local" required /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="classType">Class type</Label><select id="classType" name="classType" className={selectClass} defaultValue="lecture"><option value="lecture">Lecture</option><option value="lab">Lab</option><option value="tutorial">Tutorial</option><option value="seminar">Seminar</option><option value="exam">Exam</option><option value="other">Other</option></select></div><div className="space-y-2"><Label htmlFor="room">Room / online room</Label><Input id="room" name="room" maxLength={60} /></div></div>
    <div className="space-y-2"><Label htmlFor="topic">Class topic</Label><Input id="topic" name="topic" maxLength={300} /></div>
    {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {!offerings.length && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No active course offering is assigned to you.</p>}
    <Button type="submit" disabled={loading || !offerings.length}>{loading && <LoaderCircle className="animate-spin" />}Create class session</Button>
  </form>
}
