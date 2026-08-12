import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import type { Metadata } from "next"

import { StudentForm } from "@/components/student-form"
import { StudentFormPage } from "@/components/student-form-page"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "Add student" }

type List<T> = { items: T[] }
type ProgramOption = { _id: string; name: string; code: string }
type BatchOption = { _id: string; code: string; name: string; curriculumVersion: string; program: { _id: string } | string }
type SectionOption = { _id: string; code: string; name: string; capacity: number; enrolledCount: number; academicBatch: { _id: string } | string }
type SemesterOption = {
  _id: string
  name: string
  code: string
  academicYear: string
  status: string
}

export default async function NewStudentPage() {
  const [programs, semesters, batches, sections] = await Promise.all([
    authenticatedRequest<List<ProgramOption>>(withQuery(API_ENDPOINTS.academics.programs, { status: "active", limit: 100 })),
    authenticatedRequest<List<SemesterOption>>(withQuery(API_ENDPOINTS.academics.semesters, { limit: 100 })),
    authenticatedRequest<List<BatchOption>>(withQuery(API_ENDPOINTS.academics.batches, { status: "active", limit: 100 })),
    authenticatedRequest<List<SectionOption>>(withQuery(API_ENDPOINTS.academics.sections, { status: "active", limit: 500 })),
  ])

  return (
    <StudentFormPage
      title="Add a new student"
      description="Provision a student account, academic identity, batch, and section."
      backHref="/dashboard/students"
    >
      <StudentForm
        programs={programs.data.items}
        batches={batches.data.items}
        sections={sections.data.items}
        semesters={semesters.data.items.filter((semester) => semester.status !== "archived")}
      />
    </StudentFormPage>
  )
}
