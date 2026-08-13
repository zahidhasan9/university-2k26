import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import { InvoiceForm } from "@/components/finance-form"
import { FinanceFormShell } from "@/components/finance-form-shell"
import { authenticatedRequest } from "@/lib/auth"
type Semester = { _id: string; name: string; academicYear: string }
export default async function NewInvoicePage() {
  const semesters = await authenticatedRequest<{ items: Semester[] }>(
    withQuery(API_ENDPOINTS.academics.semesters, { limit: 100 }),
  )
  return (
    <FinanceFormShell
      title="Issue invoice"
      description="Generate a semester invoice from the student's active fee structure."
    >
      <InvoiceForm semesters={semesters.data.items} />
    </FinanceFormShell>
  )
}
