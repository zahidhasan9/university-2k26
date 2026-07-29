import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { StudentForm } from "@/components/student-form"
import { StudentFormPage } from "@/components/student-form-page"
import { authenticatedRequest } from "@/lib/auth"
import type { Student } from "@/lib/student-types"

export const metadata: Metadata = { title: "Edit student" }

type List<T> = { items: T[] }
type ProgramOption = { _id: string; name: string; code: string }

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let student: Student
  let programs: List<ProgramOption>
  try {
    const [studentResponse, programResponse] = await Promise.all([
      authenticatedRequest<{ student: Student }>(`/students/${id}`),
      authenticatedRequest<List<ProgramOption>>("/programs?status=active&limit=100"),
    ])
    student = studentResponse.data.student
    programs = programResponse.data
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
      <StudentForm student={student} programs={programs.items} />
    </StudentFormPage>
  )
}
