import { WaiverForm } from "@/components/waiver-form"
import { FinanceFormShell } from "@/components/finance-form-shell"
export default async function NewWaiverPage() {
  return <FinanceFormShell title="Assign student waiver" description="Create a dated tuition or full-invoice scholarship for a student."><WaiverForm /></FinanceFormShell>
}
