import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpenCheck,
  CircleDollarSign,
  GraduationCap,
  MoreHorizontal,
  Plus,
  UsersRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "Dashboard" }

type Metric = { value: number; changePercent: number | null }
type DashboardActivity = {
  _id: string
  action: string
  resource: string
  createdAt: string
  actor?: { firstName?: string; lastName?: string; email?: string }
}
type DashboardDepartment = {
  _id: string
  name: string
  code: string
  studentCount: number
  teacherCount: number
  performance: number
}
type AdminAnalytics = {
  dashboard: {
    summary: {
      totalStudents: Metric
      totalTeachers: Metric
      activeOfferings: Metric
      revenue: { amountMinor: number; currency: string; changePercent: number | null }
    }
    enrollmentTrend: { _id: { year: number; month: number }; count: number }[]
    recentActivity: DashboardActivity[]
    departments: DashboardDepartment[]
  }
}

function money(amountMinor: number, currency = "BDT") {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100)
}

async function dashboardStats() {
  try {
    const { data } = await authenticatedRequest<AdminAnalytics>("/analytics/admin")
    return { connected: true as const, data: data.dashboard }
  } catch {
    return { connected: false as const, data: null }
  }
}

function metricChange(value: number | null) {
  if (value === null) return { change: "New", up: true }
  return { change: `${value > 0 ? "+" : ""}${value}%`, up: value >= 0 }
}

