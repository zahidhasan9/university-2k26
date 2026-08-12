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
    phone?: string
    avatarUrl?: string
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
  registrationNumber?: string
  admissionDate?: string
  admissionType?: "regular" | "transfer" | "credit_transfer"
  academicSession?: string
  campus?: string
  studentCategory?: "regular" | "improvement" | "retake"
  banglaName?: string
  nationality?: string
  religion?: string
  bloodGroup?: string
  maritalStatus?: string
  nidNumber?: string
  birthCertificateNumber?: string
  passportNumber?: string
  alternatePhone?: string
  universityEmail?: string
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
  permanentAddress?: Student["address"]
  parents?: {
    father?: { name?: string; profession?: string; phone?: string }
    mother?: { name?: string; profession?: string; phone?: string }
  }
  previousEducation?: Array<{ level: string; institution: string; board?: string; result: string; passingYear: number; rollNumber?: string; registrationNumber?: string }>
  documents?: Array<{ type: string; url: string; status: "pending" | "verified" | "rejected" }>
  waiverCategory?: string
  residentialStatus?: "day_scholar" | "hostel" | "other"
  hostelRequired?: boolean
  transportRequired?: boolean
  administrativeNotes?: string
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
