"use client"
import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"
type Department = { _id: string; name: string; code: string }
type Program = { _id: string; name: string; code: string; department: { _id: string } | string }
type Curriculum = {
  _id: string
  code: string
  name: string
  totalSemesters: number
  program: { _id: string } | string
}
const selectClass = "h-9 w-full rounded-lg border bg-background px-3 text-sm"
export function AcademicBatchForm({
  departments,
  programs,
  curricula,
  initialDepartmentId = "",
}: {
  departments: Department[]
  programs: Program[]
  curricula: Curriculum[]
  initialDepartmentId?: string
}) {
  const router = useRouter()
  const [departmentId, setDepartmentId] = useState(initialDepartmentId)
  const [programId, setProgramId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const availablePrograms = useMemo(
    () =>
      programs.filter(
        (program) =>
          (typeof program.department === "string" ? program.department : program.department._id) ===
          departmentId,
      ),
    [departmentId, programs],
  )
  const availableCurricula = useMemo(
    () =>
      curricula.filter(
        (curriculum) =>
          (typeof curriculum.program === "string" ? curriculum.program : curriculum.program._id) ===
          programId,
      ),
    [curricula, programId],
  )
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError("")
    const response = await apiResponseRequest(API_ENDPOINTS.academics.batches, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        departmentId,
        programId,
        curriculumId: form.get("curriculumId"),
        code: form.get("code"),
        name: form.get("name"),
        admissionYear: Number(form.get("admissionYear")),
        currentSemesterNumber: Number(form.get("currentSemesterNumber")),
      }),
    })
    const body = await response.json<{ message?: string; data?: { batch?: { _id: string } } }>()
    setLoading(false)
    if (!response.ok) return setError(body.message || "Batch could not be created")
    router.push(body.data?.batch?._id
      ? `/dashboard/academics/courses?${new URLSearchParams({ departmentId, batch: String(form.get("code")).toUpperCase(), programId, tab: "sections" })}`
      : `/dashboard/academics/courses?departmentId=${departmentId}`)
    router.refresh()
  }
  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Department</Label>
        <select
          className={selectClass}
          value={departmentId}
          onChange={(event) => {
            setDepartmentId(event.target.value)
            setProgramId("")
          }}
          required
        >
          <option value="" disabled>
            Select department
          </option>
          {departments.map((item) => (
            <option key={item._id} value={item._id}>
              {item.code} · {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Program</Label>
        <select
          className={selectClass}
          value={programId}
          onChange={(event) => setProgramId(event.target.value)}
          required
        >
          <option value="" disabled>
            Select program
          </option>
          {availablePrograms.map((item) => (
            <option key={item._id} value={item._id}>
              {item.code} · {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Published curriculum</Label>
        <select
          key={programId}
          name="curriculumId"
          className={selectClass}
          defaultValue=""
          required
        >
          <option value="" disabled>
            {programId ? "Select curriculum" : "Select program first"}
          </option>
          {availableCurricula.map((item) => (
            <option key={item._id} value={item._id}>
              {item.code} · {item.name}
            </option>
          ))}
        </select>
        {programId && !availableCurricula.length && (
          <p className="text-xs text-destructive">Publish a curriculum for this program first.</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Batch code</Label>
        <Input name="code" placeholder="CSE-49" required />
      </div>
      <div className="space-y-2">
        <Label>Display name</Label>
        <Input name="name" placeholder="CSE 49th Batch" required />
      </div>
      <div className="space-y-2">
        <Label>Admission year</Label>
        <Input
          name="admissionYear"
          type="number"
          min={1900}
          max={2200}
          defaultValue={new Date().getFullYear()}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Current semester</Label>
        <Input
          name="currentSemesterNumber"
          type="number"
          min={1}
          defaultValue={1}
          required
        />
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2">
          {error}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button disabled={loading || !availableCurricula.length}>
          {loading ? <LoaderCircle className="animate-spin" /> : <Save />} Create academic batch
        </Button>
      </div>
    </form>
  )
}
