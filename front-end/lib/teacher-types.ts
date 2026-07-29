export type TeacherStatus = "active" | "on_leave" | "retired" | "resigned" | "archived"
export type Teacher = {
  _id: string
  employeeId: string
  user: { _id: string; firstName: string; lastName: string; email: string; status: string }
  department: { _id: string; name: string; code: string }
  designation: "lecturer" | "assistant_professor" | "associate_professor" | "professor" | "adjunct"
  joiningDate: string
  phone?: string
  specialization: string[]
  qualifications: { degree: string; institution: string; year?: number }[]
  status: TeacherStatus
  createdAt: string
}
export type TeacherList = {
  items: Teacher[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}
