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

const fallbackStats = [
  {
    label: "Total students",
    value: "12,480",
    change: "+8.2%",
    up: true,
    icon: GraduationCap,
    tone: "bg-violet-50 text-violet-600",
    bars: [38, 52, 45, 68, 62, 82, 76, 92],
  },
  {
    label: "Faculty members",
    value: "842",
    change: "+2.4%",
    up: true,
    icon: UsersRound,
    tone: "bg-fuchsia-50 text-fuchsia-600",
    bars: [42, 36, 54, 48, 63, 60, 72, 78],
  },
  {
    label: "Active courses",
    value: "326",
    change: "+5.1%",
    up: true,
    icon: BookOpenCheck,
    tone: "bg-sky-50 text-sky-600",
    bars: [34, 48, 42, 58, 52, 69, 66, 81],
  },
  {
    label: "Revenue collected",
    value: "৳8.42M",
    change: "-1.3%",
    up: false,
    icon: CircleDollarSign,
    tone: "bg-amber-50 text-amber-600",
    bars: [76, 72, 68, 63, 58, 62, 54, 50],
  },
]

type AggregateCount = { _id: string; count: number }
type AdminAnalytics = {
  students: AggregateCount[]
  teachers: AggregateCount[]
  admissions: AggregateCount[]
  finance: { revenue: { _id: string; amountMinor: number; count: number }[] }
  activeDepartments: number
}

function total(items: AggregateCount[]) {
  return items.reduce((sum, item) => sum + item.count, 0)
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
    const revenue = data.finance.revenue[0]
    return {
      connected: true,
      items: [
        { ...fallbackStats[0], value: total(data.students).toLocaleString() },
        { ...fallbackStats[1], value: total(data.teachers).toLocaleString() },
        { ...fallbackStats[2], value: `${data.activeDepartments} depts` },
        {
          ...fallbackStats[3],
          value: revenue ? money(revenue.amountMinor, revenue._id) : money(0),
        },
      ],
    }
  } catch {
    return {
      connected: false,
      items: fallbackStats.map((item) => ({ ...item, value: "—", change: "Unavailable" })),
    }
  }
}

const activity = [
  {
    initials: "NS",
    name: "Nadia Sultana",
    action: "submitted an admission application",
    time: "8 min ago",
    color: "bg-violet-50 text-violet-600",
  },
  {
    initials: "RH",
    name: "Rafiul Hasan",
    action: "completed semester fee payment",
    time: "24 min ago",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    initials: "TA",
    name: "Tanvir Ahmed",
    action: "published CSE-3201 results",
    time: "45 min ago",
    color: "bg-fuchsia-50 text-fuchsia-600",
  },
  {
    initials: "SM",
    name: "Sadia Mahmud",
    action: "requested a library renewal",
    time: "1 hr ago",
    color: "bg-amber-50 text-amber-600",
  },
]

const departments = [
  {
    name: "Computer Science & Engineering",
    code: "CSE",
    students: 2840,
    faculty: 126,
    performance: 92,
  },
  {
    name: "Business Administration",
    code: "BBA",
    students: 2260,
    faculty: 94,
    performance: 88,
  },
  {
    name: "Electrical & Electronic Engineering",
    code: "EEE",
    students: 1980,
    faculty: 87,
    performance: 85,
  },
  {
    name: "Civil Engineering",
    code: "CE",
    students: 1520,
    faculty: 68,
    performance: 81,
  },
]

const panelClass =
  "rounded-[24px] border border-slate-100 bg-white py-0 ring-0 shadow-[0_10px_35px_rgba(30,41,59,0.05)]"

export default async function DashboardPage() {
  const stats = await dashboardStats()

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

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.items.map(({ label, value, change, up, icon: Icon, tone, bars }) => (
          <Card
            key={label}
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
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[27px] font-semibold tracking-[-0.03em] text-slate-800">
                    {value}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-400">{label}</p>
                </div>
                <div className="flex h-10 items-end gap-1" aria-hidden="true">
                  {bars.map((height, index) => (
                    <span
                      key={`${label}-${index}`}
                      className={`w-1 rounded-full ${up ? "bg-violet-300" : "bg-amber-300"}`}
                      style={{ height: `${height}%`, opacity: 0.35 + index * 0.07 }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

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
              {[52, 68, 61, 78, 72, 91].map((height, index) => (
                <div key={height} className="flex h-full flex-1 flex-col justify-end gap-3">
                  <div className="relative flex-1 rounded-xl bg-slate-50">
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-xl bg-gradient-to-t from-violet-600 to-fuchsia-400 shadow-[0_8px_18px_rgba(124,58,237,0.15)] transition-opacity hover:opacity-85"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-center text-xs text-slate-400">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index]}
                  </span>
                </div>
              ))}
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
            {activity.map((item) => (
              <div
                key={item.name + item.time}
                className="flex gap-3 border-b border-slate-100 py-4 last:border-0"
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-2xl text-xs font-semibold ${item.color}`}
                >
                  {item.initials}
                </span>
                <p className="min-w-0 flex-1 text-[13px] leading-5">
                  <span className="font-semibold text-slate-700">{item.name}</span>{" "}
                  <span className="text-slate-400">{item.action}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">{item.time}</span>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

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
                    {department.students.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-slate-600">{department.faculty}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}
