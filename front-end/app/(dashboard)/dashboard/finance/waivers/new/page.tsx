import { WaiverForm } from "@/components/waiver-form"
import { FinanceFormShell } from "@/components/finance-form-shell"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"

type Student = { _id: string; studentId: string; user: { firstName: string; lastName: string } }
export default async function NewWaiverPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  const { studentId } = await searchParams
  let student: Student | undefined
  if (studentId) try { student = (await authenticatedRequest<{ student: Student }>(API_ENDPOINTS.students.detail(studentId))).data.student } catch { student = undefined }
  return <FinanceFormShell title="Assign student waiver" description="Create a dated tuition or full-invoice scholarship for a student."><WaiverForm initialStudent={student} /></FinanceFormShell>
}
