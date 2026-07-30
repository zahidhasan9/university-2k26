import Link from "next/link"
import {
  Activity,
  BarChart3,
  Building2,
  ExternalLink,
  GraduationCap,
  Search,
  Users,
} from "lucide-react"
import { CsvExport } from "@/components/csv-export"
import { PaginationLinks } from "@/components/pagination-links"
import { StudentStatusBadge } from "@/components/student-status"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authenticatedRequest } from "@/lib/auth"
import type { StudentListData } from "@/lib/student-types"

type Department = {
  _id: string
  name: string
  code: string
  programCount: number
  teacherCount: number
  studentCount: number
  activeStudentCount: number
}

const cardStyle =
  "rounded-[24px] border border-slate-100 bg-white py-0 shadow-[0_10px_35px_rgba(30,41,59,0.05)] ring-0"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const rawParams = await searchParams
  const studentSearch = first(rawParams.search) ?? ""
  const studentStatus = first(rawParams.status) ?? ""
  const studentPage = Math.max(1, Number(first(rawParams.page)) || 1)
  const studentQuery = new URLSearchParams({ page: String(studentPage), limit: "10" })
  if (studentSearch) studentQuery.set("search", studentSearch)
  if (studentStatus) studentQuery.set("status", studentStatus)

  let departments: Department[] = []
  let students: StudentListData | null = null
  let error = ""
  let studentError = ""

  const [departmentResult, studentResult] = await Promise.allSettled([
    authenticatedRequest<{ departments: Department[] }>("/analytics/departments"),
    authenticatedRequest<StudentListData>(`/students?${studentQuery}`),
  ])
  if (departmentResult.status === "fulfilled") {
    departments = departmentResult.value.data.departments
  } else {
    error =
      departmentResult.reason instanceof Error
        ? departmentResult.reason.message
        : "Report data unavailable"
  }
  if (studentResult.status === "fulfilled") {
    students = studentResult.value.data
  } else {
    studentError =
      studentResult.reason instanceof Error
        ? studentResult.reason.message
        : "Student records unavailable"
  }

  const totals = departments.reduce(
    (result, department) => ({
      programs: result.programs + department.programCount,
      teachers: result.teachers + department.teacherCount,
      students: result.students + department.studentCount,
      activeStudents: result.activeStudents + department.activeStudentCount,
    }),
    { programs: 0, teachers: 0, students: 0, activeStudents: 0 },
  )
  const rows = departments.map(
    ({ name, code, programCount, teacherCount, studentCount, activeStudentCount }) => ({
      Department: name,
      Code: code,
      Programs: programCount,
      Teachers: teacherCount,
      Students: studentCount,
      "Active students": activeStudentCount,
    }),
  )

  const metrics = [
    {
      icon: Building2,
      label: "Departments",
      value: departments.length,
      description: "Academic departments",
      tone: "bg-violet-50 text-violet-600",
    },
    {
      icon: GraduationCap,
      label: "Programs",
      value: totals.programs,
      description: "Programs offered",
      tone: "bg-sky-50 text-sky-600",
    },
    {
      icon: Users,
      label: "Students",
      value: totals.students,
      description: "All registered students",
      tone: "bg-amber-50 text-amber-600",
    },
    {
      icon: BarChart3,
      label: "Teachers",
      value: totals.teachers,
      description: "Faculty members",
      tone: "bg-emerald-50 text-emerald-600",
    },
  ]

  return (
    <div className="mx-auto max-w-[1600px] space-y-7">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-400">
            Dashboards <span className="px-2 text-slate-300">/</span>
            <span className="text-violet-600">Reports</span>
          </p>
          <h1 className="mt-3 text-[30px] font-semibold tracking-tight text-slate-800">
            Reports & export
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Department performance report generated from live institutional data.
          </p>
          <p className="mt-4 max-w-3xl rounded-2xl bg-violet-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
            Compare each department by its programs, teachers and registered students. “Active
            students” means students whose current profile status is active.
          </p>
        </div>
        <CsvExport filename="unisphere-department-performance.csv" rows={rows} />
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

      <Card className={cardStyle}>
        <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Department performance</h2>
            <p className="mt-1 text-xs text-slate-400">
              Programs, faculty and student activity by department
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Live report
          </div>
        </div>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/60 hover:bg-slate-50/60">
                <TableHead className="h-12 px-7 text-xs font-semibold text-slate-500">
                  Department
                </TableHead>
                <TableHead className="h-12 text-xs font-semibold text-slate-500">
                  Total programs
                </TableHead>
                <TableHead className="h-12 text-xs font-semibold text-slate-500">
                  Total teachers
                </TableHead>
                <TableHead className="h-12 text-xs font-semibold text-slate-500">
                  Total students
                </TableHead>
                <TableHead className="h-12 pr-7 text-xs font-semibold text-slate-500">
                  Active students (number and %)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length ? (
                departments.map((department) => {
                  const activeRate = department.studentCount
                    ? Math.round((department.activeStudentCount / department.studentCount) * 100)
                    : 0
                  return (
                    <TableRow
                      key={department._id}
                      className="border-slate-100 transition-colors hover:bg-violet-50/30"
                    >
                      <TableCell className="px-7 py-4">
                        <p className="font-semibold text-slate-700">{department.name}</p>
                        <p className="mt-0.5 text-xs font-medium tracking-wide text-slate-400">
                          {department.code}
                        </p>
                      </TableCell>
                      <TableCell className="text-slate-600">{department.programCount}</TableCell>
                      <TableCell className="text-slate-600">{department.teacherCount}</TableCell>
                      <TableCell className="text-slate-600">{department.studentCount}</TableCell>
                      <TableCell className="pr-7">
                        <div className="flex min-w-40 items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                              style={{ width: `${Math.min(activeRate, 100)}%` }}
                            />
                          </div>
                          <span className="min-w-16 text-right text-xs font-semibold text-slate-600">
                            {department.activeStudentCount} ({activeRate}%)
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center">
                    <Activity className="mx-auto mb-3 size-6 text-slate-300" />
                    <p className="text-sm text-slate-400">No department report is available.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className={cardStyle}>
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Individual student records</h2>
            <p className="mt-1 text-xs text-slate-400">
              {students
                ? `${students.pagination.total.toLocaleString()} students found`
                : "Student ID, program, department and current status"}
            </p>
          </div>
          <form
            action="/dashboard/reports"
            className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
          >
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="search"
                defaultValue={studentSearch}
                placeholder="Search student ID"
                className="h-10 rounded-xl border-slate-200 bg-slate-50/60 pl-9"
              />
            </div>
            <select
              name="status"
              defaultValue={studentStatus}
              aria-label="Filter students by status"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-600 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="archived">Archived</option>
            </select>
            <Button
              type="submit"
              className="h-10 rounded-xl bg-violet-600 px-5 hover:bg-violet-700"
            >
              Apply
            </Button>
          </form>
        </div>
        <CardContent className="overflow-x-auto p-0">
          {studentError ? (
            <div className="px-7 py-12 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Student records could not be loaded
              </p>
              <p className="mt-1 text-xs text-rose-500">{studentError}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50/60 hover:bg-slate-50/60">
                  <TableHead className="h-12 px-7 text-xs font-semibold text-slate-500">
                    Student ID
                  </TableHead>
                  <TableHead className="h-12 text-xs font-semibold text-slate-500">Name</TableHead>
                  <TableHead className="h-12 text-xs font-semibold text-slate-500">
                    Department
                  </TableHead>
                  <TableHead className="h-12 text-xs font-semibold text-slate-500">
                    Program
                  </TableHead>
                  <TableHead className="h-12 text-xs font-semibold text-slate-500">
                    Status
                  </TableHead>
                  <TableHead className="h-12 pr-7 text-right text-xs font-semibold text-slate-500">
                    Profile
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.items.length ? (
                  students.items.map((student) => (
                    <TableRow
                      key={student._id}
                      className="border-slate-100 transition-colors hover:bg-violet-50/30"
                    >
                      <TableCell className="px-7 py-4 font-mono text-xs font-semibold text-violet-600">
                        {student.studentId}
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-700">
                          {student.user.firstName} {student.user.lastName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {student.user.email.endsWith("@pending.unisphere.local")
                            ? "Email not added"
                            : student.user.email}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {student.program.department?.name ?? "Not assigned"}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-slate-700">{student.program.code}</p>
                        <p className="mt-0.5 max-w-52 truncate text-xs text-slate-400">
                          {student.program.name}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StudentStatusBadge status={student.status} />
                      </TableCell>
                      <TableCell className="pr-7 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                          render={<Link href={`/dashboard/students/${student._id}`} />}
                        >
                          View <ExternalLink className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center">
                      <Users className="mx-auto mb-3 size-6 text-slate-300" />
                      <p className="text-sm text-slate-400">No matching student was found.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {students && (
          <PaginationLinks
            pathname="/dashboard/reports"
            params={studentQuery}
            page={students.pagination.page}
            totalPages={students.pagination.totalPages}
          />
        )}
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
  value: number
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
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-800">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
        <div className={`flex size-12 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}
