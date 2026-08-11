import { DashboardShell } from "@/components/dashboard-shell"
import { requireAccessToken } from "@/lib/auth"
import { authenticatedRequest } from "@/lib/auth"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import type { CurrentUser } from "@/components/dashboard-header"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAccessToken()
  const currentUser = (await authenticatedRequest<{ user: CurrentUser }>(API_ENDPOINTS.auth.me)).data.user
  return <DashboardShell currentUser={currentUser}>{children}</DashboardShell>
}
