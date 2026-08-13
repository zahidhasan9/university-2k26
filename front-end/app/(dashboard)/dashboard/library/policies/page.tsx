import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { PolicyForm } from "@/components/library-forms"
import { LibraryFormShell } from "@/components/library-form-shell"
import { authenticatedRequest } from "@/lib/auth"
type Policy = {
  borrowerType: "student" | "teacher"
  maxActiveLoans: number
  loanDays: number
  finePerDayMinor: number
  currency: string
}
export default async function LibraryPoliciesPage() {
  const policies = (
    await authenticatedRequest<{ policies: Policy[] }>(API_ENDPOINTS.library.policies)
  ).data.policies
  return (
    <LibraryFormShell
      title="Borrowing policies"
      description="Configure loan limits, duration, and overdue fines."
    >
      <div className="space-y-8">
        {(["student", "teacher"] as const).map((type) => (
          <div key={type}>
            <h2 className="mb-4 text-lg font-semibold capitalize">{type} policy</h2>
            <PolicyForm
              borrowerType={type}
              defaults={policies.find((item) => item.borrowerType === type)}
            />
          </div>
        ))}
      </div>
    </LibraryFormShell>
  )
}
