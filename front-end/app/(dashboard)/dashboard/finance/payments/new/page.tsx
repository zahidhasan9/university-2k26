import { PaymentForm } from "@/components/finance-form"
import { FinanceFormShell } from "@/components/finance-form-shell"
import { authenticatedRequest } from "@/lib/auth"
type Student = { _id: string; studentId: string; user: { firstName: string; lastName: string } }
type Invoice = {
  _id: string
  invoiceNumber: string
  currency: string
  dueMinor: number
  student: Student
  status: string
}
export default async function NewPaymentPage() {
  const data = (
    await authenticatedRequest<{ items: Invoice[] }>("/finance/invoices?limit=100")
  ).data.items.filter((item) => item.dueMinor > 0 && !["void", "paid"].includes(item.status))
  return (
    <FinanceFormShell
      title="Collect payment"
      description="Record a verified payment against an outstanding invoice."
    >
      <PaymentForm invoices={data} />
    </FinanceFormShell>
  )
}
