"use client"
import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"
type Program = {
  _id: string
  code: string
  name: string
  totalSemesters: number
  department: { _id: string } | string
}
type Course = {
  _id: string
  code: string
  title: string
  credits: number
  semesterNumber: number
  courseType: string
  program: { _id: string } | string
}
const selectClass = "h-9 w-full rounded-lg border bg-background px-3 text-sm"
export function CurriculumForm({
  programs,
  initialDepartmentId,
}: {
  programs: Program[]
  courses: Course[]
  initialDepartmentId?: string
}) {
  const router = useRouter()
  const [programId, setProgramId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const availablePrograms = useMemo(
    () =>
      programs.filter(
        (program) =>
          !initialDepartmentId ||
          (typeof program.department === "string" ? program.department : program.department._id) ===
            initialDepartmentId,
      ),
    [initialDepartmentId, programs],
  )
  const program = programs.find((item) => item._id === programId)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError("")
    try {
      const response = await apiResponseRequest(API_ENDPOINTS.academics.curricula, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          code: form.get("code"),
          name: form.get("name"),
          effectiveYear: Number(form.get("effectiveYear")),
          totalSemesters: Number(form.get("totalSemesters")),
          coursePlans: [],
        }),
      })
      const body = await response.json<{
        message?: string
        data?: { curriculum?: { _id: string } }
      }>()
      const id = body.data?.curriculum?._id
      if (!response.ok || !id) return setError(body.message || "Curriculum could not be created")
      router.push(`/dashboard/academics/curricula/${id}`)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Curriculum could not be created")
    } finally {
      setLoading(false)
    }
  }
  return (
    <form onSubmit={submit} className="space-y-7">
      <section className="rounded-xl border bg-muted/20 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Create curriculum draft</h2>
          <p className="text-sm text-muted-foreground">
            Set the identity first. You will configure every semester on its own page.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
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
            <Label>Curriculum code</Label>
            <Input name="code" placeholder="CE-2026-V1" required />
          </div>
          <div className="space-y-2">
            <Label>Curriculum name</Label>
            <Input name="name" placeholder="Civil Engineering Curriculum 2026" required />
          </div>
          <div className="space-y-2">
            <Label>Effective year</Label>
            <Input
              name="effectiveYear"
              type="number"
              min={1900}
              max={2200}
              defaultValue={new Date().getFullYear()}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Total semesters</Label>
            <Input
              name="totalSemesters"
              type="number"
              min={1}
              defaultValue={program?.totalSemesters ?? 8}
              key={programId}
              required
            />
          </div>
        </div>
      </section>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={loading || !programId}>
          {loading ? <LoaderCircle className="animate-spin" /> : <ArrowRight />} Create draft & plan
          semesters
        </Button>
      </div>
    </form>
  )
}
