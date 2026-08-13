import type { CurrentUser } from "@/components/dashboard-header"
import { ApplicantHeader } from "@/components/applicant-header"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"

export default async function ApplicantPortalLayout({ children }: { children: React.ReactNode }) {
  const user = (await authenticatedRequest<{ user: CurrentUser }>(API_ENDPOINTS.auth.me)).data.user
  return (
    <div className="min-h-screen bg-slate-50">
      <ApplicantHeader name={`${user.firstName} ${user.lastName}`} />
      {children}
    </div>
  )
}
