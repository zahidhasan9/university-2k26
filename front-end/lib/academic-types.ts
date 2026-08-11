export type AcademicEntity =
  "universities" | "faculties" | "departments" | "programs" | "courses" | "semesters"

export type AcademicItem = {
  _id: string
  name?: string
  title?: string
  code: string
  status: string
  description?: string
  shortName?: string
  email?: string
  phone?: string
  website?: string
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
  degreeType?: string
  durationYears?: number
  totalCredits?: number
  totalSemesters?: number
  credits?: number
  semesterNumber?: number
  theoryHoursPerWeek?: number
  labHoursPerWeek?: number
  courseType?: string
  academicYear?: string
  term?: string
  startsAt?: string
  endsAt?: string
  registrationStartsAt?: string
  registrationEndsAt?: string
  university?: { _id: string; name: string; code: string }
  faculty?: { _id: string; name: string; code: string }
  department?: { _id: string; name: string; code: string }
  program?: { _id: string; name: string; code: string }
}

export type AcademicList = {
  items: AcademicItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const academicEntities: {
  key: AcademicEntity
  label: string
  singular: string
  description: string
  shortcut: string
}[] = [
  {
    key: "universities",
    label: "Universities",
    singular: "University",
    description: "Institutional identity and campuses",
    shortcut: "01",
  },
  {
    key: "faculties",
    label: "Faculties",
    singular: "Faculty",
    description: "Top-level academic divisions",
    shortcut: "02",
  },
  {
    key: "departments",
    label: "Departments",
    singular: "Department",
    description: "Teaching and research departments",
    shortcut: "03",
  },
  {
    key: "programs",
    label: "Programs",
    singular: "Program",
    description: "Degrees, duration, and credit plans",
    shortcut: "04",
  },
  {
    key: "courses",
    label: "Courses",
    singular: "Course",
    description: "Curriculum and course catalog",
    shortcut: "05",
  },
  {
    key: "semesters",
    label: "Semesters",
    singular: "Semester",
    description: "Academic terms and timelines",
    shortcut: "06",
  },
]
