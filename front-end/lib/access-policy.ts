export const ROLE_PRIORITY = [
  "super_admin",
  "university_admin",
  "registrar",
  "department_head",
  "teacher",
  "student",
  "accountant",
  "librarian",
  "hr_manager",
  "admission_officer",
] as const

export type SystemRole = (typeof ROLE_PRIORITY)[number]

export function primaryRole(roles: Array<{ code?: string }>): SystemRole | "custom" {
  const assigned = new Set(roles.map((role) => role.code))
  return ROLE_PRIORITY.find((role) => assigned.has(role)) ?? "custom"
}

export function hasAnyPermission(userPermissions: string[], required?: string[]) {
  return !required?.length || required.some((permission) => userPermissions.includes(permission))
}

export const ROLE_LABELS: Record<SystemRole | "custom", string> = {
  super_admin: "Super administration",
  university_admin: "University administration",
  registrar: "Registrar workspace",
  department_head: "Department workspace",
  teacher: "Teaching workspace",
  student: "Student portal",
  accountant: "Finance workspace",
  librarian: "Library workspace",
  hr_manager: "HR workspace",
  admission_officer: "Admissions workspace",
  custom: "Workspace",
}
