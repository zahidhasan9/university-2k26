import type { Metadata } from "next"

import { StudentForm } from "@/components/student-form"
import { StudentFormPage } from "@/components/student-form-page"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "Add student" }

type List<T> = { items: T[] }
type ProgramOption = { _id: string; name: string; code: string }
type SemesterOption = {
  _id: string
  name: string
  code: string
  academicYear: string
  status: string
}

export default async function NewStudentPage() {
  const [programs, semesters] = await Promise.all([
    authenticatedRequest<List<ProgramOption>>("/programs?status=active&limit=100"),
    authenticatedRequest<List<SemesterOption>>("/semesters?limit=100"),
  ])

  return (
    <StudentFormPage
      title="Add a new student"
      description="Provision a student account, academic identity, batch, and section."
      backHref="/dashboard/students"
    >
      <StudentForm
        programs={programs.data.items}
        semesters={semesters.data.items.filter((semester) => semester.status !== "archived")}
      />
    </StudentFormPage>
  )
}
