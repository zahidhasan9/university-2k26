export type TeacherStatus = "active" | "on_leave" | "retired" | "resigned" | "archived"
export type Teacher = {
  _id: string
  employeeId: string
  user: { _id: string; firstName: string; lastName: string; email: string; avatarUrl?: string; status: string }
  department: { _id: string; name: string; code: string }
  designation: "lecturer" | "assistant_professor" | "associate_professor" | "professor" | "adjunct"
  joiningDate: string
  employmentType?: "permanent" | "contractual" | "adjunct" | "visiting"
  campus?: string
  officeRoom?: string
  officialEmail?: string
  confirmationDate?: string
  maxWeeklyHours?: number
  phone?: string
  specialization: string[]
  researchInterests?: string[]
  certifications?: string[]
  links?: { orcid?: string; googleScholar?: string; website?: string }
  documents?: Array<{ type: string; url: string; status: "pending" | "verified" | "rejected" }>
  qualifications: { degree: string; institution: string; year?: number }[]
  status: TeacherStatus
  createdAt: string
  activeCourseCount?: number
}
export type TeacherList = {
  items: Teacher[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}
