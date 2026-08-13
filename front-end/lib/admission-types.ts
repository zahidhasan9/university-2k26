export type AdmissionStatus =
  "draft" | "submitted" | "under_review" | "approved" | "rejected" | "cancelled"

export type Admission = {
  _id: string
  applicationNumber: string
  applicant: {
    _id: string
    firstName: string
    lastName: string
    email: string
    status: string
  }
  program: { _id: string; name: string; code: string }
  intakeSemester: {
    _id: string
    name: string
    code: string
    academicYear: string
    status: string
  }
  personal: {
    phone: string
    dateOfBirth: string
    gender: "male" | "female" | "other" | "prefer_not_to_say"
    nationality: string
    presentAddress: string
    permanentAddress: string
  }
  guardian: { name: string; relationship: string; phone: string; email?: string }
  statement?: string
  previousEducation: {
    _id?: string
    level: string
    institution: string
    result: string
    passingYear: number
  }[]
  documents: {
    _id: string
    type: string
    url: string
    verifiedAt?: string
  }[]
  status: AdmissionStatus
  submittedAt?: string
  reviewedBy?: { _id: string; firstName: string; lastName: string; email: string }
  reviewedAt?: string
  reviewNote?: string
  createdAt: string
  updatedAt: string
}

export type AdmissionOptions = {
  programs: Array<{
    _id: string
    name: string
    code: string
    degreeType: string
    durationYears: number
    totalCredits: number
    department: { _id: string; name: string; code: string }
  }>
  intakes: Array<{
    _id: string
    name: string
    code: string
    academicYear: string
    term: string
    registrationEndsAt: string
    status: string
  }>
}

export type AdmissionListData = {
  items: Admission[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}
