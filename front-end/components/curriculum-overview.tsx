"use client"
import Link from "next/link"
import { useState } from "react"
import { ArrowRight, BookOpen, CheckCircle2, LoaderCircle, Plus, Send, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmAction } from "@/components/ui/confirm-action"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"
type Plan = { semesterNumber: number; required: boolean; course: { _id: string; credits: number } }
export function CurriculumOverview({
  curriculum,
}: {
  curriculum: {
    _id: string
    code: string
    totalSemesters: number
    status: string
    coursePlans: Plan[]
  }
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const semesters = Array.from({ length: curriculum.totalSemesters }, (_, index) => index + 1)
  const complete = semesters.every((number) =>
    curriculum.coursePlans.some((plan) => plan.semesterNumber === number),
  )
  async function publish() {
    setLoading(true)
    setError("")
    const response = await apiResponseRequest(
      API_ENDPOINTS.academics.curriculumDetail(curriculum._id),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      },
    )
    const body = await response.json<{ message?: string }>()
    setLoading(false)
    if (!response.ok) return setError(body.message || "Curriculum could not be published")
    window.location.reload()
  }
  async function addSemester() {
    setLoading(true)
    setError("")
    const response = await apiResponseRequest(
      API_ENDPOINTS.academics.curriculumDetail(curriculum._id),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalSemesters: curriculum.totalSemesters + 1 }),
      },
    )
    const body = await response.json<{ message?: string }>()
    setLoading(false)
    if (!response.ok) return setError(body.message || "Semester could not be added")
    window.location.reload()
  }
  async function removeSemester(semesterNumber: number) {
    const coursePlans = curriculum.coursePlans
      .filter((plan) => plan.semesterNumber !== semesterNumber)
      .map((plan) => ({
        courseId: plan.course._id,
        semesterNumber:
          plan.semesterNumber > semesterNumber ? plan.semesterNumber - 1 : plan.semesterNumber,
        required: plan.required,
      }))
    const response = await apiResponseRequest(
      API_ENDPOINTS.academics.curriculumDetail(curriculum._id),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalSemesters: curriculum.totalSemesters - 1, coursePlans }),
      },
    )
    const body = await response.json<{ message?: string }>()
    if (!response.ok) throw new Error(body.message || "Semester could not be removed")
    window.location.reload()
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Semester plan progress</p>
          <p className="text-sm text-muted-foreground">
            Open each semester to add or remove its courses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={curriculum.status === "active" ? "default" : "secondary"}
            className="capitalize"
          >
            {curriculum.status}
          </Badge>
          {curriculum.status !== "archived" && (
              <Button variant="outline" onClick={() => void addSemester()} disabled={loading}>
                <Plus /> Add Semester Plan {curriculum.totalSemesters + 1}
              </Button>
            )}
          {curriculum.status === "draft" && (
            <Button onClick={() => void publish()} disabled={loading || !complete}>
              {loading ? <LoaderCircle className="animate-spin" /> : <Send />} Publish curriculum
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {semesters.map((number) => {
          const plans = curriculum.coursePlans.filter((plan) => plan.semesterNumber === number)
          const credits = plans.reduce((sum, plan) => sum + plan.course.credits, 0)
          return (
            <article
              key={number}
              className="rounded-xl border bg-white p-5 transition hover:border-primary/30 hover:shadow-md"
            >
              <Link
                href={`/dashboard/academics/curricula/${curriculum._id}/semesters/${number}`}
                className="group block"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-lg bg-blue-50 font-bold text-blue-700">
                    {number}
                  </span>
                  {plans.length ? (
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  ) : (
                    <Badge variant="outline">Not planned</Badge>
                  )}
                </div>
                <h2 className="mt-4 text-lg font-bold">Semester Plan {number}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plans.length} courses · {credits} credits
                </p>
                <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">
                  Manage courses{" "}
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
              {curriculum.status !== "archived" && curriculum.totalSemesters > 1 && (
                <div className="mt-4 border-t pt-3">
                  <ConfirmAction
                    title={`Remove Semester ${number}?`}
                    description={`Courses in Semester ${number} will be detached. Later semesters will be renumbered and the curriculum will have ${curriculum.totalSemesters - 1} semesters.${curriculum.status === "active" ? " Assigned batches will be updated after compatibility checks." : ""}`}
                    confirmLabel="Remove semester"
                    triggerLabel="Remove semester"
                    triggerIcon={<Trash2 />}
                    variant="ghost"
                    onConfirm={() => removeSemester(number)}
                  />
                </div>
              )}
            </article>
          )
        })}
      </section>
      {!complete && curriculum.status === "draft" && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <BookOpen className="size-4" /> Add at least one course to every semester before
          publishing.
        </p>
      )}
    </div>
  )
}
