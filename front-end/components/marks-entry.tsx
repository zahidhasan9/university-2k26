"use client"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
type Student = { _id: string; studentId: string; user: { firstName: string; lastName: string } }
type Mark = { student: Student; marksObtained: number; absent: boolean; note?: string }
export function MarksEntry({ examId, totalMarks, students, existing }: { examId: string; totalMarks: number; students: Student[]; existing: Mark[] }) {
  const router = useRouter(), [loading, setLoading] = useState(false), [error, setError] = useState("")
  const previous = new Map(existing.map((mark) => [mark.student._id, mark]))
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    const marks = students.map((student) => { const absent = form.get(`absent-${student._id}`) === "on"; return { studentId: student._id, marksObtained: absent ? 0 : Number(form.get(`marks-${student._id}`)), absent, note: String(form.get(`note-${student._id}`) ?? "").trim() || undefined } })
    setLoading(true); setError("")
    const response = await fetch(`/api/backend/exams/${examId}/marks`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marks }) })
    const body = await response.json(); setLoading(false)
    if (!response.ok) return setError(body.message || "Marks could not be saved")
    router.refresh()
  }
  return <form onSubmit={submit} className="rounded-xl border"><div className="flex items-center justify-between border-b p-4"><div><p className="font-semibold">Marks roster</p><p className="text-xs text-muted-foreground">{students.length} students · maximum {totalMarks}</p></div><Button type="submit" disabled={loading || !students.length}>{loading ? <LoaderCircle className="animate-spin" /> : <Save />}Save marks</Button></div><div className="max-h-[600px] divide-y overflow-y-auto">{students.map((student) => { const mark = previous.get(student._id); return <div key={student._id} className="grid gap-3 p-4 sm:grid-cols-[1fr_110px_90px_180px] sm:items-center"><div><p className="font-medium">{student.user.firstName} {student.user.lastName}</p><p className="font-mono text-xs text-muted-foreground">{student.studentId}</p></div><input name={`marks-${student._id}`} type="number" min={0} max={totalMarks} step={0.01} required defaultValue={mark?.marksObtained ?? 0} className="h-9 rounded-lg border px-3 text-sm" /><label className="flex items-center gap-2 text-sm"><input name={`absent-${student._id}`} type="checkbox" defaultChecked={mark?.absent} /> Absent</label><input name={`note-${student._id}`} defaultValue={mark?.note} placeholder="Optional note" className="h-9 rounded-lg border px-3 text-sm" /></div>})}</div>{error && <p className="border-t bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}</form>
}