function activityLabel(action: string) {
  return action.replaceAll(".", " ").replaceAll("_", " ")
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const panelClass =
  "rounded-[24px] border border-slate-100 bg-white py-0 ring-0 shadow-[0_10px_35px_rgba(30,41,59,0.05)]"

export default async function DashboardPage() {
  const stats = await dashboardStats()
  const dashboard = stats.data
  const summary = dashboard?.summary
  const items = summary
    ? [
        {
          label: "Total students",
          value: summary.totalStudents.value.toLocaleString(),
          ...metricChange(summary.totalStudents.changePercent),
          icon: GraduationCap,
          tone: "bg-violet-50 text-violet-600",
        },
        {
          label: "Faculty members",
          value: summary.totalTeachers.value.toLocaleString(),
          ...metricChange(summary.totalTeachers.changePercent),
          icon: UsersRound,
          tone: "bg-fuchsia-50 text-fuchsia-600",
        },
        {
          label: "Active courses",
          value: summary.activeOfferings.value.toLocaleString(),
          ...metricChange(summary.activeOfferings.changePercent),
          icon: BookOpenCheck,
          tone: "bg-sky-50 text-sky-600",
        },
        {
          label: "Revenue collected",
          value: money(summary.revenue.amountMinor, summary.revenue.currency),
          ...metricChange(summary.revenue.changePercent),
          icon: CircleDollarSign,
          tone: "bg-amber-50 text-amber-600",
        },
      ]
    : []
  const enrollmentTrend = dashboard?.enrollmentTrend ?? []
  const enrollmentMaximum = Math.max(...enrollmentTrend.map((point) => point.count), 1)
  const recentActivity = dashboard?.recentActivity ?? []
  const departments = dashboard?.departments ?? []

  return (
    <div className="mx-auto max-w-[1600px] space-y-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-violet-600">Overview</span>
          </div>
          <h1 className="text-[26px] font-semibold tracking-[-0.025em] text-slate-800 sm:text-[30px]">
            Good morning, Mamun!
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Here&apos;s what&apos;s happening across your university today
          </p>
        </div>
        <Button
          className="h-11 self-start rounded-xl bg-violet-600 px-5 shadow-[0_8px_18px_rgba(124,58,237,0.18)] transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-[0_10px_24px_rgba(124,58,237,0.24)] sm:self-auto"
          render={<Link href="/dashboard/students/new" />}
        >
          <Plus /> Add student
        </Button>
      </div>

      {!stats.connected && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-5 py-4 text-sm text-amber-800 shadow-[0_8px_24px_rgba(30,41,59,0.035)]">
          Live analytics are temporarily unavailable. Start the backend and confirm this account has
          dashboard permission.
        </div>
      )}

      {dashboard && (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map(({ label, value, change, up, icon: Icon, tone }) => (
            <Card
              key={`${label}-${value}`}
              className="rounded-[22px] border border-slate-100 bg-white py-0 ring-0 shadow-[0_10px_35px_rgba(30,41,59,0.055)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_42px_rgba(30,41,59,0.085)]"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
                    <Icon className="size-5" strokeWidth={1.7} />
                  </div>
                  <Badge
                    variant="secondary"
                    className={`h-6 border-0 px-2.5 ${
                      up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {up ? <ArrowUpRight /> : <ArrowDownRight />} {change}
                  </Badge>
                </div>
                <div className="mt-6">
                  <p className="text-[27px] font-semibold tracking-[-0.03em] text-slate-800">
                    {value}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-400">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {dashboard && (
        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card className={panelClass}>
            <CardHeader className="flex-row items-start justify-between border-b border-slate-100 px-7 py-6">
              <div>
                <CardTitle className="text-[16px] font-semibold text-slate-800">
                  Enrollment overview
                </CardTitle>
                <CardDescription className="mt-1 text-xs text-slate-400">
                  Student enrollment over the last six months
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="h-7 rounded-lg border-slate-200 px-3 font-normal text-slate-500"
              >
                Jan – Jun
              </Badge>
            </CardHeader>
            <CardContent className="px-7 pb-7">
              <div className="flex h-72 items-end gap-3 pt-8 sm:gap-5">
                {enrollmentTrend.map((point) => {
                  const height = Math.max(4, (point.count / enrollmentMaximum) * 100)
                  const month = new Intl.DateTimeFormat("en", { month: "short" }).format(
                    new Date(Date.UTC(point._id.year, point._id.month - 1, 1)),
                  )
                  return (
                    <div
                      key={`${point._id.year}-${point._id.month}`}
                      className="flex h-full flex-1 flex-col justify-end gap-3"
                    >
                      <div className="relative flex-1 rounded-xl bg-slate-50">
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-xl bg-gradient-to-t from-violet-600 to-fuchsia-400 shadow-[0_8px_18px_rgba(124,58,237,0.15)] transition-opacity hover:opacity-85"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-center text-xs text-slate-400">{month}</span>
                    </div>
                  )
                })}
                {enrollmentTrend.length === 0 && (
                  <div className="grid h-full w-full place-items-center text-sm text-slate-400">
                    No enrollment data for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader className="border-b border-slate-100 px-7 py-6">
              <CardTitle className="text-[16px] font-semibold text-slate-800">
                Recent activity
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Latest updates from campus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 px-7 py-3">
              {recentActivity.map((item) => {
                const name =
                  [item.actor?.firstName, item.actor?.lastName].filter(Boolean).join(" ") ||
                  item.actor?.email ||
                  "System"
                const initials =
                  name === "System"
                    ? "SY"
                    : name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                return (
                  <div
                    key={item._id}
                    className="flex gap-3 border-b border-slate-100 py-4 last:border-0"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet-50 text-xs font-semibold text-violet-600">
                      {initials}
                    </span>
                    <p className="min-w-0 flex-1 text-[13px] leading-5">
                      <span className="font-semibold text-slate-700">{name}</span>{" "}
                      <span className="text-slate-400">{activityLabel(item.action)}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {relativeTime(item.createdAt)}
                      </span>
                    </p>
                  </div>
                )
              })}
              {recentActivity.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-400">No recent activity</div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {dashboard && (
        <Card className={panelClass}>
          <CardHeader className="flex-row items-start justify-between border-b border-slate-100 px-7 py-6">
            <div>
              <CardTitle className="text-[16px] font-semibold text-slate-800">
                Department performance
              </CardTitle>
              <CardDescription className="mt-1 text-xs text-slate-400">
                Current academic engagement by department
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
              <MoreHorizontal />
            </Button>
          </CardHeader>
          <CardContent className="px-7 pb-5">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-slate-400">Department</TableHead>
                  <TableHead className="text-xs font-medium text-slate-400">Students</TableHead>
                  <TableHead className="text-xs font-medium text-slate-400">Faculty</TableHead>
                  <TableHead className="min-w-44 text-xs font-medium text-slate-400">
                    Performance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow
                    key={department.code}
                    className="border-slate-100 transition-colors hover:bg-violet-50/30"
                  >
                    <TableCell>
                      <div className="font-medium text-slate-700">{department.name}</div>
                      <div className="text-xs text-slate-400">{department.code}</div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {department.studentCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-slate-600">{department.teacherCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={department.performance} className="h-2" />
                        <span className="w-9 text-sm font-medium text-slate-600">
                          {department.performance}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {departments.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400">
                No active department data
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
