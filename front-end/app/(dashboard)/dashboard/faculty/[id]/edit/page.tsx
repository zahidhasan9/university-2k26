import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AcademicFormShell } from "@/components/academic-form-shell"
import { TeacherForm } from "@/components/teacher-form"
import type { AcademicList } from "@/lib/academic-types"
import { authenticatedRequest } from "@/lib/auth"
import type { Teacher } from "@/lib/teacher-types"

export const metadata: Metadata = { title: "Edit teacher" }

export default async function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let teacher: Teacher
  let departments: AcademicList
  try {
    const responses = await Promise.all([
      authenticatedRequest<{ teacher: Teacher }>(API_ENDPOINTS.teachers.detail(id)),
      authenticatedRequest<AcademicList>(withQuery(API_ENDPOINTS.academics.departments, { status: "active", limit: 100 })),
    ])
    teacher = responses[0].data.teacher
    departments = responses[1].data
  } catch (error) {
    if (error instanceof Error && error.message === "Teacher not found") notFound()
    throw error
  }
  return (
    <AcademicFormShell
      title={`Edit ${teacher.user.firstName} ${teacher.user.lastName}`}
      description="Update department, designation, qualifications, and employment status."
      backHref="/dashboard/faculty"
    >
      <TeacherForm teacher={teacher} departments={departments.items} />
    </AcademicFormShell>
  )
}
