import { DashboardShell } from "@/components/dashboard-shell"
import { requireAccessToken } from "@/lib/auth"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAccessToken()
  return <DashboardShell>{children}</DashboardShell>
}
