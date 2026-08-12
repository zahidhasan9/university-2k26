"use client"
import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, LoaderCircle, Plus, Save, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmAction } from "@/components/ui/confirm-action"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"
type Course = {
  _id: string
  code: string
  title: string
  credits: number
  courseType: string
  theoryHoursPerWeek: number
  labHoursPerWeek: number
}
type Plan = { course: Course; semesterNumber: number; required: boolean }
const selectClass = "h-9 w-full rounded-lg border bg-background px-3 text-sm"
export function SemesterCourseEditor({
  curriculumId,
  programId,
  semesterNumber,
  initialPlans,
  allPlans,
  catalog,
}: {
  curriculumId: string
  programId: string
  semesterNumber: number
  initialPlans: Plan[]
  allPlans: Plan[]
  catalog: Course[]
}) {
  const router = useRouter()
  const [courses, setCourses] = useState(catalog)
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(initialPlans.map((plan) => [plan.course._id, plan.required])),
  )
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const usedElsewhere = useMemo(
    () =>
      new Set(
        allPlans
          .filter((plan) => plan.semesterNumber !== semesterNumber)
          .map((plan) => plan.course._id),
      ),
    [allPlans, semesterNumber],
  )
  const assigned = courses.filter((course) => selected[course._id] !== undefined)
  const available = courses.filter(
    (course) =>
      selected[course._id] === undefined &&
      !usedElsewhere.has(course._id) &&
      `${course.code} ${course.title}`.toLowerCase().includes(search.toLowerCase()),
  )
  const credits = assigned.reduce((sum, course) => sum + course.credits, 0)
  async function save() {
    setSaving(true)
    setError("")
    const retained = allPlans
      .filter((plan) => plan.semesterNumber !== semesterNumber)
      .map((plan) => ({
        courseId: plan.course._id,
        semesterNumber: plan.semesterNumber,
        required: plan.required,
      }))
    const current = assigned.map((course) => ({
      courseId: course._id,
      semesterNumber,
      required: selected[course._id],
    }))
    const response = await apiResponseRequest(
      API_ENDPOINTS.academics.curriculumDetail(curriculumId),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coursePlans: [...retained, ...current] }),
      },
    )
    const body = await response.json<{ message?: string }>()
    setSaving(false)
    if (!response.ok) return setError(body.message || "Semester could not be saved")
    router.push(`/dashboard/academics/curricula/${curriculumId}`)
    router.refresh()
  }
  async function removeSemesterPlan() {
    const retained = allPlans
      .filter((plan) => plan.semesterNumber !== semesterNumber)
      .map((plan) => ({
        courseId: plan.course._id,
        semesterNumber: plan.semesterNumber,
        required: plan.required,
      }))
    const response = await apiResponseRequest(
      API_ENDPOINTS.academics.curriculumDetail(curriculumId),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coursePlans: retained }),
      },
    )
    const body = await response.json<{ message?: string }>()
    if (!response.ok) throw new Error(body.message || "Semester plan could not be removed")
    router.push(`/dashboard/academics/curricula/${curriculumId}`)
    router.refresh()
  }
  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setError("")
    const response = await apiResponseRequest(API_ENDPOINTS.academics.courses, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programId,
        code: form.get("code"),
        title: form.get("title"),
        credits: Number(form.get("credits")),
        semesterNumber,
        theoryHoursPerWeek: Number(form.get("theoryHours")),
        labHoursPerWeek: Number(form.get("labHours")),
        courseType: form.get("courseType"),
        prerequisiteIds: [],
      }),
    })
    const body = await response.json<{ message?: string; data?: { course?: Course } }>()
    setSaving(false)
    const course = body.data?.course
    if (!response.ok || !course) return setError(body.message || "Course could not be created")
    setCourses((items) => [...items, course])
    setSelected((items) => ({ ...items, [course._id]: true }))
    setCreating(false)
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">{assigned.length}</p>
          <p className="text-sm text-muted-foreground">Courses</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">{credits}</p>
          <p className="text-sm text-muted-foreground">Credits</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">
            {assigned.filter((course) => course.courseType === "lab").length}
          </p>
          <p className="text-sm text-muted-foreground">Labs</p>
        </div>
      </div>
      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b p-4">
          <h2 className="font-semibold">Semester Plan {semesterNumber} course list</h2>
          <p className="text-sm text-muted-foreground">
            Remove courses or change required/optional status.
          </p>
        </div>
        <div className="divide-y">
          {assigned.map((course) => (
            <div key={course._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <BookOpen className="size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {course.code} · {course.title}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {course.credits} credits · {course.courseType} · Theory{" "}
                  {course.theoryHoursPerWeek}h · Lab {course.labHoursPerWeek}h
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected[course._id]}
                  onChange={(event) =>
                    setSelected((items) => ({ ...items, [course._id]: event.target.checked }))
                  }
                />{" "}
                Required
              </label>
              <ConfirmAction
                title={`Remove ${course.code}?`}
                description={`This course will be removed from Semester ${semesterNumber}. The catalog record will be preserved.`}
                confirmLabel="Remove course"
                triggerIcon={<Trash2 className="text-destructive" />}
                size="icon-sm"
                variant="ghost"
                onConfirm={() =>
                  setSelected((items) => {
                    const next = { ...items }
                    delete next[course._id]
                    return next
                  })
                }
              />
            </div>
          ))}
          {!assigned.length && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No courses added to this semester.
            </p>
          )}
        </div>
      </section>
      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="flex flex-col gap-3 border-b bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Add courses</h2>
            <p className="text-sm text-muted-foreground">
              Choose from catalog or create a new course.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Search catalog"
              />
            </div>
            <Button type="button" onClick={() => setCreating(true)}>
              <Plus /> New course
            </Button>
          </div>
        </div>
        {creating && (
          <form onSubmit={createCourse} className="border-b bg-blue-50/50 p-4">
            <div className="mb-3 flex justify-between">
              <p className="font-semibold">Create course</p>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setCreating(false)}
              >
                <X />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <Label>Code</Label>
                <Input name="code" required />
              </div>
              <div className="sm:col-span-2">
                <Label>Title</Label>
                <Input name="title" required />
              </div>
              <div>
                <Label>Type</Label>
                <select name="courseType" className={selectClass}>
                  <option value="core">Core</option>
                  <option value="lab">Lab</option>
                  <option value="elective">Elective</option>
                  <option value="general">General</option>
                  <option value="thesis">Thesis</option>
                </select>
              </div>
              <div>
                <Label>Credits</Label>
                <Input
                  name="credits"
                  type="number"
                  step={0.5}
                  min={0}
                  max={20}
                  defaultValue={3}
                  required
                />
              </div>
              <div>
                <Label>Theory hours</Label>
                <Input
                  name="theoryHours"
                  type="number"
                  min={0}
                  max={40}
                  defaultValue={3}
                  required
                />
              </div>
              <div>
                <Label>Lab hours</Label>
                <Input name="labHours" type="number" min={0} max={40} defaultValue={0} required />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button disabled={saving}>
                {saving ? <LoaderCircle className="animate-spin" /> : <Plus />} Create & add
              </Button>
            </div>
          </form>
        )}
        <div className="max-h-80 divide-y overflow-y-auto">
          {available.map((course) => (
            <div key={course._id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {course.code} · {course.title}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  {course.credits} credits · {course.courseType}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelected((items) => ({ ...items, [course._id]: true }))}
              >
                <Plus /> Add
              </Button>
            </div>
          ))}
          {!available.length && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No available courses found.
            </p>
          )}
        </div>
      </section>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <ConfirmAction
          title={`Remove Semester ${semesterNumber} plan?`}
          description="All courses assigned to this semester will be removed from the curriculum. Catalog courses and other semesters will remain unchanged."
          confirmLabel="Remove semester plan"
          triggerLabel="Remove semester"
          triggerIcon={<Trash2 />}
          disabled={!initialPlans.length}
          onConfirm={removeSemesterPlan}
        />
        <Button size="lg" onClick={() => void save()} disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : <Save />} Save Semester Plan{" "}
          {semesterNumber}
        </Button>
      </div>
    </div>
  )
}
