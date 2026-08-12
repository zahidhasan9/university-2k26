import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SemesterCourseEditor } from "@/components/semester-course-editor"
import { Button } from "@/components/ui/button"
import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"
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
type Curriculum = {
  _id: string
  code: string
  name: string
  totalSemesters: number
  program: { _id: string; code: string; name: string }
  coursePlans: Plan[]
}
export default async function SemesterPage({
  params,
}: {
  params: Promise<{ id: string; semester: string }>
}) {
  const { id, semester } = await params
  const semesterNumber = Number(semester)
  const curriculum = (
    await authenticatedRequest<{ curriculum: Curriculum }>(
      API_ENDPOINTS.academics.curriculumDetail(id),
    )
  ).data.curriculum
  if (
    !Number.isInteger(semesterNumber) ||
    semesterNumber < 1 ||
    semesterNumber > curriculum.totalSemesters
  )
    throw new Error("Invalid curriculum semester")
  const catalog = (
    await authenticatedRequest<{ items: Course[] }>(
      withQuery(API_ENDPOINTS.academics.courses, {
        parentId: curriculum.program._id,
        status: "active",
        limit: 500,
      }),
    )
  ).data.items
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button variant="ghost" render={<Link href={`/dashboard/academics/curricula/${id}`} />}>
        <ArrowLeft /> All semester plans
      </Button>
      <div>
        <p className="text-sm font-semibold text-primary">
          {curriculum.program.code} · {curriculum.code}
        </p>
        <h1 className="mt-1 text-3xl font-bold">Semester Plan {semesterNumber}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add, remove and organise courses for this semester.
        </p>
      </div>
      <SemesterCourseEditor
        curriculumId={id}
        programId={curriculum.program._id}
        semesterNumber={semesterNumber}
        initialPlans={curriculum.coursePlans.filter(
          (plan) => plan.semesterNumber === semesterNumber,
        )}
        allPlans={curriculum.coursePlans}
        catalog={catalog}
      />
    </div>
  )
}
