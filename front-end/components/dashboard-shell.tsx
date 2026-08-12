"use client"

import { useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import type { CurrentUser } from "@/components/dashboard-header"
import { cn } from "@/lib/utils"

export function DashboardShell({ children, currentUser }: { children: React.ReactNode; currentUser: CurrentUser }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <DashboardHeader
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
        initialUser={currentUser}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden pt-[72px] transition-[width] duration-300 lg:block",
          sidebarCollapsed ? "w-[88px]" : "w-[264px]",
        )}
      >
        <AppSidebar collapsed={sidebarCollapsed} permissions={currentUser.permissions} roles={currentUser.roles} />
      </div>
      <main
        className={cn(
          "min-w-0 px-4 pb-8 pt-[96px] transition-[margin] duration-300 sm:px-7 lg:px-10 lg:pt-[112px] xl:px-12",
          sidebarCollapsed ? "lg:ml-[88px]" : "lg:ml-[264px]",
        )}
      >
        {children}
      </main>
    </div>
  )
}
