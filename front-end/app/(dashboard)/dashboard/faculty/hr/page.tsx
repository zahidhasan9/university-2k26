import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Banknote, CalendarCheck, ClipboardList, UserCog } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "HR workspace" }
const modules = [
  { key: "employees", label: "Employees", endpoint: "/hr/employees?limit=1", href: "/dashboard/faculty/hr/employees", icon: UserCog, description: "Employment records and contracts" },
  { key: "attendance", label: "Attendance", endpoint: "/hr/attendance", href: "/dashboard/faculty/hr/attendance", icon: CalendarCheck, description: "Daily staff attendance records" },
  { key: "leaves", label: "Leave requests", endpoint: "/hr/leaves", href: "/dashboard/faculty/hr/leaves", icon: ClipboardList, description: "Leave review and approval queue" },
  { key: "payrollRuns", label: "Payroll runs", endpoint: "/hr/payroll-runs", href: "/dashboard/faculty/hr/payroll", icon: Banknote, description: "Salary processing and payslips" },
]

export default async function HrWorkspacePage() {
  const counts = await Promise.all(modules.map(async (module) => {
    try {
      const data = (await authenticatedRequest<Record<string, unknown>>(module.endpoint)).data
      if (module.key === "employees") return (data.pagination as { total: number }).total
      return (data[module.key] as unknown[]).length
    }
    catch { return null }
  }))
  return <div className="mx-auto max-w-6xl space-y-6"><Button variant="ghost" render={<Link href="/dashboard/faculty" />}><ArrowLeft /> Faculty directory</Button><div><p className="text-sm font-medium text-primary">People operations</p><h1 className="mt-1 text-3xl font-bold tracking-tight">HR workspace</h1><p className="mt-1 text-sm text-muted-foreground">Employment, attendance, leave, and payroll operations.</p></div><div className="grid gap-4 sm:grid-cols-2">{modules.map((module, index) => { const Icon = module.icon; return <Card key={module.key}><CardHeader className="flex-row items-start justify-between"><span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-700"><Icon className="size-5" /></span><span className="text-2xl font-bold">{counts[index] ?? "—"}</span></CardHeader><CardContent><CardTitle>{module.label}</CardTitle><p className="mt-2 text-sm text-muted-foreground">{module.description}</p><Button variant="link" className="mt-4 px-0" render={<Link href={module.href} />}>Open {module.label.toLowerCase()}</Button></CardContent></Card> })}</div></div>
}
