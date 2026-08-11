import { FeeStructureForm } from "@/components/fee-structure-form"
import { FinanceFormShell } from "@/components/finance-form-shell"
import { authenticatedRequest } from "@/lib/auth"
import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
type Option = { _id: string; name: string; code?: string; academicYear?: string }
export default async function NewFeeStructurePage() {
  const [programs, semesters] = await Promise.all([
    authenticatedRequest<{ items: Option[] }>(withQuery(API_ENDPOINTS.academics.programs, { status: "active", limit: 100 })),
    authenticatedRequest<{ items: Option[] }>(withQuery(API_ENDPOINTS.academics.semesters, { limit: 100 })),
  ])
  return (
    <FinanceFormShell
      title="Create fee structure"
      description="Define mandatory and optional charges for a program and semester."
    >
      <FeeStructureForm programs={programs.data.items} semesters={semesters.data.items} />
    </FinanceFormShell>
  )
}
