import { AcademicFormShell } from "@/components/academic-form-shell"
import { CurriculumForm } from "@/components/curriculum-form"
import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"
type List<T> = { items: T[] }
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
export default async function NewCurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string }>
}) {
  const { departmentId = "" } = await searchParams
  const [programs, courses] = await Promise.all([
    authenticatedRequest<List<Program>>(
      withQuery(API_ENDPOINTS.academics.programs, { status: "active", limit: 100 }),
    ),
    authenticatedRequest<List<Course>>(
      withQuery(API_ENDPOINTS.academics.courses, { status: "active", limit: 500 }),
    ),
  ])
  return (
    <AcademicFormShell
      title="Design curriculum"
      description="Create a reusable, versioned semester plan from the program course catalog."
      backHref={`/dashboard/academics/courses${departmentId ? `?departmentId=${departmentId}` : ""}`}
    >
      <CurriculumForm
        programs={programs.data.items}
        courses={courses.data.items}
        initialDepartmentId={departmentId}
      />
    </AcademicFormShell>
  )
}
