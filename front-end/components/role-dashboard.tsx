import Link from "next/link"
import { ArrowRight, BookOpenCheck, CalendarDays, CircleDollarSign, ClipboardCheck, Library, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { SystemRole } from "@/lib/access-policy"
import { ROLE_LABELS } from "@/lib/access-policy"

export type DashboardMetric = { label: string; value: string | number; description?: string }
export type DashboardLink = { label: string; href: string }

const roleContent: Record<Exclude<SystemRole, "super_admin" | "university_admin"> | "custom", { description: string; links: DashboardLink[] }> = {
  registrar: { description: "Coordinate academic structure, enrollment, examinations, and published results.", links: [{ label: "Academic structure", href: "/dashboard/academics" }, { label: "Students", href: "/dashboard/students" }, { label: "Results", href: "/dashboard/results" }] },
  department_head: { description: "Monitor departmental courses, faculty, students, attendance, and results.", links: [{ label: "Courses", href: "/dashboard/academics/courses" }, { label: "Faculty", href: "/dashboard/faculty" }, { label: "Attendance", href: "/dashboard/attendance" }] },
  teacher: { description: "Manage assigned classes, attendance, assessments, LMS content, and supervision.", links: [{ label: "My LMS", href: "/dashboard/lms" }, { label: "Attendance", href: "/dashboard/attendance" }, { label: "Exams & results", href: "/dashboard/results" }] },
  student: { description: "Access registration, courses, learning materials, results, and financial information.", links: [{ label: "Course registration", href: "/dashboard/registration" }, { label: "My LMS", href: "/dashboard/lms" }, { label: "My profile", href: "/dashboard/profile" }] },
  accountant: { description: "Manage tuition structures, invoices, waivers, collections, and expenses.", links: [{ label: "Finance", href: "/dashboard/finance" }, { label: "Issue invoice", href: "/dashboard/finance/invoices/new" }, { label: "Student waiver", href: "/dashboard/finance/waivers/new" }] },
  librarian: { description: "Manage the catalog, copies, circulation, policies, and overdue items.", links: [{ label: "Library", href: "/dashboard/library" }, { label: "Issue book", href: "/dashboard/library/issue" }, { label: "Policies", href: "/dashboard/library/policies" }] },
  hr_manager: { description: "Manage employees, attendance, leave requests, and payroll operations.", links: [{ label: "HR workspace", href: "/dashboard/faculty/hr" }, { label: "Employees", href: "/dashboard/faculty/hr/employees" }, { label: "Payroll", href: "/dashboard/faculty/hr/payroll" }] },
  admission_officer: { description: "Review applications and manage the student admission pipeline.", links: [{ label: "Admissions", href: "/dashboard/admissions" }, { label: "Students", href: "/dashboard/students" }] },
  custom: { description: "Access the university services assigned to your account.", links: [{ label: "Profile", href: "/dashboard/profile" }] },
}

const icons = [Users, BookOpenCheck, ClipboardCheck, CircleDollarSign, Library, CalendarDays]

export function RoleDashboard({ role, firstName, metrics }: { role: Exclude<SystemRole, "super_admin" | "university_admin"> | "custom"; firstName: string; metrics: DashboardMetric[] }) {
  const content = roleContent[role]
  return <div className="mx-auto max-w-[1450px] space-y-7">
    <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-violet-900 p-7 text-white sm:p-9">
      <p className="text-sm font-medium text-blue-200">{ROLE_LABELS[role]}</p>
      <h1 className="mt-2 text-3xl font-bold">Welcome back, {firstName}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{content.description}</p>
    </div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric, index) => { const Icon = icons[index % icons.length]!; return <Card key={metric.label}><CardContent className="p-5"><Icon className="size-5 text-primary" /><p className="mt-4 text-2xl font-bold">{metric.value}</p><p className="text-sm font-medium">{metric.label}</p>{metric.description && <p className="mt-1 text-xs text-muted-foreground">{metric.description}</p>}</CardContent></Card> })}</section>
    <Card><CardHeader><CardTitle>Quick actions</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{content.links.map((link) => <Button key={link.href} variant="outline" className="justify-between" render={<Link href={link.href} />}>{link.label}<ArrowRight /></Button>)}</CardContent></Card>
  </div>
}
