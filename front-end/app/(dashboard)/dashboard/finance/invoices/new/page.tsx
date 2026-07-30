import { InvoiceForm } from "@/components/finance-form"
import { FinanceFormShell } from "@/components/finance-form-shell"
import { authenticatedRequest } from "@/lib/auth"
type Student = { _id: string; studentId: string; user: { firstName: string; lastName: string } }
type Semester = { _id: string; name: string; academicYear: string }
export default async function NewInvoicePage() {
  const [students, semesters] = await Promise.all([
    authenticatedRequest<{ items: Student[] }>("/students?status=active&limit=100"),
    authenticatedRequest<{ items: Semester[] }>("/semesters?limit=100"),
  ])
  return (
    <FinanceFormShell
      title="Issue invoice"
      description="Generate a semester invoice from the student's active fee structure."
    >
      <InvoiceForm students={students.data.items} semesters={semesters.data.items} />
    </FinanceFormShell>
  )
}
