import { AcademicBatchForm } from "@/components/academic-batch-form"
import { AcademicFormShell } from "@/components/academic-form-shell"
import { authenticatedRequest } from "@/lib/auth"
import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
type Department = { _id: string; name: string; code: string }
type Program = { _id: string; name: string; code: string; department: { _id: string } | string }
type Curriculum = { _id: string; code: string; name: string; totalSemesters: number; program: { _id: string } | string }
export default async function NewBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string }>
}) {
  const { departmentId = "" } = await searchParams
  const [departments, programs, curricula] = await Promise.all([
    authenticatedRequest<{ items: Department[] }>(
      withQuery(API_ENDPOINTS.academics.departments, { status: "active", limit: 100 }),
    ),
    authenticatedRequest<{ items: Program[] }>(
      withQuery(API_ENDPOINTS.academics.programs, { status: "active", limit: 100 }),
    ),
    authenticatedRequest<{ items: Curriculum[] }>(withQuery(API_ENDPOINTS.academics.curricula, { status: "active", limit: 100 })),
  ])
  const backHref = `/dashboard/academics/courses${departmentId ? `?departmentId=${departmentId}` : ""}`
  return (
    <AcademicFormShell
      title="Create academic batch"
      description="Assign a permanent batch to a published curriculum."
      backHref={backHref}
    >
      <AcademicBatchForm
        departments={departments.data.items}
        programs={programs.data.items}
        curricula={curricula.data.items}
        initialDepartmentId={departmentId}
      />
    </AcademicFormShell>
  )
}
