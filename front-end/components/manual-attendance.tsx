"use client"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
type Student = { _id: string; studentId: string; user: { firstName: string; lastName: string; email: string } }
type Existing = { student: Student; status: string; note?: string }
export function ManualAttendance({ sessionId, students, existing, open }: { sessionId: string; students: Student[]; existing: Existing[]; open: boolean }) {
  const router = useRouter(), [loading, setLoading] = useState(false), [error, setError] = useState("")
  if (!open) return null
  const previous = new Map(existing.map((item) => [item.student._id, item]))
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const records = students.map((student) => ({ studentId: student._id, status: String(form.get(`status-${student._id}`)), note: String(form.get(`note-${student._id}`) ?? "").trim() || undefined }))
    setLoading(true); setError("")
    const response = await fetch(`/api/backend/attendance/${sessionId}/records`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records }) })
    const body = await response.json(); setLoading(false)
    if (!response.ok) return setError(body.message || "Attendance could not be saved")
    router.refresh()
  }
  return <form onSubmit={submit} className="rounded-xl border"><div className="flex items-center justify-between border-b p-4"><div><p className="font-semibold">Manual attendance</p><p className="text-xs text-muted-foreground">{students.length} enrolled students</p></div><Button type="submit" disabled={loading || !students.length}>{loading ? <LoaderCircle className="animate-spin" /> : <Save />}Save attendance</Button></div><div className="max-h-[520px] divide-y overflow-y-auto">{students.map((student) => { const record = previous.get(student._id); return <div key={student._id} className="grid gap-3 p-4 sm:grid-cols-[1fr_150px_220px] sm:items-center"><div><p className="font-medium">{student.user.firstName} {student.user.lastName}</p><p className="text-xs text-muted-foreground">{student.studentId} · {student.user.email}</p></div><select name={`status-${student._id}`} defaultValue={record?.status ?? "present"} className="h-9 rounded-lg border bg-background px-3 text-sm"><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="excused">Excused</option></select><input name={`note-${student._id}`} defaultValue={record?.note} className="h-9 rounded-lg border bg-background px-3 text-sm" placeholder="Optional note" /></div>})}</div>{error && <p className="border-t bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}</form>
}
