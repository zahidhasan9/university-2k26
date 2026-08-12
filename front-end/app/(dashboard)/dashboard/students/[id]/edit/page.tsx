import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { StudentForm } from "@/components/student-form"
import { StudentFormPage } from "@/components/student-form-page"
import { authenticatedRequest } from "@/lib/auth"
import type { Student } from "@/lib/student-types"

export const metadata: Metadata = { title: "Edit student" }

type List<T> = { items: T[] }
type ProgramOption = { _id: string; name: string; code: string }
type BatchOption = { _id: string; code: string; name: string; curriculumVersion: string; program: { _id: string } | string }
type SectionOption = { _id: string; code: string; name: string; capacity: number; enrolledCount: number; academicBatch: { _id: string } | string }

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let student: Student
  let programs: List<ProgramOption>
  let batches: List<BatchOption>
  let sections: List<SectionOption>
  try {
    const [studentResponse, programResponse, batchResponse, sectionResponse] = await Promise.all([
      authenticatedRequest<{ student: Student }>(API_ENDPOINTS.students.detail(id)),
      authenticatedRequest<List<ProgramOption>>(withQuery(API_ENDPOINTS.academics.programs, { status: "active", limit: 100 })),
      authenticatedRequest<List<BatchOption>>(withQuery(API_ENDPOINTS.academics.batches, { status: "active", limit: 100 })),
      authenticatedRequest<List<SectionOption>>(withQuery(API_ENDPOINTS.academics.sections, { status: "active", limit: 500 })),
    ])
    student = studentResponse.data.student
    programs = programResponse.data
    batches = batchResponse.data
    sections = sectionResponse.data
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") notFound()
    throw error
  }
  return (
    <StudentFormPage
      title={`Edit ${student.user.firstName} ${student.user.lastName}`}
      description="Update academic, personal, guardian, and address information."
      backHref={`/dashboard/students/${id}`}
    >
      <StudentForm student={student} programs={programs.items} batches={batches.items} sections={sections.items} />
    </StudentFormPage>
  )
}
