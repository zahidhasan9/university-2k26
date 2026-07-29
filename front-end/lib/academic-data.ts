import type { AcademicEntity, AcademicItem, AcademicList } from "@/lib/academic-types"
import { authenticatedRequest } from "@/lib/auth"

export const entityResponseKey: Record<AcademicEntity, string> = {
  universities: "university",
  faculties: "faculty",
  departments: "department",
  programs: "program",
  courses: "course",
  semesters: "semester",
}

export async function academicOptions(entity: AcademicEntity) {
  const parentEndpoint: Partial<Record<AcademicEntity, "universities" | "faculties" | "departments" | "programs">> = {
    faculties: "universities",
    departments: "faculties",
    programs: "departments",
    courses: "programs",
    semesters: "universities",
  }
  const parent = parentEndpoint[entity]
  if (!parent) return {}
  const response = await authenticatedRequest<AcademicList>(`/${parent}?status=active&limit=100`)
  return { [parent]: response.data.items }
}

export async function academicItem(entity: AcademicEntity, id: string) {
  const response = await authenticatedRequest<Record<string, AcademicItem>>(`/${entity}/${id}`)
  return response.data[entityResponseKey[entity]]
}
