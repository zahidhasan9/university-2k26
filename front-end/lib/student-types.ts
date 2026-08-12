export type StudentStatus = "active" | "graduated" | "suspended" | "withdrawn" | "archived"

export type Student = {
  _id: string
  studentId: string
  batch: string
  academicBatch?: {
    _id: string
    code: string
    name: string
    curriculumVersion: string
    status: string
  }
  section: string
  academicSection?: {
    _id: string
    code: string
    name: string
    capacity: number
    enrolledCount: number
    shift: string
    status: string
  }
  user: {
    _id: string
    firstName: string
    lastName: string
    email: string
    status: string
  }
  program: {
    _id: string
    name: string
    code: string
    department?: { _id: string; name: string; code: string }
  }
  admissionSemester: {
    _id: string
    name: string
    code: string
    academicYear: string
  }
  currentSemesterNumber: number
  status: StudentStatus
  phone?: string
  dateOfBirth?: string
  gender?: string
  guardian?: {
    name?: string
    relationship?: string
    phone?: string
    email?: string
  }
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
  createdAt: string
  updatedAt: string
}

export type StudentListData = {
  items: Student[]
  filters?: {
    batches: string[]
    sections?: string[]
  }
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
