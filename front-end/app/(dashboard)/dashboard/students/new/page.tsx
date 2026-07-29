import type { Metadata } from "next"

import { StudentForm } from "@/components/student-form"
import { StudentFormPage } from "@/components/student-form-page"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "Add student" }

type List<T> = { items: T[] }
type UserOption = { _id: string; firstName: string; lastName: string; email: string }
type ProgramOption = { _id: string; name: string; code: string }
type SemesterOption = {
  _id: string
  name: string
  code: string
  academicYear: string
  status: string
}

export default async function NewStudentPage() {
  const [users, programs, semesters] = await Promise.all([
    authenticatedRequest<List<UserOption>>("/users?status=active&limit=100"),
    authenticatedRequest<List<ProgramOption>>("/programs?status=active&limit=100"),
    authenticatedRequest<List<SemesterOption>>("/semesters?limit=100"),
  ])

  return (
    <StudentFormPage
      title="Add a new student"
      description="Create a student profile from an existing active user account."
      backHref="/dashboard/students"
    >
      <StudentForm
        users={users.data.items}
        programs={programs.data.items}
        semesters={semesters.data.items.filter((semester) => semester.status !== "archived")}
      />
    </StudentFormPage>
  )
}
