import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { requireAccessToken } from "@/lib/auth"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAccessToken()
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[272px] lg:block">
        <AppSidebar />
      </div>
      <div className="lg:col-start-2">
        <DashboardHeader />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
