import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import type { Metadata } from "next"

import { AcademicFormShell } from "@/components/academic-form-shell"
import { TeacherForm } from "@/components/teacher-form"
import type { AcademicList } from "@/lib/academic-types"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "Add teacher" }
type Users = { items: { _id: string; firstName: string; lastName: string; email: string }[] }

export default async function NewTeacherPage() {
  const [users, departments] = await Promise.all([
    authenticatedRequest<Users>(withQuery(API_ENDPOINTS.users.list, { status: "active", limit: 100 })),
    authenticatedRequest<AcademicList>(withQuery(API_ENDPOINTS.academics.departments, { status: "active", limit: 100 })),
  ])
  return (
    <AcademicFormShell
      title="Add faculty member"
      description="Connect an active user account and create the academic employment profile."
      backHref="/dashboard/faculty"
    >
      <TeacherForm users={users.data.items} departments={departments.data.items} />
    </AcademicFormShell>
  )
}
