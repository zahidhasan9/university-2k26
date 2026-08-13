import Link from "next/link"
import { AlertTriangle, CalendarCheck2, Plus } from "lucide-react"

import type { CurrentUser } from "@/components/dashboard-header"
import { AttendanceActions } from "@/components/attendance-actions"
import { PaginationLinks } from "@/components/pagination-links"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"
import { StudentAttendanceCheckIn } from "@/components/student-attendance-check-in"

type Session = {
  _id: string
  offering: { section: string; batch: string; course: { code: string; title: string } }
  date: string
  endsAt?: string
  sessionNumber?: number
  classType?: string
  room?: string
  topic?: string
  status: string
}
type Data = {
  items: Session[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const currentUser = (await authenticatedRequest<{ user: CurrentUser }>(API_ENDPOINTS.auth.me))
    .data.user
  if (currentUser.roles.some((role) => role.code === "student")) return <StudentAttendance />

  const raw = await searchParams
  const page = Math.max(1, Number(raw.page) || 1)
  const status = raw.status ?? ""
  const query = new URLSearchParams({ page: String(page), limit: "12" })
  if (status) query.set("status", status)
  let data: Data | null = null
  let error = ""
  try {
    data = (await authenticatedRequest<Data>(`${API_ENDPOINTS.attendance.sessions}?${query}`)).data
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Attendance unavailable"
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Academic operations</p>
          <h1 className="mt-1 text-3xl font-bold">Class attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One attendance session for every course class, lab or tutorial.
          </p>
        </div>
        <Button render={<Link href="/dashboard/attendance/new" />}>
          <Plus /> New class session
        </Button>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between border-b">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck2 className="size-5 text-primary" /> Sessions
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {data?.pagination.total ?? 0} class sessions
            </p>
          </div>
          <form>
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button type="submit" variant="secondary" className="ml-2">
              Apply
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p className="p-10 text-center text-destructive">{error}</p>
          ) : data?.items.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Batch / section</TableHead>
                    <TableHead>Date & time</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((session) => (
                    <TableRow key={session._id}>
                      <TableCell>
                        <p className="font-medium">{session.offering.course.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.offering.course.title}
                        </p>
                      </TableCell>
                      <TableCell>
                        {session.offering.batch}/{session.offering.section}
                      </TableCell>
                      <TableCell>
                        <p>{new Date(session.date).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {clock(session.date)}
                          {session.endsAt ? `–${clock(session.endsAt)}` : ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium capitalize">
                          #{session.sessionNumber ?? "—"} · {session.classType ?? "Class"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.room ?? "Room not set"}
                        </p>
                      </TableCell>
                      <TableCell>{session.topic ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AttendanceActions id={session._id} status={session.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationLinks
                pathname="/dashboard/attendance"
                params={query}
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
              />
            </>
          ) : (
            <div className="p-12 text-center">
              <CalendarCheck2 className="mx-auto size-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No class sessions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function clock(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}
type MineData = {
  byCourse: Array<{
    offeringId: string
    courseCode: string
    courseTitle: string
    total: number
    countedClasses: number
    attended: number
    present: number
    late: number
    excused: number
    absent: number
    percentage: number
    belowRequirement: boolean
  }>
  minimumRequiredPercentage: number
}
async function StudentAttendance() {
  const data = (await authenticatedRequest<MineData>(API_ENDPOINTS.attendance.mine)).data
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Student portal</p>
        <h1 className="mt-1 text-3xl font-bold">My attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Course-wise attendance calculated from every recorded class.
        </p>
      </div>
      <StudentAttendanceCheckIn />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.byCourse.map((course) => (
          <Card key={course.offeringId} className={course.belowRequirement ? "ring-amber-300" : ""}>
            <CardHeader className="border-b">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold">{course.courseCode}</p>
                  <CardTitle className="mt-1">{course.courseTitle}</CardTitle>
                </div>
                {course.belowRequirement && <AlertTriangle className="size-5 text-amber-600" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p
                    className={`text-3xl font-bold ${course.belowRequirement ? "text-amber-700" : "text-emerald-700"}`}
                  >
                    {course.percentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Minimum {data.minimumRequiredPercentage}% required
                  </p>
                </div>
                <p className="text-right text-sm">
                  <span className="font-semibold">
                    {course.attended}/{course.countedClasses}
                  </span>
                  <br />
                  <span className="text-muted-foreground">counted classes</span>
                </p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${course.belowRequirement ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, course.percentage)}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-4 text-center text-xs">
                <Stat label="Present" value={course.present} />
                <Stat label="Late" value={course.late} />
                <Stat label="Excused" value={course.excused} />
                <Stat label="Absent" value={course.absent} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!data.byCourse.length && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No attendance records are available yet.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-semibold text-foreground">{value}</p>
      <p>{label}</p>
    </div>
  )
}
