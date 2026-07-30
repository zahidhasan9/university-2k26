import {
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  FlaskConical,
  GraduationCap,
  Users,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authenticatedRequest } from "@/lib/auth"

type Count = { _id: string; count: number }
type Analytics = {
  period: { from: string; to: string }
  students: Count[]
  teachers: Count[]
  admissions: Count[]
  attendance: Count[]
  research: Count[]
  activeDepartments: number
  finance: {
    revenue: { _id: string; amountMinor: number; count: number }[]
    invoices: { _id: string; billedMinor: number; paidMinor: number; dueMinor: number }[]
  }
  trends: {
    admissions: { _id: { year: number; month: number }; applications: number; approved: number }[]
    revenue: { _id: { year: number; month: number; currency: string }; amountMinor: number }[]
  }
}

const total = (items: Count[]) => items.reduce((sum, item) => sum + item.count, 0)
const statusLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  graduated: "Graduated",
  suspended: "Suspended",
  pending: "Pending review",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
  ongoing: "Ongoing",
  completed: "Completed",
  published: "Published",
  defense_scheduled: "Defense scheduled",
}
const readableStatus = (status: string) =>
  statusLabels[status] ??
  status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
const cardStyle =
  "rounded-[24px] border border-slate-100 bg-white py-0 shadow-[0_10px_35px_rgba(30,41,59,0.05)] ring-0"

export default async function AnalyticsPage() {
  let data: Analytics | undefined
  let error = ""

  try {
    data = (await authenticatedRequest<Analytics>("/analytics/admin")).data
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Analytics unavailable"
  }

  const revenue = data?.finance.revenue.reduce((sum, item) => sum + item.amountMinor, 0) ?? 0
  const metrics = [
    {
      icon: GraduationCap,
      label: "Students",
      value: total(data?.students ?? []).toLocaleString(),
      description: "All registered students",
      tone: "bg-violet-50 text-violet-600",
    },
    {
      icon: Users,
      label: "Teachers",
      value: total(data?.teachers ?? []).toLocaleString(),
      description: "All faculty members",
      tone: "bg-sky-50 text-sky-600",
    },
    {
      icon: FileText,
      label: "Admissions",
      value: total(data?.admissions ?? []).toLocaleString(),
      description: "Applications in this period",
      tone: "bg-amber-50 text-amber-600",
    },
    {
      icon: CircleDollarSign,
      label: "Revenue",
      value: `৳${(revenue / 100).toLocaleString()}`,
      description: "Completed payments",
      tone: "bg-emerald-50 text-emerald-600",
    },
  ]

  return (
    <div className="mx-auto max-w-[1600px] space-y-7">
      <header>
        <p className="text-xs font-semibold tracking-wide text-slate-400">
          Dashboards <span className="px-2 text-slate-300">/</span>
          <span className="text-violet-600">Analytics</span>
        </p>
        <div className="mt-3">
          <h1 className="text-[30px] font-semibold tracking-tight text-slate-800">Analytics</h1>
          <p className="mt-1 text-sm text-slate-400">
            {data
              ? `${new Date(data.period.from).toLocaleDateString()} – ${new Date(data.period.to).toLocaleDateString()}`
              : "Live institutional performance overview"}
          </p>
          <p className="mt-4 max-w-3xl rounded-2xl bg-violet-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
            This page shows total students, teachers, admission applications and received revenue.
            The sections below explain how each total is divided by status.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Metric key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Breakdown
          title="Student status"
          subtitle="How all registered students are distributed"
          icon={GraduationCap}
          items={data?.students ?? []}
        />
        <Breakdown
          title="Attendance status"
          subtitle="Present, absent and late attendance records"
          icon={ClipboardCheck}
          items={data?.attendance ?? []}
        />
        <Breakdown
          title="Admission pipeline"
          subtitle="Where admission applications currently stand"
          icon={FileText}
          items={data?.admissions ?? []}
        />
        <Breakdown
          title="Research portfolio"
          subtitle="Current state of research projects"
          icon={FlaskConical}
          items={data?.research ?? []}
        />
      </section>

      <Card className={cardStyle}>
        <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Admission trend</h2>
            <p className="mt-1 text-xs text-slate-400">
              Monthly applications and approval performance
            </p>
          </div>
          <span className="w-fit rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-600">
            Live data
          </span>
        </div>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/60 hover:bg-slate-50/60">
                <TableHead className="h-12 px-7 text-xs font-semibold text-slate-500">
                  Month
                </TableHead>
                <TableHead className="h-12 text-xs font-semibold text-slate-500">
                  Total applications
                </TableHead>
                <TableHead className="h-12 text-xs font-semibold text-slate-500">
                  Applications approved
                </TableHead>
                <TableHead className="h-12 pr-7 text-xs font-semibold text-slate-500">
                  Approval rate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.trends.admissions.length ? (
                data.trends.admissions.map((item) => {
                  const approvalRate = item.applications
                    ? Math.round((item.approved / item.applications) * 100)
                    : 0
                  return (
                    <TableRow
                      key={`${item._id.year}-${item._id.month}`}
                      className="border-slate-100 transition-colors hover:bg-violet-50/30"
                    >
                      <TableCell className="px-7 py-4 font-semibold text-slate-700">
                        {new Date(item._id.year, item._id.month - 1).toLocaleString("en", {
                          month: "long",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-slate-600">{item.applications}</TableCell>
                      <TableCell className="text-slate-600">{item.approved}</TableCell>
                      <TableCell className="pr-7">
                        <div className="flex min-w-32 items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-violet-500"
                              style={{ width: `${Math.min(approvalRate, 100)}%` }}
                            />
                          </div>
                          <span className="w-9 text-right text-xs font-semibold text-slate-600">
                            {approvalRate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-sm text-slate-400">
                    No admission trend is available for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({
  icon: Icon,
  value,
  label,
  tone,
  description,
}: {
  icon: React.ElementType
  value: string
  label: string
  tone: string
  description: string
}) {
  return (
    <Card
      className={`${cardStyle} transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(30,41,59,0.09)]`}
    >
      <CardContent className="flex items-center justify-between px-6 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-800">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
        <div className={`flex size-12 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function Breakdown({
  title,
  subtitle,
  icon: Icon,
  items,
}: {
  title: string
  subtitle: string
  icon: React.ElementType
  items: Count[]
}) {
  const itemTotal = total(items)

  return (
    <Card className={cardStyle}>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Icon className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-slate-800">{itemTotal.toLocaleString()}</p>
          <p className="text-[11px] font-medium text-slate-400">Total records</p>
        </div>
      </div>
      <CardContent className="space-y-4 px-6 py-5 sm:px-7">
        {items.length ? (
          items.map((item) => {
            const percentage = itemTotal ? Math.round((item.count / itemTotal) * 100) : 0
            return (
              <div key={item._id}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-600">
                    {readableStatus(item._id)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {item.count.toLocaleString()} · {percentage}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <p className="py-7 text-center text-sm text-slate-400">No records in this period.</p>
        )}
      </CardContent>
    </Card>
  )
}
